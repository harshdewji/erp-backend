const db = require('../config/db');

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
const createCourse = async (req, res) => {
  const { name, degree, branch, duration_years, total_seats, description } = req.body;

  if (!name) return res.status(400).json({ message: 'Course name is required' });

  try {
    const result = await db.query(
      `INSERT INTO courses (name, degree, branch, duration_years, total_seats, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, degree || null, branch || null, duration_years || 4, total_seats || 60, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign student to course
// @route   PUT /api/courses/assign
// @access  Private/Admin
const assignStudentToCourse = async (req, res) => {
  const { student_id, course_id } = req.body;
  try {
    const result = await db.query(
      'UPDATE students SET course_id = $1 WHERE id = $2 RETURNING *',
      [course_id, student_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student assigned to course successfully', student: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all courses (with student count)
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*,
             COUNT(s.id) AS enrolled_students
      FROM courses c
      LEFT JOIN students s ON s.course_id = c.id
      GROUP BY c.id
      ORDER BY c.degree ASC, c.branch ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCourse, deleteCourse, assignStudentToCourse, getCourses };
