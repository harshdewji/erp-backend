const db        = require('../config/db');
const bcrypt    = require('bcryptjs');
const nodemailer = require('nodemailer');

/* ── Nodemailer transporter ──────────────────────────── */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // SMTP password or App Password
  },
});

/* ── Generate 6-digit OTP ──────────────────────────── */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/* ─────────────────────────────────────────────────────
   POST /api/auth/forgot-password
   Body: { email }
   ───────────────────────────────────────────────────── */
const sendForgotOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    // 1. Find user
    const result = await db.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    // Security: always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If that email is registered, an OTP has been sent.' });
    }

    // 2. Generate OTP & expiry (10 minutes)
    const otp     = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // 3. Save OTP to DB
    await db.query(
      'UPDATE users SET otp = $1, otp_expires_at = $2 WHERE id = $3',
      [otp, expires, user.id]
    );

    // 4. Send email
    await transporter.sendMail({
      from: `"Noctra ERP" <${process.env.EMAIL_USER}>`,
      to:   user.email,
      subject: 'Your Password Reset OTP — Noctra ERP',
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#f5f3ef;border-radius:16px;overflow:hidden;border:1px solid #e8e4da;">
          <div style="background:linear-gradient(135deg,#b8862c,#d4a853);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:1.5rem;font-weight:800;letter-spacing:-0.5px;">Noctra ERP</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;">Student Portal</p>
          </div>
          <div style="padding:36px 32px;background:#fff;">
            <p style="margin:0 0 8px;font-size:1rem;color:#1c1917;font-weight:600;">Hi ${user.name},</p>
            <p style="margin:0 0 28px;font-size:0.9rem;color:#78716c;line-height:1.6;">
              We received a request to reset your password. Use the OTP below to proceed. 
              It expires in <strong>10 minutes</strong>.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;background:#f5f3ef;border:2px dashed #b8862c;border-radius:14px;padding:18px 40px;">
                <span style="font-size:2.4rem;font-weight:900;letter-spacing:0.35em;color:#b8862c;font-family:monospace;">${otp}</span>
              </div>
            </div>
            <p style="margin:24px 0 0;font-size:0.8rem;color:#a8a29e;text-align:center;line-height:1.6;">
              If you didn't request this, ignore this email — your account remains secure.<br/>
              Never share this OTP with anyone.
            </p>
          </div>
          <div style="background:#f5f3ef;padding:16px;text-align:center;border-top:1px solid #e8e4da;">
            <p style="margin:0;font-size:0.72rem;color:#a8a29e;">© ${new Date().getFullYear()} Noctra ERP · All rights reserved</p>
          </div>
        </div>
      `,
    });

    return res.json({ message: 'OTP sent to your registered email address.' });
  } catch (err) {
    console.error('sendForgotOTP error:', err);
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

/* ─────────────────────────────────────────────────────
   POST /api/auth/verify-otp
   Body: { email, otp }
   ───────────────────────────────────────────────────── */
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

  try {
    const result = await db.query(
      'SELECT id, otp, otp_expires_at FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    if (!user || !user.otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    if (user.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    return res.json({ message: 'OTP verified successfully.', verified: true });
  } catch (err) {
    console.error('verifyOTP error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

/* ─────────────────────────────────────────────────────
   POST /api/auth/reset-password
   Body: { email, otp, newPassword }
   ───────────────────────────────────────────────────── */
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const result = await db.query(
      'SELECT id, otp, otp_expires_at FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    if (!user || !user.otp || user.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: 'OTP has expired. Please start over.' });
    }

    // Hash new password & clear OTP
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password = $1, otp = NULL, otp_expires_at = NULL WHERE id = $2',
      [hashed, user.id]
    );

    return res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { sendForgotOTP, verifyOTP, resetPassword };
