const db = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Add a student (Admin only)
// @route   POST /api/students
// @access  Private/Admin
const addStudent = async (req, res) => {
  const { name, email, password, course_id } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Transaction for atomicity
    await db.query('BEGIN');
    
    const userResult = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, 'Student']
    );

    const userId = userResult.rows[0].id;

    const studentResult = await db.query(
      'INSERT INTO students (user_id, course_id) VALUES ($1, $2) RETURNING *',
      [userId, course_id]
    );

    await db.query('COMMIT');

    res.status(201).json({
      message: 'Student added successfully',
      student: studentResult.rows[0],
    });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getAllStudents = async (req, res) => {
  try {
    const students = await db.query(`
      SELECT s.id, u.name, u.email, c.name as course_name 
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN courses c ON s.course_id = c.id
    `);
    res.json(students.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, course_id } = req.body;

  try {
    // Get user_id first
    const student = await db.query('SELECT user_id FROM students WHERE id = $1', [id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const userId = student.rows[0].user_id;

    await db.query('BEGIN');
    
    await db.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name, email, userId]);
    await db.query('UPDATE students SET course_id = $1 WHERE id = $2', [course_id, id]);

    await db.query('COMMIT');

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await db.query('SELECT user_id FROM students WHERE id = $1', [id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const userId = student.rows[0].user_id;

    // On delete cascade will handle students/attendance if set up in schema
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Student and associated user deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addStudent, getAllStudents, updateStudent, deleteStudent };
