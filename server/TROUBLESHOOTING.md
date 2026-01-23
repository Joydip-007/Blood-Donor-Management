# Server Troubleshooting Guide

## Common Issues and Solutions

### 1. Permissions Policy Header Warning

**Issue:** Browser console shows warning: `Permissions Policy header: Unrecognized feature: 'browsing-topics'`

**Explanation:** This is a browser warning, NOT an error. Modern browsers (especially Chrome) show this warning when they encounter unknown Permissions-Policy header features. This is a non-critical warning and does not affect functionality.

**Impact:** None - this is purely a browser warning and does not cause the application to malfunction.

**Solution:** This warning can be safely ignored. It does not cause 500 errors or prevent form submission.

---

### 2. 500 Internal Server Error on Registration

**Potential Causes and Solutions:**

#### Database Connection Issues
- **Symptom:** Error on any database operation
- **Check:** Server logs at startup should show "✓ Database connection successful"
- **Solution:** 
  - Verify MySQL is running: `sudo service mysql status`
  - Check database credentials in `server/.env`
  - Ensure database exists: `CREATE DATABASE blood_donor_management;`
  - Run database schema: `mysql -u root -p blood_donor_management < database.sql`

#### Missing Blood Group Data
- **Symptom:** Error: "Invalid blood group"
- **Check:** Server logs should show "✓ Blood groups loaded: X entries"
- **Solution:** Ensure BLOOD_GROUP table is populated (should have 8 entries: A+, A-, B+, B-, AB+, AB-, O+, O-)

#### Missing Required Fields
- **Symptom:** Error: "Missing required fields"
- **Check:** Request payload should include: name, email, phone, gender, bloodGroup, city, area
- **Solution:** Frontend validation should prevent this, but check that all required fields are being sent

#### Duplicate Email/Phone
- **Symptom:** Error mentions duplicate entry
- **Check:** Database for existing email or phone number
- **Solution:** Use different email/phone or delete the existing donor record

#### Geocoding API Issues
- **Symptom:** Form submission fails when coordinates cannot be fetched
- **Note:** Coordinates are OPTIONAL - geocoding failures should NOT cause 500 errors
- **Check:** Server logs for geocoding messages
- **Solution:** Geocoding failures are handled gracefully; the issue likely lies elsewhere

---

### 3. Debugging Steps

1. **Check Server Logs:**
   ```bash
   cd server
   npm start
   ```
   Look for startup messages indicating database connection and blood group data

2. **Test Database Connection:**
   ```bash
   mysql -u root -p
   USE blood_donor_management;
   SELECT COUNT(*) FROM BLOOD_GROUP;
   SELECT COUNT(*) FROM DONOR;
   ```

3. **Test Health Endpoint:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return JSON with status, database connection, email service, and geocoding status

4. **Enable Development Mode:**
   In `server/.env`, set:
   ```
   NODE_ENV=development
   ```
   This provides more detailed error messages in responses

5. **Check Browser Network Tab:**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Submit the form
   - Click on the failed request to see:
     - Request payload (what was sent)
     - Response body (error message from server)
     - Response headers

---

### 4. Database Schema Issues

If you see errors like "ER_NO_SUCH_TABLE" or "ER_BAD_FIELD_ERROR":

1. **Verify all tables exist:**
   ```sql
   SHOW TABLES;
   ```
   Expected: LOCATION, BLOOD_GROUP, DONOR, CONTACT_NUMBER, BLOOD_COMPATIBILITY, EMERGENCY_REQUEST, OTP

2. **Check LOCATION table schema:**
   ```sql
   DESCRIBE LOCATION;
   ```
   Should have: location_id, city, area, latitude (DECIMAL), longitude (DECIMAL)

3. **Re-run migrations if needed:**
   ```bash
   mysql -u root -p blood_donor_management < migrations/001_update_location_coordinates.sql
   ```

---

### 5. Common Environment Variables

Create `server/.env` file with:

```env
# Database (Required)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=blood_donor_management

# Server
PORT=3001
NODE_ENV=development

# Email (Optional - for OTP)
RESEND_API_KEY=your_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Admin
ADMIN_EMAIL=admin@example.com

# Geocoding (Optional)
GEOCODING_PROVIDER=google
GEOCODING_API_KEY=your_key
ENABLE_GEOCODING_FALLBACK=false
```

---

### 6. Request Payload Validation

A valid donor registration request should include:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "01712345678",
  "alternatePhone": "01812345678",
  "age": 25,
  "dateOfBirth": "1999-01-15",
  "gender": "Male",
  "bloodGroup": "O+",
  "city": "Dhaka",
  "area": "Dhanmondi",
  "address": "Road 27, House 123",
  "latitude": 23.7461,
  "longitude": 90.3742
}
```

**Required fields:** name, email, phone, gender, bloodGroup, city, area
**Optional fields:** alternatePhone, age (auto-calculated from dateOfBirth), dateOfBirth, address, latitude, longitude

**Note:** Latitude and longitude are automatically fetched if not provided and geocoding is configured.
