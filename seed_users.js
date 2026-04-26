const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  console.log('🌱 Starting user seed...\n');
  const salt = await bcrypt.genSalt(10);
  const pass = await bcrypt.hash('password123', salt);

  const users = [
    { name: 'Aarav Sharma',    email: 'student@noctra.edu',  role: 'Student' },
    { name: 'Priya Mehta',     email: 'student2@noctra.edu', role: 'Student' },
    { name: 'Rahul Verma',     email: 'teacher@noctra.edu',  role: 'Teacher' },
    { name: 'Divya Nair',      email: 'teacher2@noctra.edu', role: 'Teacher' },
    { name: 'Harsh Dewangan',  email: 'admin@noctra.edu',    role: 'Admin'   },
  ];

  for (const u of users) {
    try {
      const exists = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (exists.rows.length > 0) {
        console.log(`⚠️  Already exists: ${u.email} — skipping`);
        continue;
      }

      const result = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id",
        [u.name, u.email, pass, u.role]
      );
      const userId = result.rows[0].id;

      if (u.role === 'Student') {
        await pool.query("INSERT INTO students (user_id) VALUES ($1)", [userId]);
      } else if (u.role === 'Teacher') {
        await pool.query("INSERT INTO teachers (user_id) VALUES ($1)", [userId]);
      }

      console.log(`✅ Created ${u.role}: ${u.email}`);
    } catch (err) {
      console.error(`❌ Failed for ${u.email}:`, err.message);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 LOGIN CREDENTIALS (all use same password)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Student  → student@noctra.edu  / password123');
  console.log('  Student  → student2@noctra.edu / password123');
  console.log('  Teacher  → teacher@noctra.edu  / password123');
  console.log('  Teacher  → teacher2@noctra.edu / password123');
  console.log('  Admin    → admin@noctra.edu    / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await pool.end();
}

seed().catch(console.error);
