require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const run = async () => {
  try {
    // 1. Extend courses table with branch / degree fields
    await pool.query(`
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS degree VARCHAR(50);
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_years INTEGER DEFAULT 4;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_seats INTEGER DEFAULT 60;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `);
    console.log('Schema extended');

    // 2. Seed rich course catalogue
    const courses = [
      ['B.Tech Computer Science Engineering', 'B.Tech', 'Computer Science',               4, 60, 'Full-stack development, AI, data structures and system design.'],
      ['B.Tech Mechanical Engineering',        'B.Tech', 'Mechanical Engineering',         4, 60, 'Thermodynamics, fluid mechanics, manufacturing processes and CAD.'],
      ['B.Tech Electronics & Communication',   'B.Tech', 'Electronics & Communication',    4, 60, 'VLSI, signal processing, embedded systems and wireless communication.'],
      ['B.Tech Civil Engineering',             'B.Tech', 'Civil Engineering',              4, 60, 'Structural analysis, surveying, construction management and geotechnics.'],
      ['B.Tech Electrical Engineering',        'B.Tech', 'Electrical Engineering',         4, 60, 'Power systems, machines, control systems and industrial electronics.'],
      ['B.Tech Information Technology',        'B.Tech', 'Information Technology',         4, 60, 'Networking, cloud computing, databases and software engineering.'],
      ['B.Tech Artificial Intelligence & ML',  'B.Tech', 'Artificial Intelligence & ML',   4, 60, 'Machine learning, deep learning, NLP and intelligent system design.'],
      ['BCA',                                  'BCA',    'Computer Applications',          3, 60, 'Programming, web development, DBMS and software design for 3 years.'],
      ['BBA',                                  'BBA',    'Business Administration',         3, 60, 'Management, marketing, finance and entrepreneurship.'],
      ['M.Tech Computer Science',              'M.Tech', 'Computer Science',               2, 30, 'Advanced algorithms, distributed systems and specialised research.'],
      ['M.Tech Mechanical Engineering',        'M.Tech', 'Mechanical Engineering',         2, 30, 'Advanced manufacturing, robotics and thermal engineering.'],
      ['MBA',                                  'MBA',    'Business Administration',         2, 60, 'Strategic management, digital business and global leadership.'],
      ['MCA',                                  'MCA',    'Computer Applications',          2, 30, 'Advanced programming, AI application and enterprise software.'],
      ['M.Sc Data Science',                    'M.Sc',  'Data Science',                    2, 30, 'Statistics, big data, analytics and predictive modelling.'],
      ['B.Sc Physics',                         'B.Sc',  'Physics',                         3, 40, 'Classical mechanics, quantum physics, electromagnetism and optics.'],
      ['B.Sc Mathematics',                     'B.Sc',  'Mathematics',                     3, 40, 'Calculus, linear algebra, discrete mathematics and statistics.'],
    ];

    for (const [name, degree, branch, duration_years, total_seats, description] of courses) {
      await pool.query(`
        INSERT INTO courses (name, degree, branch, duration_years, total_seats, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO UPDATE SET
          degree = EXCLUDED.degree,
          branch = EXCLUDED.branch,
          duration_years = EXCLUDED.duration_years,
          total_seats = EXCLUDED.total_seats,
          description = EXCLUDED.description
      `, [name, degree, branch, duration_years, total_seats, description]);
    }

    console.log(`Seeded ${courses.length} courses successfully`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

run();
