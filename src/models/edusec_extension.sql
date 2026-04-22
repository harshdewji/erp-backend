-- EduSec Style Extension for Noctra ERP
-- MULTI-CAMPUS SUPPORT
CREATE TABLE IF NOT EXISTS campuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    code VARCHAR(10) UNIQUE
);

-- INQUIRY / LEAD MANAGEMENT
CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    course_id INTEGER REFERENCES courses(id),
    status VARCHAR(50) DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Contacted', 'Qualified', 'Converted', 'Admission Done', 'Not Interested', 'Closed')),
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PATCH: update constraint for existing databases
DO $$
BEGIN
    -- Drop old constraint if it exists with a different definition
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'inquiries' AND constraint_type = 'CHECK'
    ) THEN
        ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
        ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check
            CHECK (status IN ('New', 'In Progress', 'Contacted', 'Qualified', 'Converted', 'Admission Done', 'Not Interested', 'Closed'));
    END IF;
END $$;


-- TIMETABLE MODULE
CREATE TABLE IF NOT EXISTS timetable_slots (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL, -- Monday, Tuesday...
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    teacher_id INTEGER REFERENCES teachers(id),
    room_number VARCHAR(50)
);

-- HRMS & PAYROLL
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_code VARCHAR(20) UNIQUE,
    designation VARCHAR(100),
    department VARCHAR(100),
    joining_date DATE,
    salary_basis DECIMAL(12, 2)
);

CREATE TABLE IF NOT EXISTS payroll_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    month INTEGER,
    year INTEGER,
    basic_pay DECIMAL(12, 2),
    allowances DECIMAL(12, 2) DEFAULT 0,
    deductions DECIMAL(12, 2) DEFAULT 0,
    net_pay DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'Generated'
);

-- Initial Campuses
INSERT INTO campuses (name, location, code) VALUES 
('Main Campus', 'San Francisco, CA', 'MC01'),
('North Node', 'Seattle, WA', 'NN02')
ON CONFLICT DO NOTHING;
