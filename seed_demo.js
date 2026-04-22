const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seedData() {
  try {
    console.log('Seeding demo data...');
    const salt = await bcrypt.genSalt(10);
    const pass = await bcrypt.hash('password123', salt);

    const students = [
      ['Aarav Sharma', 'aarav@univ.edu', 'B.Tech', 'Computer Science'],
      ['Isha Gupta', 'isha@univ.edu', 'B.Tech', 'Computer Science'],
      ['Vihaan Malhotra', 'vihaan@univ.edu', 'B.Tech', 'Information Technology'],
      ['Ananya Nair', 'ananya@univ.edu', 'M.Tech', 'AI & Robotics'],
      ['Kabir Singh', 'kabir@univ.edu', 'BCA', 'Data Science'],
      ['Zoya Khan', 'zoya@univ.edu', 'MBA', 'Marketing'],
      ['Arjun Das', 'arjun@univ.edu', 'BBA', 'Finance'],
      ['Sanya Iyer', 'sanya@univ.edu', 'BCA', 'Cyber Security']
    ];

    for (const [name, email, degree, branch] of students) {
        // Check if email exists
        const ex = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (ex.rows.length === 0) {
            const u = await db.query("INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'Student') RETURNING id", [name, email, pass]);
            const course = await db.query("SELECT id FROM courses WHERE degree = $1 AND branch = $2 LIMIT 1", [degree, branch]);
            if (course.rows.length > 0) {
                await db.query("INSERT INTO students (user_id, course_id) VALUES ($1, $2)", [u.rows[0].id, course.rows[0].id]);
                console.log(`Seeded student: ${name}`);
            }
        }
    }
    console.log('✅ Seed complete.');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

seedData();
