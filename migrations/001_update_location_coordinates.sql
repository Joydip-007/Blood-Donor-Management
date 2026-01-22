-- Migration: Convert latitude and longitude from VARCHAR to DECIMAL
-- This migration updates the LOCATION table to use proper numerical types for geocoding

-- Step 1: Clean any invalid existing data
UPDATE LOCATION 
SET latitude = NULL 
WHERE latitude = '' OR latitude IS NOT NULL AND latitude NOT REGEXP '^-?[0-9]+\.?[0-9]*$';

UPDATE LOCATION 
SET longitude = NULL 
WHERE longitude = '' OR longitude IS NOT NULL AND longitude NOT REGEXP '^-?[0-9]+\.?[0-9]*$';

-- Step 2: Alter columns to DECIMAL type
ALTER TABLE LOCATION 
MODIFY COLUMN latitude DECIMAL(10, 8) NULL,
MODIFY COLUMN longitude DECIMAL(11, 8) NULL;

-- Step 3: Add index for geocoded locations
CREATE INDEX idx_location_coordinates ON LOCATION(latitude, longitude);

-- Verification query (run separately to check):
-- DESCRIBE LOCATION;
