const db = require('../config/db');

// CAMPUSES
const getCampuses = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM campuses ORDER BY name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// INQUIRIES (LEADS)
const getInquiries = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, c.name as course_name 
      FROM inquiries i
      LEFT JOIN courses c ON i.course_id = c.id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const addInquiry = async (req, res) => {
  const { name, email, phone, course_id, source } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO inquiries (name, email, phone, course_id, source) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, course_id, source]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// TIMETABLE
const getTimetable = async (req, res) => {
  const { course_id } = req.params;
  const { faculty, room } = req.query; // New: Multi-view support
  
  try {
    let query = 'SELECT * FROM timetable WHERE ';
    let params = [];
    
    if (course_id && course_id !== 'all') {
      query += 'course_id = $1 ';
      params.push(course_id);
    } else if (faculty) {
      query += 'faculty_name ILIKE $1 ';
      params.push(`%${faculty}%`);
    } else if (room) {
      query += 'room_number ILIKE $1 ';
      params.push(`%${room}%`);
    } else {
      query += '1=1 '; // Default: show all
    }

    query += `
      ORDER BY 
        CASE day 
          WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 
          WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 
          ELSE 7 
        END, 
        start_time ASC
    `;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const addTimetableEntry = async (req, res) => {
  const { course_id, day, start_time, end_time, subject, faculty_name, room_number } = req.body;
  
  try {
    // ── CONFLICT DETECTION LOGIC ─────────────────────────────
    // 1. Check Room Availability
    const roomConflict = await db.query(
      "SELECT * FROM timetable WHERE day = $1 AND room_number = $2 AND ((start_time, end_time) OVERLAPS ($3, $4))",
      [day, room_number, start_time, end_time]
    );
    if (roomConflict.rows.length > 0) {
      return res.status(400).json({ message: `Temporal Collision: Room ${room_number} is already reserved for "${roomConflict.rows[0].subject}" during this slot.` });
    }

    // 2. Check Faculty Availability
    const facultyConflict = await db.query(
      "SELECT * FROM timetable WHERE day = $1 AND faculty_name = $2 AND ((start_time, end_time) OVERLAPS ($3, $4))",
      [day, faculty_name, start_time, end_time]
    );
    if (facultyConflict.rows.length > 0) {
      return res.status(400).json({ message: `Direct Assignment Conflict: ${faculty_name} is already presiding over "${facultyConflict.rows[0].subject}" in another room.` });
    }

    const result = await db.query(
      `INSERT INTO timetable (course_id, day, start_time, end_time, subject, faculty_name, room_number, last_updated_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [course_id, day, start_time, end_time, subject, faculty_name, room_number, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// UPDATE INQUIRY STATUS
const updateInquiry = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await db.query(
      'UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Inquiry not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// CONVERT INQUIRY TO STUDENT (ONE-CLICK ADMISSION)
const convertInquiry = async (req, res) => {
  const { id } = req.params; // Inquiry ID
  try {
    await db.query('BEGIN');
    const inquiry = await db.query('SELECT * FROM inquiries WHERE id = $1', [id]);
    if (inquiry.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Inquiry not found' });
    }
    const inq = inquiry.rows[0];

    // 1. Create User
    const studentUser = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [inq.name, inq.email || `${inq.phone}@noctra.com`, 'Student123!', 'Student']
    );

    // 2. Create Student record
    await db.query(
      'INSERT INTO students (user_id, course_id) VALUES ($1, $2)',
      [studentUser.rows[0].id, inq.course_id]
    );

    // 3. Update Inquiry status
    await db.query('UPDATE inquiries SET status = \'Admission Done\' WHERE id = $1', [id]);

    await db.query('COMMIT');
    res.json({ message: 'Student successfully enrolled and inquiry converted' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  }
};

// PAYROLL
const getPayroll = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.name as employee_name, s.designation, d.name as department_name
      FROM payroll p
      JOIN staff s ON p.staff_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY p.year DESC, p.month DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ANNOUNCEMENTS (TICKER)
const getAnnouncements = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM announcements WHERE expires_at > NOW() OR expires_at IS NULL ORDER BY priority = \'Urgent\' DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const { jsPDF } = require('jspdf');

// ... (existing codes)

// EXAMS
const getExams = async (req, res) => {
  const { course_id } = req.query;
  try {
    let query = 'SELECT e.*, c.name as course_name FROM exams e JOIN courses c ON e.course_id = c.id ';
    let params = [];
    if (course_id) {
      query += 'WHERE e.course_id = $1 ';
      params.push(course_id);
    }
    query += 'ORDER BY exam_date ASC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FEES
const getFees = async (req, res) => {
  try {
    const student_id = req.query.student_id ? parseInt(req.query.student_id) : null;
    let query = 'SELECT f.*, u.name as student_name FROM fee_records f JOIN users u ON f.student_id = u.id ';
    let params = [];
    
    if (req.user.role === 'Student') {
      query += 'WHERE f.student_id = $1 ';
      params.push(req.user.id);
    } else if (student_id) {
      query += 'WHERE f.student_id = $1 ';
      params.push(student_id);
    } else if (req.user.role === 'Admin' || req.user.role === 'Teacher') {
      // Allowed to view all
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    query += 'ORDER BY f.due_date DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// RESOURCES
const getResources = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM institutional_resources ORDER BY category, name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// LATE ARRIVALS
const getLateArrivals = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.id, a.check_in_time, u.name as student_name, c.name as course_name 
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN courses c ON s.course_id = c.id
       WHERE a.date = CURRENT_DATE AND a.status = 'Late'
       ORDER BY a.check_in_time DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// RESOURCE BOOKING
const bookResource = async (req, res) => {
  const { resource_id, start_time, end_time } = req.body;
  try {
    const booking = await db.query(
      'INSERT INTO resource_bookings (resource_id, user_id, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [resource_id, req.user.id, start_time, end_time]
    );
    await db.query('UPDATE institutional_resources SET status = \'Occupied\' WHERE id = $1', [resource_id]);
    res.status(201).json(booking.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GLOBAL SEARCH
const globalSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) return res.json([]);
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, 
              (SELECT status FROM attendance a 
               JOIN students s ON a.student_id = s.id 
               WHERE s.user_id = u.id AND a.date = CURRENT_DATE LIMIT 1) as today_status
       FROM users u
       WHERE name ILIKE $1 OR email ILIKE $1 
       LIMIT 8`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const generateHallTicket = async (req, res) => {
  const { examId } = req.params;
  try {
    const examData = await db.query(`
      SELECT e.*, c.name as course_name, u.name as student_name, u.email as student_email
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      CROSS JOIN users u
      WHERE e.id = $1 AND u.id = $2
    `, [examId, req.user.id]);

    if (examData.rows.length === 0) return res.status(404).json({ message: 'Exam or Student not found' });
    const data = examData.rows[0];

    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(184, 134, 44);
    doc.text('NOCTRA PRIVATE UNIVERSITY', 105, 30, { align: 'center' });
    doc.setFontSize(14); doc.setTextColor(150, 150, 150);
    doc.text('OFFICIAL EXAMINATION ADMIT CARD', 105, 40, { align: 'center' });
    
    doc.setDrawColor(184, 134, 44); doc.line(20, 45, 190, 45);

    doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    doc.text(`Student Name: ${data.student_name}`, 20, 65);
    doc.text(`Institutional ID: ${req.user.id}`, 20, 75);
    doc.text(`Course: ${data.course_name}`, 20, 85);
    doc.text(`Assessment: ${data.name}`, 20, 95);
    doc.text(`Date: ${new Date(data.exam_date).toLocaleDateString()}`, 20, 105);
    doc.text(`Reporting Time: 08:30 AM`, 20, 115);
    doc.text(`Venue: Hall-B, Main Campus`, 20, 125);

    doc.setFontSize(10); doc.setTextColor(100, 100, 100);
    doc.text('Instruction: Valid ID required for entry.', 20, 160);

    const pdfBuffer = doc.output('arraybuffer');
    res.contentType("application/pdf");
    res.send(Buffer.from(pdfBuffer));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getCampuses,
  getInquiries,
  addInquiry,
  updateInquiry,
  convertInquiry,
  getTimetable,
  addTimetableEntry,
  getPayroll,
  getAnnouncements,
  getExams,
  generateHallTicket,
  getFees,
  getResources,
  bookResource,
  getLateArrivals,
  globalSearch
};
