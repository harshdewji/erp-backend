const db = require('../config/db');
const { createObjectCsvWriter } = require('csv-writer');
const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const path = require('path');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyHere1',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YourTestSecretHere12345',
});

// --- GRADE CALCULATION HELPER ---
const calculateGrade = (marks) => {
  if (marks >= 90) return 'A';
  if (marks >= 80) return 'B';
  if (marks >= 70) return 'C';
  if (marks >= 60) return 'D';
  return 'F';
};

// --- FEES MODULE ---
const addFeeRecord = async (req, res) => {
  const { student_id, amount, status, due_date } = req.body;
  try {
    const paidAmount = status === 'Paid' ? amount : 0;
    const result = await db.query(
      'INSERT INTO fee_records (student_id, total_amount, paid_amount, status, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [student_id, amount, paidAmount, status || 'Pending', due_date || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeesByStudent = async (req, res) => {
  let { studentId } = req.params;
  
  // If student is fetching their own, we might need to translate user.id to student.id
  if (req.user.role === 'Student' && studentId == req.user.id) {
    const studentInfo = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentInfo.rows.length > 0) studentId = studentInfo.rows[0].id;
  }

  try {
    const result = await db.query('SELECT f.*, f.total_amount as amount FROM fee_records f WHERE f.student_id = $1 ORDER BY f.due_date DESC', [studentId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllFees = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT f.*, f.total_amount as amount, u.name as student_name
      FROM fee_records f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY f.due_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadFeeReceipt = async (req, res) => {
  const { feeId } = req.params;
  try {
    const fee = await db.query(`
      SELECT f.*, u.name as student_name, u.email 
      FROM fee_records f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE f.id = $1
    `, [feeId]);

    if (fee.rows.length === 0) return res.status(404).json({ message: 'Fee record not found' });

    const data = fee.rows[0];
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('NOCTRA ERP - OFFICIAL FEE RECEIPT', 20, 20);
    doc.setFontSize(12);
    doc.text(`Transaction ID: NOC-${String(data.id).padStart(6, '0')}`, 20, 40);
    doc.text(`Student Name: ${data.student_name}`, 20, 50);
    doc.text(`Institution Email: ${data.email}`, 20, 60);
    doc.text(`Total Amount: INR ${parseFloat(data.total_amount).toLocaleString('en-IN')}`, 20, 70);
    doc.text(`Paid Amount: INR ${parseFloat(data.paid_amount).toLocaleString('en-IN')}`, 20, 80);
    doc.text(`Status: ${data.status}`, 20, 90);
    doc.text(`Settlement Date: ${new Date(data.created_at).toLocaleDateString('en-IN')}`, 20, 100);

    const pdfBuffer = doc.output('arraybuffer');
    res.contentType("application/pdf");
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- EXAMS & RESULTS ---
const addResult = async (req, res) => {
  const { exam_id, student_id, marks, total_marks, subject } = req.body;
  const grade = calculateGrade(marks);
  try {
    const result = await db.query(
      'INSERT INTO results (exam_id, student_id, marks, total_marks, subject, grade) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [exam_id, student_id, marks, total_marks || 100, subject || null, grade]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getResultsByStudent = async (req, res) => {
  let { studentId } = req.params;

  // Translation if needed
  if (req.user.role === 'Student' && studentId == req.user.id) {
    const studentInfo = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentInfo.rows.length > 0) studentId = studentInfo.rows[0].id;
  }

  try {
    const result = await db.query(`
      SELECT r.*, e.name as exam_name, e.date as exam_date, c.name as course_name
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE r.student_id = $1
      ORDER BY e.date DESC
    `, [studentId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- EXPORT FUNCTIONALITY ---
const exportStudents = async (req, res) => {
  try {
    const students = await db.query(`
      SELECT u.name, u.email, c.name as course_name 
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN courses c ON s.course_id = c.id
    `);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Students');
    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Course', key: 'course_name', width: 25 },
    ];
    sheet.addRows(students.rows);

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', 'attachment; filename=students.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- PROFILE UPLOAD ---
const uploadProfileImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const filePath = `/uploads/${req.file.filename}`;
    await db.query('UPDATE users SET profile_image = $1 WHERE id = $2', [filePath, req.user.id]);
    res.json({ message: 'Profile image updated', filePath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Keep existing methods and add new ones
module.exports = {
  addFeeRecord,
  getFeesByStudent,
  getAllFees,
  downloadFeeReceipt,
  addResult,
  getResultsByStudent,
  exportStudents,
  uploadProfileImage,
  // ... including existing dashboard/notification methods
  getDashboardStats: async (req, res) => {
    try {
      if (req.user.role === 'Student') {
        // Get the actual student_id from the students table using the user_id
        const studentInfo = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
        
        if (studentInfo.rows.length === 0) {
          return res.json({
            isStudent: true,
            attendance_pct: 0,
            avg_marks: 0,
            pending_fees: 0,
            course_name: 'Not Enrolled',
            recentResults: []
          });
        }

        const studentId = studentInfo.rows[0].id;

        const stats = await db.query(`
          SELECT 
            (SELECT COUNT(*) FROM attendance WHERE student_id = $1 AND status = 'Present')*100.0 / NULLIF((SELECT COUNT(*) FROM attendance WHERE student_id = $1), 0) as attendance_pct,
            (SELECT AVG(marks) FROM results WHERE student_id = $1) as avg_marks,
            (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM fee_records WHERE student_id = $1 AND status != 'Paid') as pending_fees,
            (SELECT c.name FROM students s JOIN courses c ON s.course_id = c.id WHERE s.id = $1) as course_name
        `, [studentId]);
        
        const recentResults = await db.query(`
          SELECT r.*, e.name as exam_name, e.subject 
          FROM results r 
          JOIN exams e ON r.exam_id = e.id 
          WHERE r.student_id = $1 
          ORDER BY e.date DESC LIMIT 5
        `, [studentId]);

        return res.json({
          isStudent: true,
          ...stats.rows[0],
          recentResults: recentResults.rows
        });
      }

      const stats = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM students) as total_students,
          (SELECT COUNT(*) FROM courses) as total_courses,
          (SELECT COUNT(*) FROM staff) as total_staff,
          (SELECT COUNT(*) FROM departments) as total_departments,
          (SELECT COALESCE(SUM(paid_amount), 0) FROM fee_records WHERE status = 'Paid') as fees_paid,
          (SELECT COUNT(*) FROM official_placements) as total_placements,
          (SELECT COUNT(*) FROM scholarships) as total_scholarships,
          (SELECT COUNT(*) FROM institutional_events WHERE event_date > CURRENT_TIMESTAMP) as upcoming_events_count,
          (SELECT COUNT(*) FROM (
            SELECT student_id FROM attendance GROUP BY student_id HAVING (COUNT(CASE WHEN status='Present' THEN 1 END)*100.0/NULLIF(COUNT(*), 0)) < 75
          ) as low_att) as low_attendance_count,
          (SELECT ROUND(AVG(attendance_pct), 1) FROM (
             SELECT (COUNT(CASE WHEN status='Present' THEN 1 END)*100.0/NULLIF(COUNT(*), 0)) as attendance_pct 
             FROM attendance GROUP BY student_id
          ) as inst_att) as avg_institutional_attendance
      `);
      
      const topStudents = await db.query(`
        SELECT u.name, COALESCE(AVG(marks),0) as avg_marks
        FROM results r
        JOIN students s ON r.student_id = s.id
        JOIN users u ON s.user_id = u.id
        GROUP BY u.name
        ORDER BY avg_marks DESC
        LIMIT 5
      `);

      const recentEvents = await db.query(`
        SELECT * FROM institutional_events 
        WHERE event_date > CURRENT_TIMESTAMP 
        ORDER BY event_date ASC 
        LIMIT 3
      `);

      const deptDistribution = await db.query(`
        SELECT d.name, COUNT(s.id) as count
        FROM departments d
        LEFT JOIN staff s ON d.id = s.department_id
        GROUP BY d.name
      `);

      const subjectAverages = await db.query(`
        SELECT e.subject, AVG(r.marks) as avg_score
        FROM results r
        JOIN exams e ON r.exam_id = e.id
        GROUP BY e.subject
        LIMIT 6
      `);

      res.json({ 
        isStudent: false,
        ...stats.rows[0], 
        topStudents: topStudents.rows,
        recentEvents: recentEvents.rows,
        deptDistribution: deptDistribution.rows,
        subjectAverages: subjectAverages.rows
      });
    } catch (err) { res.status(500).json({ message: err.message }); }
  },
  getNotifications: async (req, res) => {
    try {
      const notes = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
      res.json(notes.rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
  },
  markNotificationRead: async (req, res) => {
    try {
      await db.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
      res.json({ message: 'Marked as read' });
    } catch (err) { res.status(500).json({ message: err.message }); }
  },
  createExam: async (req, res) => {
    const { course_id, name, date } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO exams (course_id, name, date) VALUES ($1, $2, $3) RETURNING *',
        [course_id, name, date]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: err.message }); }
  },
  getExamsByCourse: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM exams WHERE course_id = $1 ORDER BY date DESC', [req.params.courseId]);
      res.json(result.rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
  },

  // --- LIBRARY MODULE ---
  getBooks: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM books ORDER BY title ASC');
      res.json(result.rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
  },
  addBook: async (req, res) => {
    const { title, author, isbn, quantity } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO books (title, author, isbn, quantity, available) VALUES ($1, $2, $3, $4, $4) RETURNING *',
        [title, author, isbn, quantity]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: err.message }); }
  },

  // --- HOSTEL MODULE ---
  getHostels: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT h.*, 
               (SELECT COUNT(*) FROM rooms WHERE hostel_id = h.id) as total_rooms,
               (SELECT SUM(occupancy) FROM rooms WHERE hostel_id = h.id) as occupied_beds
        FROM hostels h
      `);
      res.json(result.rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
  },
  getRooms: async (req, res) => {
    try {
      const result = await db.query('SELECT r.*, h.name as hostel_name FROM rooms r JOIN hostels h ON r.hostel_id = h.id');
      res.json(result.rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
  },

  // --- TRANSPORT MODULE ---
  getTransportRoutes: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM transport_routes ORDER BY route_name ASC');
      res.json(result.rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
  },

  // --- SETTLEMENT MODULE ---
  createRazorpayOrder: async (req, res) => {
    try {
      const { amount } = req.body;
      const options = {
        amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_${req.user.id}_${Date.now()}`
      };
      
      // If using the placeholder key, return a mock order to allow the demo to proceed
      if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YourTestKey')) {
         return res.json({ 
            id: `order_mock_${Date.now()}`, 
            amount: options.amount, 
            currency: "INR", 
            key_id: "rzp_test_1DP5mmOlF5G5ag", // Public test key for UI rendering
            is_mock: true 
         });
      }

      const order = await razorpay.orders.create(options);
      res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
      console.error('Razorpay Order Error:', error);
      res.status(500).json({ message: "Failed to create Razorpay order", error: error.message });
    }
  },

  verifyRazorpayPayment: async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YourTestSecretHere12345')
        .update(body.toString())
        .digest('hex');
        
      if (razorpay_order_id.startsWith('order_mock_') || expectedSignature === razorpay_signature) {
        // Payment is verified (or bypassed in mock mode)
        const studentInfo = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
        if (studentInfo.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
        const studentId = studentInfo.rows[0].id;

        const updateResult = await db.query(`
          UPDATE fee_records 
          SET status = 'Paid', paid_amount = total_amount 
          WHERE student_id = $1 AND status = 'Pending'
          RETURNING *
        `, [studentId]);
        
        res.json({ message: "Payment verified successfully", updated: updateResult.rows.length });
      } else {
        res.status(400).json({ message: "Invalid signature" });
      }
    } catch (error) {
      console.error('Razorpay Verify Error:', error);
      res.status(500).json({ message: "Payment verification failed", error: error.message });
    }
  },

  settleFees: async (req, res) => {
    try {
      const studentInfo = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
      if (studentInfo.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
      const studentId = studentInfo.rows[0].id;

      const updateResult = await db.query(`
        UPDATE fee_records 
        SET status = 'Paid', paid_amount = total_amount 
        WHERE student_id = $1 AND status = 'Pending'
        RETURNING *
      `, [studentId]);

      if (updateResult.rows.length === 0) {
        return res.status(200).json({ message: 'No outstanding arrears found for settlement.', updated: 0 });
      }

      res.json({ 
        message: 'Financial accounts consolidated successfully.', 
        updated: updateResult.rows.length 
      });
    } catch (err) { 
      console.error('Settlement Error:', err);
      res.status(500).json({ message: 'Institutional gateway synchronization failure.' }); 
    }
  }
};
