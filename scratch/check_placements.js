const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_l7yYWU1IOpsV@ep-quiet-bar-ankc8zo4-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });

async function check() {
  try {
    const res1 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'official_placements'");
    console.log('official_placements:', res1.rows.map(r => r.column_name));
    
    const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'placements'");
    console.log('placements:', res2.rows.map(r => r.column_name));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

check();
