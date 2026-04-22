const db = require('../config/db');

// PLACEMENTS
const getPlacements = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, s.id as student_uid, u.name as student_name 
      FROM official_placements p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY p.placement_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addPlacement = async (req, res) => {
  const { student_id, company_name, package_offered, position } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO official_placements (student_id, company_name, package_offered, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, company_name, package_offered, position]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ALUMNI
const getAlumni = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.name as alumni_name, u.email, c.name as course_name
      FROM alumni a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN courses c ON s.course_id = c.id
      ORDER BY a.graduation_year DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SCHOLARSHIPS
const getScholarships = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM scholarships ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// MESSAGING
const getMessages = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(`
      SELECT m.*, u.name as sender_name 
      FROM official_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.receiver_id = $1
      ORDER BY m.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const sendMessage = async (req, res) => {
  const sender_id = req.user.id;
  const { receiver_id, subject, content } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO official_messages (sender_id, receiver_id, subject, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender_id, receiver_id, subject, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// EVENTS
const getEvents = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM institutional_events ORDER BY event_date ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getPlacements,
  addPlacement,
  getAlumni,
  getScholarships,
  getMessages,
  sendMessage,
  getEvents
};
