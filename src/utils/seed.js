const bcrypt = require('bcryptjs');
const db = require('../config/db');

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data (optional, but good for a fresh start)
    // await db.query('TRUNCATE users, courses, students, teachers, attendance, fees, exams, results RESTART IDENTITY CASCADE');

    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const teacherPass = await bcrypt.hash('teacher123', salt);
    const studentPass = await bcrypt.hash('student123', salt);

    // 1. Create Admin
    const adminResult = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id',
      ['System Admin', 'admin@erp.com', adminPass, 'Admin']
    );

    // 2. Create Course
    const courseResult = await db.query(
      'INSERT INTO courses (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
      ['Computer Science 101']
    );
    const courseId = courseResult.rows[0]?.id || 1;

    // 3. Create Teacher
    const teacherUser = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id',
      ['John Doe', 'teacher@erp.com', teacherPass, 'Teacher']
    );
    if (teacherUser.rows[0]) {
      await db.query('INSERT INTO teachers (user_id) VALUES ($1)', [teacherUser.rows[0].id]);
    }

    // 4. Create Student
    const studentUser = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id',
      ['Jane Smith', 'student@erp.com', studentPass, 'Student']
    );
    if (studentUser.rows[0]) {
      await db.query('INSERT INTO students (user_id, course_id) VALUES ($1, $2)', [studentUser.rows[0].id, courseId]);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
