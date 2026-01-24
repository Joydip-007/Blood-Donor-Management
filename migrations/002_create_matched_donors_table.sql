-- Migration: Create table to store matched donors for emergency requests
-- Date: 2026-01-24
-- Description: Create EMERGENCY_REQUEST_MATCHED_DONORS table to store donors matched to each emergency request after admin approval

USE blood_donor_management;

-- Create table to store matched donors for each emergency request
CREATE TABLE IF NOT EXISTS EMERGENCY_REQUEST_MATCHED_DONORS (
    match_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    donor_id INT NOT NULL,
    matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES EMERGENCY_REQUEST(request_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES DONOR(donor_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_request_donor (request_id, donor_id)
);

-- Add index for faster lookups by request_id
CREATE INDEX idx_matched_request ON EMERGENCY_REQUEST_MATCHED_DONORS(request_id);

-- Add index for faster lookups by donor_id
CREATE INDEX idx_matched_donor ON EMERGENCY_REQUEST_MATCHED_DONORS(donor_id);
