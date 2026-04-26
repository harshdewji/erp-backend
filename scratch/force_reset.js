const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_l7yYWU1IOpsV@ep-quiet-bar-ankc8zo4-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function reset() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    const emails = ['student@noctra.edu', 'admin@noctra.edu', 'teacher@noctra.edu'];
    
    for (const email of emails) {
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, email]);
      console.log(`✅ Reset: ${email}`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

reset();
