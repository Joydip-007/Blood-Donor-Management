# Database Migrations - Consolidated

## Notice

All database migrations in this folder have been **consolidated into the main `database.sql` file** at the root of the repository.

## Migration History

The following migrations were applied and are now part of the main schema:

### 1. `001_update_location_coordinates.sql`
**Purpose**: Convert latitude and longitude from VARCHAR to DECIMAL for precise geocoding

**Changes Applied**:
- Changed `LOCATION.latitude` to `DECIMAL(10, 8)` 
- Changed `LOCATION.longitude` to `DECIMAL(11, 8)`
- Added index: `idx_location_coordinates ON LOCATION(latitude, longitude)`

**Status**: ✅ Merged into database.sql (lines 15-21)

---

### 2. `001_update_emergency_request_table.sql`
**Purpose**: Add admin approval workflow fields to EMERGENCY_REQUEST table

**Changes Applied**:
- Added columns: `patient_name`, `units_required`, `urgency`, `required_by`, `notes`
- Added columns: `status`, `admin_id`, `created_at`, `updated_at`, `approved_at`, `rejection_reason`
- Added indexes: `idx_emergency_status`, `idx_emergency_urgency`, `idx_emergency_created_at`, `idx_emergency_required_by`

**Status**: ✅ Merged into database.sql (lines 91-111)

---

### 3. `002_create_matched_donors_table.sql`
**Purpose**: Create table to track donors matched to emergency requests after admin approval

**Changes Applied**:
- Created `EMERGENCY_REQUEST_MATCHED_DONORS` table
- Added foreign keys to `EMERGENCY_REQUEST` and `DONOR`
- Added unique constraint: `unique_request_donor (request_id, donor_id)`
- Added indexes: `idx_matched_request`, `idx_matched_donor`

**Status**: ✅ Merged into database.sql (lines 120-128)

---

## Usage for Fresh Installations

For new installations, simply run the consolidated `database.sql` file:

```bash
# MySQL
mysql -u root -p < database.sql

# PostgreSQL (with some syntax adjustments)
psql -U postgres -d blood_donor_management -f database.sql
```

## Migration Files

The original migration SQL files are preserved in this folder for historical reference but are **no longer needed** for fresh installations. All their changes are incorporated into the main schema.

## Database Schema Version

**Current Schema Version**: v1.3 (as of January 2026)

**Includes**:
- All 8 tables with complete field definitions
- All foreign key constraints
- All indexes for query optimization
- Blood group and compatibility data seeding
- Geocoding support (DECIMAL coordinates)
- Admin approval workflow for emergency requests
- Matched donors tracking system
- Email-based OTP verification structure

---

**Last Updated**: January 26, 2026  
**Consolidated By**: Database maintenance task
