const db = require('./src/config/db');

async function fixDb() {
  try {
    console.log('--- STARTING DATABASE REPAIR & OPTIMIZATION ---');

    // 1. Ensure 'Admin' role exists and name is Harsh Dewangan
    const adminCheck = await db.query("SELECT * FROM users WHERE role = 'Admin'");
    if (adminCheck.rows.length === 0) {
      console.log('No Admin found. Creating default admin...');
      // Note: In a real app we'd hash the password, here we just ensure the record exists to prevent crashes
      await db.query("INSERT INTO users (name, email, password, role) VALUES ('Harsh Dewangan', 'admin@erp.com', '$2a$10$hashed_place_holder', 'Admin')");
    } else {
      console.log('Ensuring Admin name is Harsh Dewangan...');
      await db.query("UPDATE users SET name = 'Harsh Dewangan' WHERE role = 'Admin'");
    }

    // 2. Fix potential schema inconsistencies in courses (ensure enrolled_students reflects actual count)
    console.log('Syncing course enrolment counts...');
    await db.query(`
      UPDATE courses c 
      SET enrolled_students = (SELECT COUNT(*) FROM students s WHERE s.course_id = c.id)
    `);

    // 3. Clean up any invalid roles
    await db.query("UPDATE users SET role = 'Student' WHERE role NOT IN ('Admin', 'Teacher', 'Student')");

    // 4. Ensure all users are active by default if not specified
    await db.query("UPDATE users SET is_active = TRUE WHERE is_active IS NULL");

    console.log('✅ Database repair and synchronization successful.');
    
    // 5. Final stats
    const final = await db.query('SELECT role, count(*) FROM users GROUP BY role');
    console.log('Current Database State:', final.rows);

  } catch (err) {
    console.error('CRITICAL ERROR DURING REPAIR:', err.message);
  } finally {
    process.exit();
  }
}

fixDb();
