const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');
require('dotenv').config();

const seedData = async () => {
  try {
    const schemaPath = path.join(__dirname, 'src', 'models', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schema);
    console.log('Schema Applied');

    // Seed Courses
    await db.query("INSERT INTO courses (name) VALUES ('Computer Science'), ('Data Science'), ('Cyber Security') ON CONFLICT DO NOTHING");

    // Seed Library
    await db.query(`
      INSERT INTO books (title, author, isbn, quantity, available) VALUES 
      ('Advanced Algorithms', 'Thomas Cormen', '978-0262033848', 5, 5),
      ('Neural Networks from Scratch', 'Harrison Kinsley', '979-8647051381', 3, 3),
      ('The Pragmatic Programmer', 'Andy Hunt', '978-0135957059', 10, 8)
      ON CONFLICT DO NOTHING
    `);

    // Seed Hostels
    await db.query(`
      INSERT INTO hostels (name, type, capacity) VALUES 
      ('Phoenix Residency', 'Boys', 200),
      ('Nebula Block', 'Girls', 150)
      ON CONFLICT DO NOTHING
    `);

    // Seed Rooms
    const hostels = await db.query("SELECT id FROM hostels");
    if (hostels.rows.length > 0) {
      await db.query(`
        INSERT INTO rooms (hostel_id, room_number, occupancy, max_occupancy) VALUES 
        ($1, '101', 2, 4), ($1, '102', 4, 4),
        ($2, 'A-201', 1, 2)
      `, [hostels.rows[0].id, hostels.rows[1].id]);
    }

    // Seed Transport
    await db.query(`
      INSERT INTO transport_routes (route_name, vehicle_number, driver_name, driver_phone) VALUES 
      ('Downtown Express', 'UP-16-AX-0001', 'John Doe', '+1 555-0101'),
      ('Suburban Loop', 'UP-16-BZ-9988', 'Sarah Smith', '+1 555-0202')
      ON CONFLICT DO NOTHING
    `);

    console.log('Institutional Seed Data Injected');
  } catch (err) {
    console.error('Seed Error:', err);
  }
};

seedData().then(() => {
  console.log('Manual DB Init & Seeding Complete');
  process.exit(0);
});
