const db = require('./src/config/db');

async function finalFix() {
  try {
    console.log('Syncing structural integrity...');
    
    // Add missing timestamp columns if they were skipped
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE students ADD COLUMN IF NOT EXISTS enrolment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Ensure all existing null created_at are populated
    await db.query("UPDATE users SET created_at = NOW() WHERE created_at IS NULL");
    
    console.log('✅ Structure synchronized.');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

finalFix();
