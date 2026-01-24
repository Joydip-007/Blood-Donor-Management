-- Migration: Update EMERGENCY_REQUEST table for admin approval workflow
-- Date: 2026-01-24
-- Description: Add additional fields to support admin-approved emergency request workflow

USE blood_donor_management;

-- Add new columns to EMERGENCY_REQUEST table
ALTER TABLE EMERGENCY_REQUEST
  ADD COLUMN patient_name VARCHAR(100) AFTER request_id,
  ADD COLUMN units_required DECIMAL(4,1) DEFAULT 1.0 AFTER hospital_name,
  ADD COLUMN urgency ENUM('critical', 'high', 'medium') DEFAULT 'high' AFTER units_required,
  ADD COLUMN required_by DATETIME AFTER urgency,
  ADD COLUMN notes TEXT AFTER contact_number,
  ADD COLUMN status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending' AFTER notes,
  ADD COLUMN admin_id INT AFTER status,
  ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER admin_id,
  ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN approved_at DATETIME AFTER updated_at,
  ADD COLUMN rejection_reason TEXT AFTER approved_at;

-- Add index for status column for faster filtering
CREATE INDEX idx_emergency_status ON EMERGENCY_REQUEST(status);

-- Add index for urgency column
CREATE INDEX idx_emergency_urgency ON EMERGENCY_REQUEST(urgency);

-- Add index for created_at column for sorting
CREATE INDEX idx_emergency_created_at ON EMERGENCY_REQUEST(created_at);

-- Add index for required_by column
CREATE INDEX idx_emergency_required_by ON EMERGENCY_REQUEST(required_by);

-- Note: admin_id could be a foreign key to DONOR table if admin users are stored there
-- or to a separate ADMIN table if it exists. For now, we'll keep it as INT without FK.
