const cron = require('node-cron');
const db = require('../config/db');

const initCronJobs = () => {
  // 1. Attendance Alert: Run every day at 8 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running Attendance Alert Cron...');
    try {
      const lowAttendance = await db.query(`
        SELECT s.user_id, u.name, 
               (COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / COUNT(*)) as percentage
        FROM students s
        JOIN users u ON s.user_id = u.id
        JOIN attendance a ON s.id = a.student_id
        GROUP BY s.user_id, u.name
        HAVING (COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / COUNT(*)) < 75
      `);

      for (const student of lowAttendance.rows) {
        await db.query(
          'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
          [student.user_id, `Alert: Your attendance is low (${parseFloat(student.percentage).toFixed(2)}%). Please improve it.`]
        );
      }
    } catch (err) {
      console.error('Cron Attendance Error:', err);
    }
  });

  // 2. Fee Reminder: Run every Monday at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running Fee Reminder Cron...');
    try {
      const pendingFees = await db.query(`
        SELECT s.user_id, f.amount, f.due_date 
        FROM fees f
        JOIN students s ON f.student_id = s.id
        WHERE f.status = 'Pending' AND f.due_date < CURRENT_DATE + INTERVAL '7 days'
      `);

      for (const fee of pendingFees.rows) {
        await db.query(
          'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
          [fee.user_id, `Reminder: Your fee of $${fee.amount} is due on ${fee.due_date.toLocaleDateString()}. Please pay soon.`]
        );
      }
    } catch (err) {
      console.error('Cron Fees Error:', err);
    }
  });
};

module.exports = initCronJobs;
