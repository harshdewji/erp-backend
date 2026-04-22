const db = require('../config/db');

const createExams = async () => {
  try {
    // Search for a relevant course (e.g., Computer Science 101)
    const courseRes = await db.query("SELECT id FROM courses WHERE name ILIKE '%Computer Science%' LIMIT 1");
    let courseId = courseRes.rows[0]?.id;

    if (!courseId) {
       // If no course exists, create one
       const newCourse = await db.query("INSERT INTO courses (name) VALUES ('Computer Science') RETURNING id");
       courseId = newCourse.rows[0].id;
    }

    const exams = ['Java Programming', 'Python for Professionals', 'Frontend Web (HTML)', 'Data Structures & Algorithms (DSA)'];
    
    console.log(`Adding exams to Course ID: ${courseId}...`);

    for (const examName of exams) {
      await db.query(
        'INSERT INTO exams (course_id, name, date) VALUES ($1, $2, CURRENT_DATE + INTERVAL \'30 days\') ON CONFLICT DO NOTHING',
        [courseId, examName]
      );
    }

    console.log('Exams created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating exams:', error);
    process.exit(1);
  }
};

createExams();
