const db = require('../config/db');

// --- DEPARTMENT MODULE ---
const getDepartments = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, u.name as head_name,
             (SELECT COUNT(*) FROM staff WHERE department_id = d.id) as staff_count
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      ORDER BY d.name ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const addDepartment = async (req, res) => {
  const { name, head_id, budget_allocated } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO departments (name, head_id, budget_allocated) VALUES ($1, $2, $3) RETURNING *',
      [name, head_id, budget_allocated || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- STAFF MODULE ---
const getAllStaff = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, u.name, u.email, d.name as department_name, u.profile_image
      FROM staff s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY u.name ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const addStaffMember = async (req, res) => {
  const { user_id, department_id, designation, base_salary, employment_type, bank_account_no } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO staff (user_id, department_id, designation, base_salary, employment_type, bank_account_no) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, department_id, designation, base_salary, employment_type || 'Full-time', bank_account_no]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- PAYROLL MODULE ---
const generatePayroll = async (req, res) => {
  const { staff_id, month, year, pf_deduction } = req.body;
  try {
    const staff = await db.query('SELECT base_salary FROM staff WHERE id = $1', [staff_id]);
    if (staff.rows.length === 0) return res.status(404).json({ message: 'Staff member not found' });
    
    const basic = parseFloat(staff.rows[0].base_salary);
    const hra = basic * 0.40; // 40% House Rent Allowance
    const da  = basic * 0.10; // 10% Dearness Allowance
    const pf  = basic * 0.12; // 12% Provident Fund (Indian context)
    
    const gross = basic + hra + da;
    const net = gross - pf;

    const result = await db.query(
      `INSERT INTO payroll (staff_id, month, year, basic_salary, allowances, deductions, net_salary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (staff_id, month, year) DO UPDATE 
       SET basic_salary = EXCLUDED.basic_salary, allowances = EXCLUDED.allowances, 
           deductions = EXCLUDED.deductions, net_salary = EXCLUDED.net_salary
       RETURNING *`,
      [staff_id, month, year, basic, hra + da, pf, net]
    );
    res.status(201).json({ ...result.rows[0], components: { hra, da, pf, basic } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getPayrollHistory = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.name as staff_name, s.designation, d.name as department_name
      FROM payroll p
      JOIN staff s ON p.staff_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY p.year DESC, p.month DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- LEAVE MODULE ---
const applyForLeave = async (req, res) => {
  const { staff_id, leave_type, start_date, end_date, reason } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO leave_requests (staff_id, leave_type, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [staff_id, leave_type, start_date, end_date, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status, approved_by } = req.body;
  try {
    const result = await db.query(
      'UPDATE leave_requests SET status = $1, approved_by = $2 WHERE id = $3 RETURNING *',
      [status, approved_by, id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getDepartments,
  addDepartment,
  getAllStaff,
  addStaffMember,
  generatePayroll,
  getPayrollHistory,
  applyForLeave,
  updateLeaveStatus
};
