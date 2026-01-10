-- Blood Donor Management System Database Schema for Supabase
-- Generated from ERD (erd.jpeg) and database.sql
-- This migration creates tables matching the ERD structure

-- =============================================
-- Table: location
-- Description: Stores location information for donors and emergency requests
-- ERD Relationship: DONOR (N:1) -> LOCATION, EMERGENCY_REQUEST (N:1) -> LOCATION
-- =============================================
CREATE TABLE IF NOT EXISTS location (
    location_id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- =============================================
-- Table: blood_group
-- Description: Stores blood group types and Rh factors
-- ERD Relationship: DONOR (N:1) -> BLOOD_GROUP, EMERGENCY_REQUEST (N:1) -> BLOOD_GROUP
-- =============================================
CREATE TABLE IF NOT EXISTS blood_group (
    bg_id SERIAL PRIMARY KEY,
    bg_name VARCHAR(10) NOT NULL,
    rh_factor CHAR(1) NOT NULL CHECK (rh_factor IN ('+', '-'))
);

-- =============================================
-- Table: donor
-- Description: Stores donor information
-- ERD Relationships:
--   - Located At (N:1) -> LOCATION
--   - Has Blood Type (N:1) -> BLOOD_GROUP
-- =============================================
CREATE TABLE IF NOT EXISTS donor (
    donor_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    age INT NOT NULL CHECK (age >= 18),
    gender VARCHAR(10) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    blood_group INT NOT NULL REFERENCES blood_group(bg_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    availability BOOLEAN DEFAULT TRUE,
    last_donate DATE,
    is_active BOOLEAN DEFAULT TRUE,
    location_id INT REFERENCES location(location_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================
-- Table: contact_number
-- Description: Stores multiple contact numbers for donors
-- ERD Relationship: DONOR (1:N) -> CONTACT_NUMBER (one donor can have multiple numbers)
-- =============================================
CREATE TABLE IF NOT EXISTS contact_number (
    contact_id SERIAL PRIMARY KEY,
    donor_id INT NOT NULL REFERENCES donor(donor_id) ON DELETE CASCADE ON UPDATE CASCADE,
    phone_number VARCHAR(20) NOT NULL
);

-- =============================================
-- Table: blood_compatibility
-- Description: Stores blood type compatibility information
-- ERD Relationships:
--   - Compatible With (1:N) -> BLOOD_GROUP (donor blood group)
--   - Has Blood Type (N:1) -> BLOOD_GROUP (receiver blood group)
-- =============================================
CREATE TABLE IF NOT EXISTS blood_compatibility (
    comp_id SERIAL PRIMARY KEY,
    donor_bg INT NOT NULL REFERENCES blood_group(bg_id) ON DELETE CASCADE ON UPDATE CASCADE,
    receiver_bg INT NOT NULL REFERENCES blood_group(bg_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (donor_bg, receiver_bg)
);

-- =============================================
-- Table: emergency_request
-- Description: Stores emergency blood requests from hospitals
-- ERD Relationships:
--   - References BLOOD_GROUP for blood_group field
--   - References LOCATION for location_id (FK)
-- =============================================
CREATE TABLE IF NOT EXISTS emergency_request (
    request_id SERIAL PRIMARY KEY,
    blood_group INT NOT NULL REFERENCES blood_group(bg_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    hospital_name VARCHAR(200) NOT NULL,
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location_id INT NOT NULL REFERENCES location(location_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    contact_number VARCHAR(20) NOT NULL
);

-- =============================================
-- Table: otp
-- Description: Stores OTP codes for donor verification
-- ERD Relationship: OTP (N:1) -> DONOR
-- =============================================
CREATE TABLE IF NOT EXISTS otp (
    otp_id SERIAL PRIMARY KEY,
    donor_id INT NOT NULL REFERENCES donor(donor_id) ON DELETE CASCADE ON UPDATE CASCADE,
    otp_code VARCHAR(10) NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE
);

-- =============================================
-- Insert default blood group data
-- =============================================
INSERT INTO blood_group (bg_name, rh_factor) VALUES
('A', '+'),
('A', '-'),
('B', '+'),
('B', '-'),
('AB', '+'),
('AB', '-'),
('O', '+'),
('O', '-')
ON CONFLICT DO NOTHING;

-- =============================================
-- Insert blood compatibility data
-- Blood type compatibility chart:
-- O- can donate to all (universal donor)
-- AB+ can receive from all (universal recipient)
-- =============================================
INSERT INTO blood_compatibility (donor_bg, receiver_bg) VALUES
-- O- can donate to everyone
(8, 1), (8, 2), (8, 3), (8, 4), (8, 5), (8, 6), (8, 7), (8, 8),
-- O+ can donate to A+, B+, AB+, O+
(7, 1), (7, 3), (7, 5), (7, 7),
-- A- can donate to A+, A-, AB+, AB-
(2, 1), (2, 2), (2, 5), (2, 6),
-- A+ can donate to A+, AB+
(1, 1), (1, 5),
-- B- can donate to B+, B-, AB+, AB-
(4, 3), (4, 4), (4, 5), (4, 6),
-- B+ can donate to B+, AB+
(3, 3), (3, 5),
-- AB- can donate to AB+, AB-
(6, 5), (6, 6),
-- AB+ can donate to AB+
(5, 5)
ON CONFLICT DO NOTHING;

-- =============================================
-- Create indexes for better query performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_donor_blood_group ON donor(blood_group);
CREATE INDEX IF NOT EXISTS idx_donor_location ON donor(location_id);
CREATE INDEX IF NOT EXISTS idx_donor_availability ON donor(availability);
CREATE INDEX IF NOT EXISTS idx_donor_is_active ON donor(is_active);
CREATE INDEX IF NOT EXISTS idx_contact_donor ON contact_number(donor_id);
CREATE INDEX IF NOT EXISTS idx_emergency_blood_group ON emergency_request(blood_group);
CREATE INDEX IF NOT EXISTS idx_emergency_location ON emergency_request(location_id);
CREATE INDEX IF NOT EXISTS idx_otp_donor ON otp(donor_id);
CREATE INDEX IF NOT EXISTS idx_otp_expiry ON otp(expiry_time);

-- =============================================
-- Enable Row Level Security (RLS) for Supabase
-- =============================================
ALTER TABLE donor ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_number ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp ENABLE ROW LEVEL SECURITY;
ALTER TABLE location ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_compatibility ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role access
CREATE POLICY "Service role can manage all data" ON donor FOR ALL USING (true);
CREATE POLICY "Service role can manage all data" ON contact_number FOR ALL USING (true);
CREATE POLICY "Service role can manage all data" ON emergency_request FOR ALL USING (true);
CREATE POLICY "Service role can manage all data" ON otp FOR ALL USING (true);
CREATE POLICY "Service role can manage all data" ON location FOR ALL USING (true);
CREATE POLICY "Service role can manage all data" ON blood_group FOR ALL USING (true);
CREATE POLICY "Service role can manage all data" ON blood_compatibility FOR ALL USING (true);
