const db = require('../config/db');

const getAllUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleUserActive = async (req, res) => {
  const { id } = req.params;
  try {
    const targetUser = await db.query('SELECT is_active, role FROM users WHERE id = $1', [id]);
    if (targetUser.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    
    // Safety check: Teachers cannot toggle Admins
    if (req.user.role === 'Teacher' && targetUser.rows[0].role === 'Admin') {
      return res.status(403).json({ message: 'Access Denied: Insufficient clearance to modify Administrative Identity' });
    }
    
    const newStatus = !targetUser.rows[0].is_active;
    await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [newStatus, id]);
    
    res.json({ message: `Identity ${newStatus ? 'Verified' : 'Restricted'} successfully`, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSystemSettings = async (req, res) => {
   // Implementation for system settings (e.g. college name, term date)
   res.json({ message: 'Settings updated' });
};

const getMyProfile = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, profile_image FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllUsers,
  toggleUserActive,
  updateSystemSettings,
  getMyProfile
};
