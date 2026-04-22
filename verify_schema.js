const db = require('./src/config/db');

async function verifySchema() {
  try {
    const tables = ['users', 'students', 'courses'];
    for (const table of tables) {
      const res = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);
      console.log(`\n--- TABLE: ${table} ---`);
      res.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

verifySchema();
