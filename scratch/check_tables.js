const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_l7yYWU1IOpsV@ep-quiet-bar-ankc8zo4-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });

async function check() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(JSON.stringify(res.rows.map(r => r.table_name), null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

check();
