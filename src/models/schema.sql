-- Noctra ERP Production Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Teacher', 'Student')),
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    documents TEXT[]
);

CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    check_in_time TIME,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late'))
);

CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS fees (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending')),
    due_date DATE,
    date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    marks INTEGER NOT NULL,
    grade VARCHAR(2),
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LIBRARY MODULE
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(20) UNIQUE,
    quantity INTEGER DEFAULT 1,
    available INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS borrowed_books (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id),
    student_id INTEGER REFERENCES students(id),
    borrow_date DATE DEFAULT CURRENT_DATE,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'Borrowed'
);

-- HOSTEL MODULE
CREATE TABLE IF NOT EXISTS hostels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Boys', 'Girls')),
    capacity INTEGER
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    hostel_id INTEGER REFERENCES hostels(id),
    room_number VARCHAR(20) NOT NULL,
    occupancy INTEGER DEFAULT 0,
    max_occupancy INTEGER DEFAULT 4
);

CREATE TABLE IF NOT EXISTS hostel_allocation (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id),
    student_id INTEGER REFERENCES students(id),
    allocation_date DATE DEFAULT CURRENT_DATE
);

-- TRANSPORT MODULE
CREATE TABLE IF NOT EXISTS transport_routes (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20)
);

-- MAINTENANCE & LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SCHEMA PATCHES (Ensuring columns exist in old tables)
DO $$
BEGIN
    -- users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- students table — address, phone, gender, dob
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='address') THEN
        ALTER TABLE students ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phone') THEN
        ALTER TABLE students ADD COLUMN phone VARCHAR(30);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='gender') THEN
        ALTER TABLE students ADD COLUMN gender VARCHAR(30);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='dob') THEN
        ALTER TABLE students ADD COLUMN dob DATE;
    END IF;

    -- courses table — degree, branch, duration_years, total_seats, description, enrolled_students
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='degree') THEN
        ALTER TABLE courses ADD COLUMN degree VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='branch') THEN
        ALTER TABLE courses ADD COLUMN branch VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='duration_years') THEN
        ALTER TABLE courses ADD COLUMN duration_years INTEGER DEFAULT 4;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='total_seats') THEN
        ALTER TABLE courses ADD COLUMN total_seats INTEGER DEFAULT 60;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='description') THEN
        ALTER TABLE courses ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='enrolled_students') THEN
        ALTER TABLE courses ADD COLUMN enrolled_students INTEGER DEFAULT 0;
    END IF;

    -- results table — total_marks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='results' AND column_name='total_marks') THEN
        ALTER TABLE results ADD COLUMN total_marks INTEGER DEFAULT 100;
    END IF;
    -- results.subject allow NULL (not always set)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='results' AND column_name='subject' AND is_nullable='NO') THEN
        ALTER TABLE results ALTER COLUMN subject DROP NOT NULL;
    END IF;

    -- attendance table — check_in_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='check_in_time') THEN
        ALTER TABLE attendance ADD COLUMN check_in_time TIME;
    END IF;

    -- fees table — created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fees' AND column_name='created_at') THEN
        ALTER TABLE fees ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    -- Update any existing Admin to have the correct system name
    UPDATE users SET name = 'Harsh Dewangan' WHERE role = 'Admin';
END $$;

