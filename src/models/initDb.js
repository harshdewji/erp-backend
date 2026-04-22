const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const initDb = async () => {
  // Run SQL files in the correct dependency order
  const sqlFiles = [
    'schema.sql',           // Core tables (users, courses, students, etc.)
    'edusec_extension.sql', // Inquiries, timetable, HRMS, payroll
    'extra_features.sql',   // Placements, alumni, messaging, events
  ];

  for (const file of sqlFiles) {
    try {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  SQL file not found, skipping: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      await db.query(sql);
      console.log(`✅ Database schema applied: ${file}`);
    } catch (error) {
      // Log but don't crash — patch blocks may throw on already-correct schemas
      console.warn(`⚠️  Warning during ${file}:`, error.message);
    }
  }

  console.log('🚀 Noctra ERP database initialization complete.');
};

module.exports = initDb;
