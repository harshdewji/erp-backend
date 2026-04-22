const db = require('./src/config/db');

async function testDb() {
  try {
    const res = await db.query('SELECT COUNT(*) FROM users');
    console.log('Total users in DB:', res.rows[0].count);
    
    // Check if roles are correct
    const roles = await db.query('SELECT role, count(*) FROM users GROUP BY role');
    console.log('User roles distribution:', roles.rows);

    // Check for any obvious orphans (admission without user etc)
    const orphans = await db.query('SELECT COUNT(*) FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE u.id IS NULL');
    console.log('Orphan students (no user account):', orphans.rows[0].count);

  } catch (err) {
    console.error('DATABASE ERROR:', err.message);
  } finally {
    process.exit();
  }
}

testDb();
