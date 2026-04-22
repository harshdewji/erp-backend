const db = require('../config/db');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private/Admin/Teacher
const getAllAttendance = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.id, a.date, a.check_in_time, a.status, a.student_id,
              u.name as student_name, c.name as course_name
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN courses c ON s.course_id = c.id
       ORDER BY a.date DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private/Teacher
const markAttendance = async (req, res) => {
  const { student_id, date, status } = req.body;

  if (!student_id || !status) {
    return res.status(400).json({ message: 'student_id and status are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO attendance (student_id, date, status) VALUES ($1, $2, $3) RETURNING *',
      [student_id, date || new Date(), status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance by student
// @route   GET /api/attendance/student/:id
// @access  Private
const getAttendanceByStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT a.id, a.date, a.check_in_time, a.status, u.name as student_name 
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE a.student_id = $1
       ORDER BY a.date DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Student self check-in
// @route   POST /api/attendance/check-in
// @access  Private/Student
const studentCheckIn = async (req, res) => {
  const userId = req.user.id;
  const currentTime = new Date();
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const checkInTimeString = `${hours}:${minutes}:${currentTime.getSeconds()}`;
  
  // Late if after 9:00 AM
  let status = 'Present';
  if (hours > 9 || (hours === 9 && minutes > 0)) {
    status = 'Late';
  }

  try {
    // 1. Get student_id from user_id
    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    const studentId = studentResult.rows[0].id;

    // 2. Check if already checked in today
    const existingResult = await db.query(
      'SELECT id FROM attendance WHERE student_id = $1 AND date = CURRENT_DATE',
      [studentId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'You have already checked in for today' });
    }

    // 3. Mark attendance
    const attendanceResult = await db.query(
      'INSERT INTO attendance (student_id, date, check_in_time, status) VALUES ($1, CURRENT_DATE, $2, $3) RETURNING *',
      [studentId, checkInTimeString, status]
    );

    // 4. Notify admin if late
    if (status === 'Late') {
      const studentNameResult = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
      const studentName = studentNameResult.rows[0].name;
      
      const adminUsers = await db.query("SELECT id FROM users WHERE role = 'Admin'");
      
      const notificationPromises = adminUsers.rows.map(admin => {
        return db.query(
          'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
          [admin.id, `Student ${studentName} checked in late at ${checkInTimeString}`]
        );
      });
      
      await Promise.all(notificationPromises);
    }

    res.status(201).json({
      message: status === 'Late' ? 'Checked in late. Admin has been notified.' : 'Checked in successfully.',
      attendance: attendanceResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { markAttendance, getAttendanceByStudent, getAllAttendance, studentCheckIn };
