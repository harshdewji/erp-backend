-- Enterprise HRMS Module for Noctra ERP
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    head_id INTEGER, -- REFERENCES users(id) via foreign key later or just id
    budget_allocated DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) NOT NULL,
    joining_date DATE DEFAULT CURRENT_DATE,
    base_salary DECIMAL(12, 2) DEFAULT 0,
    bank_account_no VARCHAR(50),
    employment_type VARCHAR(50) DEFAULT 'Full-time' -- Full-time, Part-time, Contract
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL, -- Sick, Casual, Earned
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by INTEGER REFERENCES users(id),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    basic_salary DECIMAL(12, 2) NOT NULL,
    allowances DECIMAL(12, 2) DEFAULT 0,
    deductions DECIMAL(12, 2) DEFAULT 0,
    net_salary DECIMAL(12, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Paid' CHECK (status IN ('Paid', 'Pending', 'Failed')),
    transaction_id VARCHAR(100),
    UNIQUE(staff_id, month, year)
);

-- INVENTORY MANAGEMENT
CREATE TABLE IF NOT EXISTS inventory_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES inventory_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    quantity_available INTEGER DEFAULT 0,
    unit_price DECIMAL(12, 2),
    location VARCHAR(255)
);

-- Update users to support staff roles if needed
-- Role is already CHECK (role IN ('Admin', 'Teacher', 'Student'))
-- We may need more roles or just use 'Staff'
-- For now, we'll use 'Teacher' for academic staff and 'Admin' for general staff in the check.
-- Let's add 'Staff' to the role check.

DO $$
BEGIN
    -- Alter users role check to include 'Staff'
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Admin', 'Teacher', 'Student', 'Staff'));
END $$;
