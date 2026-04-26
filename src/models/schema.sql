-- Noctra ERP Production Schema Master (Consolidated)

-- Foundation
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

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    head_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    budget_allocated DECIMAL(12, 2) DEFAULT 0,
    description TEXT
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    degree VARCHAR(50),
    branch VARCHAR(100),
    duration_years INTEGER,
    total_seats INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    roll_number VARCHAR(50),
    semester INTEGER DEFAULT 1,
    student_id_number VARCHAR(50) UNIQUE,
    class_name VARCHAR(100),
    section VARCHAR(50),
    enrollment_status VARCHAR(50) DEFAULT 'Active',
    blood_group VARCHAR(10),
    medical_history TEXT,
    academic_history TEXT,
    documents TEXT[]
);

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100),
    joining_date DATE DEFAULT CURRENT_DATE,
    base_salary DECIMAL(12, 2) DEFAULT 0,
    employment_type VARCHAR(50) DEFAULT 'Full-time',
    bank_account_no VARCHAR(50)
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
    subject VARCHAR(100),
    date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    marks INTEGER NOT NULL,
    total_marks INTEGER DEFAULT 100,
    grade VARCHAR(2)
);

CREATE TABLE IF NOT EXISTS fee_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Pending',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'New',
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timetable (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject VARCHAR(255) NOT NULL,
    faculty_name VARCHAR(255),
    room_number VARCHAR(50),
    last_updated_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50), 
    priority VARCHAR(20) DEFAULT 'Normal',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    basic_salary DECIMAL(12, 2),
    allowances DECIMAL(12, 2) DEFAULT 0,
    deductions DECIMAL(12, 2) DEFAULT 0,
    net_salary DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'Paid',
    UNIQUE (staff_id, month, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    leave_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    approved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS hostels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Boys', 'Girls')),
    capacity INTEGER
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    capacity INTEGER DEFAULT 1,
    occupancy INTEGER DEFAULT 0 
);

CREATE TABLE IF NOT EXISTS official_placements (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    package_offered DECIMAL(12, 2),
    position VARCHAR(255),
    placement_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS scholarships (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(255),
    amount DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'Approved'
);

CREATE TABLE IF NOT EXISTS institutional_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    organizer_id INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS campuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    code VARCHAR(10) UNIQUE
);

CREATE TABLE IF NOT EXISTS institutional_resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS resource_bookings (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES institutional_resources(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_routes (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS official_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alumni (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    graduation_year INTEGER,
    current_organization VARCHAR(255),
    designation VARCHAR(100),
    contact_visibility BOOLEAN DEFAULT FALSE
);
