-- Extra Features for Noctra ERP Premium
-- PLACEMENT MODULE
CREATE TABLE IF NOT EXISTS official_placements (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    package_offered DECIMAL(12, 2),
    position VARCHAR(100),
    placement_date DATE DEFAULT CURRENT_DATE
);

-- SCHOLARSHIP MODULE
CREATE TABLE IF NOT EXISTS scholarships (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    criteria TEXT
);

CREATE TABLE IF NOT EXISTS student_scholarships (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE CASCADE,
    awarded_date DATE DEFAULT CURRENT_DATE
);

-- EVENTS MODULE
CREATE TABLE IF NOT EXISTS institutional_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    organizer_id INTEGER REFERENCES users(id)
);

-- MESSAGING MODULE
CREATE TABLE IF NOT EXISTS official_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ALUMNI MODULE
CREATE TABLE IF NOT EXISTS alumni (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    graduation_year INTEGER,
    current_organization VARCHAR(255),
    designation VARCHAR(100),
    contact_visibility BOOLEAN DEFAULT FALSE
);
