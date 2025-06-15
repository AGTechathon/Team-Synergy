-- RakshaMitra AI Database Schema
-- Initialize all required tables for the disaster management system

-- Users table for victims and general users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    contact_method VARCHAR(10) DEFAULT 'email' CHECK (contact_method IN ('email', 'phone')),
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff table for emergency responders and coordinators
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'responder' CHECK (role IN ('admin', 'coordinator', 'responder')),
    department VARCHAR(100),
    certification VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Volunteers table for volunteer coordination
CREATE TABLE IF NOT EXISTS volunteers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) UNIQUE NOT NULL,
    skills TEXT,
    location VARCHAR(255),
    availability VARCHAR(20) DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'unavailable')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'verified', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency requests table
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Medical', 'Rescue', 'Supplies', 'Shelter', 'Other')),
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'cancelled')),
    assigned_volunteer_id INTEGER REFERENCES volunteers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disasters table for tracking disaster events
CREATE TABLE IF NOT EXISTS disasters (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Earthquake', 'Flood', 'Fire', 'Storm', 'Tsunami', 'Other')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_km INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring')),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table for tracking notifications sent
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    emergency_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    description TEXT,
    recipient_type VARCHAR(20) CHECK (recipient_type IN ('all', 'volunteers', 'users', 'staff')),
    total_recipients INTEGER DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed')),
    created_by INTEGER REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer assignments for task management
CREATE TABLE IF NOT EXISTS volunteer_assignments (
    id SERIAL PRIMARY KEY,
    volunteer_id INTEGER NOT NULL REFERENCES volunteers(id),
    request_id INTEGER REFERENCES requests(id),
    disaster_id INTEGER REFERENCES disasters(id),
    task_description TEXT,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled')),
    assigned_by INTEGER REFERENCES staff(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Communication logs for tracking interactions
CREATE TABLE IF NOT EXISTS communications (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER,
    sender_type VARCHAR(20) CHECK (sender_type IN ('user', 'volunteer', 'staff')),
    recipient_id INTEGER,
    recipient_type VARCHAR(20) CHECK (recipient_type IN ('user', 'volunteer', 'staff')),
    message TEXT NOT NULL,
    channel VARCHAR(20) CHECK (channel IN ('sms', 'email', 'app', 'call')),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requests_location ON requests(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_requests_urgency ON requests(urgency);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_disasters_location ON disasters(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_disasters_severity ON disasters(severity);
CREATE INDEX IF NOT EXISTS idx_volunteers_availability ON volunteers(availability);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_users_contact ON users(contact);
CREATE INDEX IF NOT EXISTS idx_staff_contact ON staff(contact);

-- Insert sample data for testing (optional)
-- This can be commented out for production

-- Sample disaster data
INSERT INTO disasters (title, category, severity, description, latitude, longitude, radius_km) 
VALUES 
    ('Flood Alert - Central District', 'Flood', 'High', 'Heavy rainfall causing flooding in central district areas', 28.6139, 77.2090, 25),
    ('Earthquake Monitoring', 'Earthquake', 'Medium', 'Seismic activity detected, monitoring for aftershocks', 28.7041, 77.1025, 50)
ON CONFLICT DO NOTHING;

-- Sample volunteer data
INSERT INTO volunteers (name, contact, skills, location, availability, status)
VALUES 
    ('Dr. Arjun Sharma', '+91-9876543210', 'Medical Aid, First Aid', 'New Delhi', 'available', 'verified'),
    ('Priya Patel', 'priya.patel@email.com', 'Search and Rescue, Swimming', 'Mumbai', 'available', 'verified'),
    ('Rahul Singh', '+91-9322668584', 'Technical Rescue, Communications', 'Bangalore', 'available', 'active'),
    ('Emergency Response Team', '+91-9667033839', 'Emergency Response, Crisis Management', 'Mumbai', 'available', 'verified')
ON CONFLICT DO NOTHING;