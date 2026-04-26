const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function applyOTPColumns() {
  console.log('🔧 Applying OTP columns to users table...\n');
  try {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='otp'
        ) THEN
          ALTER TABLE users ADD COLUMN otp VARCHAR(6);
          RAISE NOTICE 'Added column: otp';
        ELSE
          RAISE NOTICE 'Column otp already exists';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='otp_expires_at'
        ) THEN
          ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP;
          RAISE NOTICE 'Added column: otp_expires_at';
        ELSE
          RAISE NOTICE 'Column otp_expires_at already exists';
        END IF;
      END $$;
    `);
    console.log('✅ OTP columns ready.');

    // Verify
    const check = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name IN ('otp', 'otp_expires_at')
    `);
    console.log('\n📋 Verified columns:');
    console.table(check.rows);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

applyOTPColumns();
