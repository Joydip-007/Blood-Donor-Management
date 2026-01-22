-- Blood Donor Management System Database Schema
-- Generated from ERD (erd.jpeg)

-- Create database
CREATE DATABASE IF NOT EXISTS blood_donor_management;
USE blood_donor_management;

-- =============================================
-- Table: LOCATION
-- Description: Stores location information for donors and emergency requests
-- Note: latitude and longitude use DECIMAL type for precise geocoding
--       DECIMAL(10, 8) for latitude: range -90.00000000 to 90.00000000
--       DECIMAL(11, 8) for longitude: range -180.00000000 to 180.00000000
-- =============================================
CREATE TABLE LOCATION (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- =============================================
-- Table: BLOOD_GROUP
-- Description: Stores blood group types and Rh factors
-- =============================================
CREATE TABLE BLOOD_GROUP (
    bg_id INT PRIMARY KEY AUTO_INCREMENT,
    bg_name VARCHAR(10) NOT NULL,
    rh_factor CHAR(1) NOT NULL CHECK (rh_factor IN ('+', '-'))
);

-- =============================================
-- Table: DONOR
-- Description: Stores donor information
-- Relationships:
--   - Located At (N:1) -> LOCATION
--   - Has Blood Type (N:1) -> BLOOD_GROUP
-- =============================================
CREATE TABLE DONOR (
    donor_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    age INT NOT NULL CHECK (age >= 18),
    gender VARCHAR(10) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    blood_group INT NOT NULL,
    availability BOOLEAN DEFAULT TRUE,
    last_donate DATE,
    is_active BOOLEAN DEFAULT TRUE,
    location_id INT,
    FOREIGN KEY (blood_group) REFERENCES BLOOD_GROUP(bg_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================
-- Table: CONTACT_NUMBER
-- Description: Stores multiple contact numbers for donors
-- Relationships:
--   - Has Numbers (1:N) -> DONOR (one donor can have multiple numbers)
-- =============================================
CREATE TABLE CONTACT_NUMBER (
    contact_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    FOREIGN KEY (donor_id) REFERENCES DONOR(donor_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =============================================
-- Table: BLOOD_COMPATIBILITY
-- Description: Stores blood type compatibility information
-- Relationships:
--   - Compatible With (1:N) -> BLOOD_GROUP (donor blood group)
--   - Has Blood Type (N:1) -> BLOOD_GROUP (receiver blood group)
-- =============================================
CREATE TABLE BLOOD_COMPATIBILITY (
    comp_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_bg INT NOT NULL,
    receiver_bg INT NOT NULL,
    FOREIGN KEY (donor_bg) REFERENCES BLOOD_GROUP(bg_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiver_bg) REFERENCES BLOOD_GROUP(bg_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_compatibility (donor_bg, receiver_bg)
);

-- =============================================
-- Table: EMERGENCY_REQUEST
-- Description: Stores emergency blood requests from hospitals
-- Relationships:
--   - References BLOOD_GROUP for blood_group field
--   - References LOCATION for location_id (FK)
-- =============================================
CREATE TABLE EMERGENCY_REQUEST (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    blood_group INT NOT NULL,
    hospital_name VARCHAR(200) NOT NULL,
    request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location_id INT NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    FOREIGN KEY (blood_group) REFERENCES BLOOD_GROUP(bg_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (location_id) REFERENCES LOCATION(location_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- =============================================
-- Table: OTP
-- Description: Stores OTP codes for donor verification
-- Relationships:
--   - References DONOR for donor_id (FK)
-- =============================================
CREATE TABLE OTP (
    otp_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expiry_time DATETIME NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (donor_id) REFERENCES DONOR(donor_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =============================================
-- Insert default blood group data
-- =============================================
INSERT INTO BLOOD_GROUP (bg_name, rh_factor) VALUES
('A', '+'),
('A', '-'),
('B', '+'),
('B', '-'),
('AB', '+'),
('AB', '-'),
('O', '+'),
('O', '-');

-- =============================================
-- Insert blood compatibility data
-- Blood type compatibility chart:
-- O- can donate to all (universal donor)
-- AB+ can receive from all (universal recipient)
-- =============================================
INSERT INTO BLOOD_COMPATIBILITY (donor_bg, receiver_bg) VALUES
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
(5, 5);

-- =============================================
-- Create indexes for better query performance
-- =============================================
CREATE INDEX idx_donor_blood_group ON DONOR(blood_group);
CREATE INDEX idx_donor_location ON DONOR(location_id);
CREATE INDEX idx_donor_availability ON DONOR(availability);
CREATE INDEX idx_donor_is_active ON DONOR(is_active);
CREATE INDEX idx_contact_donor ON CONTACT_NUMBER(donor_id);
CREATE INDEX idx_emergency_blood_group ON EMERGENCY_REQUEST(blood_group);
CREATE INDEX idx_emergency_location ON EMERGENCY_REQUEST(location_id);
CREATE INDEX idx_otp_donor ON OTP(donor_id);
CREATE INDEX idx_otp_expiry ON OTP(expiry_time);
