# Admin-Approved Emergency Request Workflow Implementation Summary

## Overview
This implementation transforms the emergency request system to require admin approval before donors are matched, and restricts the Find Donor section to map-only view.

## Changes Made

### 1. Frontend - DonorSearch Component (Map-Only View)
**File:** `src/components/DonorSearch.tsx`

**Changes:**
- Removed list/map view toggle buttons
- Removed all list view rendering logic (both mobile card layout and desktop table layout)
- Removed statistics section showing donor counts
- Component now always displays map view only
- Search filters continue to work with map view
- Updated header from "Donor Search & Map" to "Donor Map"

**Impact:**
- Users can only view donors on a map interface
- Cleaner, focused UI for location-based donor search
- Reduced complexity in component state management

### 2. Frontend - EmergencyRequest Component
**File:** `src/components/EmergencyRequest.tsx`

**Changes:**
- Removed `MatchedDonor` type import (no longer needed)
- Removed `matchedDonors` state variable
- Added `requestId` state variable to track submitted request
- Updated success message:
  - Changed from "We found X compatible donors" to "Your emergency request has been submitted for admin review"
  - Added Request ID display
  - Added status badge showing "Pending Admin Approval"
  - Removed matched donors list display
  - Added "What Happens Next?" section explaining the approval workflow
  - Added important notice to save the request ID
- Added CheckCircle icon import for success indication

**Impact:**
- Users no longer see immediate donor matches
- Clear communication about pending admin review
- Request tracking via unique ID
- Better expectation management for requesters

### 3. Database Schema
**File:** `migrations/001_update_emergency_request_table.sql`

**New Migration:**
```sql
ALTER TABLE EMERGENCY_REQUEST
  ADD COLUMN patient_name VARCHAR(100),
  ADD COLUMN units_required DECIMAL(4,1) DEFAULT 1.0,
  ADD COLUMN urgency ENUM('critical', 'high', 'medium') DEFAULT 'high',
  ADD COLUMN required_by DATETIME,
  ADD COLUMN notes TEXT,
  ADD COLUMN status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  ADD COLUMN admin_id INT,
  ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN approved_at DATETIME,
  ADD COLUMN rejection_reason TEXT;
```

**Indexes Added:**
- `idx_emergency_status` on status column
- `idx_emergency_urgency` on urgency column
- `idx_emergency_created_at` on created_at column
- `idx_emergency_required_by` on required_by column

**Impact:**
- Support for complete emergency request workflow
- Better query performance with appropriate indexes
- Tracking of request lifecycle (pending → approved/rejected → completed)

### 4. Backend - Emergency Request Endpoint
**File:** `server/index.js`

**Modified Endpoint:** `POST /api/requests/create`

**Old Behavior:**
- Accepted basic fields (bloodGroup, city, area, hospitalName, contactPhone)
- Immediately found compatible donors
- Returned matched donors in response

**New Behavior:**
- Accepts additional fields: patientName, unitsRequired, urgency, requiredBy, notes, contactName
- Saves request with status='pending'
- Does NOT find or return matched donors
- Returns only: requestId, status='pending', confirmation message

**Response Format:**
```json
{
  "success": true,
  "requestId": "123",
  "status": "pending",
  "message": "Your emergency request has been submitted for admin review"
}
```

### 5. Backend - New Admin Endpoints
**File:** `server/index.js`

**Added Endpoints:**

#### `GET /api/admin/requests/pending`
- Returns all pending emergency requests
- Sorted by urgency (critical → high → medium) then by created_at
- Requires admin authentication

#### `GET /api/admin/requests/all`
- Returns all emergency requests with optional filters:
  - status (pending/approved/rejected/completed)
  - urgency (critical/high/medium)
  - bloodGroup
  - city
- Sorted by urgency then created_at (DESC)
- Requires admin authentication

#### `PUT /api/admin/requests/:requestId/approve`
- Approves a pending request
- Automatically finds compatible donors based on blood group and location
- Updates request status to 'approved'
- Sets approved_at timestamp and admin_id
- Returns matched donors in response
- Requires admin authentication

**Response Format:**
```json
{
  "success": true,
  "message": "Request approved successfully",
  "matchedDonors": [...],
  "matchedCount": 5
}
```

#### `PUT /api/admin/requests/:requestId/reject`
- Rejects a pending request
- Updates request status to 'rejected'
- Stores rejection reason
- Sets admin_id
- Requires admin authentication

#### `GET /api/requests/:requestId/status`
- Public endpoint (no auth required)
- Allows requester to check their request status
- Returns request details and current status

### 6. Frontend - Admin Emergency Requests Component
**File:** `src/components/Admin/AdminEmergencyRequests.tsx`

**Features:**
- **Statistics Dashboard:**
  - Total requests
  - Pending count
  - Approved count
  - Rejected count
  - Critical pending count

- **Filters:**
  - Status (all/pending/approved/rejected/completed)
  - Urgency (critical/high/medium)
  - Blood Group
  - City
  - Search by patient name, hospital, or phone

- **Request Cards:**
  - Shows all request details
  - Color-coded by urgency (critical=red, high=orange, medium=yellow)
  - Status badges
  - Patient info, blood group, hospital, location
  - Contact information
  - Notes display
  - Action buttons (Approve/Reject) for pending requests

- **Approve Workflow:**
  - Click Approve button
  - System automatically finds compatible donors
  - Shows count of matched donors
  - Displays matched donors in modal
  - Updates request status

- **Reject Workflow:**
  - Click Reject button
  - Modal appears for rejection reason
  - Must provide reason to reject
  - Updates request status with reason

### 7. Admin Dashboard Integration
**File:** `src/components/Admin/AdminDashboard.tsx`

**Changes:**
- Added Emergency Requests card at the top of the dashboard
- Shows pending count badge (red badge with count)
- Fetches pending count on dashboard load
- Added new navigation option: 'emergency-requests'

**File:** `src/App.tsx`

**Changes:**
- Added `AdminEmergencyRequests` component import
- Added 'admin-emergency-requests' to activeTab type
- Added new route/view for emergency requests
- Updated viewMap to include 'emergency-requests' → 'admin-emergency-requests'

## Deployment Instructions (Railway + Vercel)

Since you mentioned using Railway for backend/database and Vercel for frontend, here are the deployment steps:

### Step 1: Deploy Database Migration to Railway

You have two options to run the migration on Railway MySQL:

**Option A: Using Railway CLI (Recommended)**
```bash
# Install Railway CLI if you haven't
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Connect to MySQL and run migration
railway run mysql -u root -p < migrations/001_update_emergency_request_table.sql
```

**Option B: Using Direct MySQL Connection**
1. Get your Railway MySQL credentials from the Railway dashboard
2. Run the migration:
```bash
mysql -h <railway-mysql-host> -u <railway-user> -p<railway-password> blood_donor_management < migrations/001_update_emergency_request_table.sql
```

**Option C: Using Railway MySQL Console**
1. Go to your Railway project dashboard
2. Click on your MySQL service
3. Open the "Data" tab or "Connect" tab
4. Copy the contents of `migrations/001_update_emergency_request_table.sql`
5. Paste and execute in the Railway MySQL console

### Step 2: Deploy Backend Changes to Railway

Railway should automatically deploy when you push to your main branch. If not:

```bash
git push origin main
```

Railway will detect the changes in the `server` directory and redeploy automatically.

### Step 3: Deploy Frontend Changes to Vercel

Vercel should automatically deploy when you push to your main branch. If not:

```bash
git push origin main
```

Or manually trigger a deployment from the Vercel dashboard.

### Step 4: Verify Deployment

1. **Check Backend Health:**
   ```
   GET https://your-backend.railway.app/api/health
   ```

2. **Test New Endpoints:**
   - `GET https://your-backend.railway.app/api/admin/requests/pending`
   - Should return `{"success": true, "requests": [], "count": 0}` if no requests yet

3. **Check Frontend:**
   - Visit your Vercel URL
   - Try accessing "Find Donors" - should show map only
   - Try creating an emergency request - should show pending status

## Local Testing Instructions

### Prerequisites
1. Run the database migration (local development):
```bash
mysql -u your_username -p blood_donor_management < migrations/001_update_emergency_request_table.sql
```

2. Ensure server dependencies are installed:
```bash
cd server
npm install
```

3. Ensure frontend dependencies are installed:
```bash
npm install
```

4. Build frontend:
```bash
npm run build
```

### Test 1: Map-Only View in Find Donor Section
1. Login as a regular user
2. Navigate to "Find Donors" tab
3. **Expected:** Only map view is visible, no toggle buttons
4. **Expected:** No statistics section showing donor counts
5. **Expected:** Search filters still work
6. Enter search criteria and click "Search Donors"
7. **Expected:** Results display only on map with donor cards below

### Test 2: Emergency Request Submission
1. Navigate to "Emergency Request" tab
2. Fill out the complete form:
   - Patient Name: "Test Patient"
   - Blood Group: "O+"
   - Units Required: "2"
   - Urgency: "Critical"
   - Required By: Select a future date/time
   - Hospital Name: "Test Hospital"
   - City: "Dhaka"
   - Area: "Dhanmondi"
   - Contact Name: "Test Contact"
   - Contact Phone: Valid 11-digit BD number
   - Notes: "Urgent case"
3. Click "Submit Emergency Request"
4. **Expected:** Success message shows:
   - "Request Submitted Successfully!"
   - Request ID displayed
   - Status: "Pending Admin Approval"
   - "What Happens Next?" section
   - NO matched donors displayed
5. Note the Request ID for later testing

### Test 3: Admin Dashboard - Emergency Requests
1. Logout and login as admin user
2. **Expected:** Dashboard shows "Emergency Requests" card at top
3. **Expected:** Card shows pending count badge
4. Click on "Emergency Requests" card
5. **Expected:** Navigates to Emergency Requests management page
6. **Expected:** See statistics showing:
   - Total requests
   - Pending count (should be at least 1 from Test 2)
   - Other counts
7. **Expected:** Request from Test 2 is visible in pending requests

### Test 4: Filter and Search
1. On Emergency Requests page, use filters:
   - Set Status filter to "Pending"
   - Click "Apply Filters"
2. **Expected:** Only pending requests shown
3. Try searching by patient name from Test 2
4. **Expected:** Request appears in results
5. Try filtering by Blood Group "O+"
6. **Expected:** Request appears in results

### Test 5: Approve Request
1. On Emergency Requests page, find the request from Test 2
2. Click "Approve" button
3. **Expected:** 
   - Processing indicator appears
   - System finds compatible donors automatically
   - Alert shows "Request approved! Found X compatible donors"
   - Modal appears showing matched donors
   - Each donor shows: name, blood group, location, phone
4. Close the modal
5. **Expected:** Request status changes to "Approved"
6. **Expected:** Approve/Reject buttons no longer visible
7. **Expected:** Approved timestamp is shown

### Test 6: Reject Request
1. Create another emergency request (repeat Test 2)
2. Navigate to Admin Emergency Requests
3. Find the new request
4. Click "Reject" button
5. **Expected:** Rejection reason modal appears
6. Enter a reason: "Duplicate request"
7. Click "Confirm Rejection"
8. **Expected:** 
   - Request status changes to "Rejected"
   - Rejection reason is displayed on the card
   - Approve/Reject buttons no longer visible

### Test 7: Request Status Check (Optional)
If implemented, test the public status check endpoint:
```bash
curl http://localhost:3001/api/requests/[REQUEST_ID]/status
```
**Expected:** Returns request details with current status

### Test 8: Verify Existing Functionality
1. Test donor registration still works
2. Test donor profile updates still work
3. Test donor search (find donors) still works
4. Test admin donor management still works
5. Test statistics page still works
6. **Expected:** All existing functionality remains intact

## API Documentation

### Emergency Request Object
```typescript
interface EmergencyRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalName: string;
  city: string;
  area: string;
  contactPhone: string;
  urgency: 'critical' | 'high' | 'medium';
  requiredBy: string; // ISO datetime
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string; // ISO datetime
  approvedAt?: string; // ISO datetime
  rejectionReason?: string;
}
```

### Matched Donor Object
```typescript
interface MatchedDonor {
  id: string;
  name: string;
  bloodGroup: string;
  city: string;
  area: string;
  phone: string;
  latitude?: number;
  longitude?: number;
}
```

## Security Considerations

1. **Admin Authentication:** All admin endpoints require `isAdmin` middleware
2. **Phone Validation:** Phone numbers are validated and cleaned before storage
3. **SQL Injection Protection:** All queries use parameterized statements
4. **Data Privacy:** Matched donor information only revealed after admin approval

## Performance Considerations

1. **Database Indexes:** Added indexes on frequently queried columns (status, urgency, created_at, required_by)
2. **Pagination:** Can be added to admin endpoints if request volume grows
3. **Caching:** Admin stats could be cached to reduce database load

## Future Enhancements

1. **Notifications:**
   - Email/SMS to requester when request is approved/rejected
   - Email/SMS to matched donors
   - Real-time notifications to admins for new critical requests

2. **Request Status Page:**
   - Public page where requesters can check status with Request ID
   - QR code for easy status checking

3. **Analytics:**
   - Average approval time by urgency
   - Success rate of finding donors
   - Most common blood groups requested
   - Geographic distribution of requests

4. **Donor Confirmation:**
   - Allow matched donors to confirm/decline donation
   - Track donor responses
   - Send alternative donors if some decline

5. **Request Priority Queue:**
   - Auto-prioritize critical requests
   - Escalation for pending requests past required_by date
   - SLA tracking

## Troubleshooting

### Issue: Migration fails
**Solution:** Check if columns already exist, manually verify database schema

### Issue: Admin can't see pending count
**Solution:** Check that the endpoint `/api/admin/requests/pending` is accessible and returns data

### Issue: Approve doesn't find donors
**Solution:** 
- Verify there are active donors with compatible blood groups in the same city
- Check blood compatibility rules in `BLOOD_COMPATIBILITY` table
- Ensure donors have `is_active = TRUE` and proper availability

### Issue: Build fails
**Solution:** 
- Run `npm install` to ensure all dependencies are present
- Check for TypeScript errors
- Verify all imports are correct

## Files Modified

1. `src/components/DonorSearch.tsx`
2. `src/components/EmergencyRequest.tsx` - **Updated to show previous requests and matched donors**
3. `src/components/Admin/AdminDashboard.tsx`
4. `src/App.tsx`
5. `server/index.js` - **Added endpoints for matched donors and user requests**

## Files Created

1. `migrations/001_update_emergency_request_table.sql`
2. `migrations/002_create_matched_donors_table.sql` - **New migration for storing matched donors**
3. `src/components/Admin/AdminEmergencyRequests.tsx`
4. `IMPLEMENTATION_SUMMARY.md` (this file)

## New Features Added (2026-01-24)

### 1. Database: Matched Donors Storage
**File:** `migrations/002_create_matched_donors_table.sql`

**Description:**
- Created `EMERGENCY_REQUEST_MATCHED_DONORS` table to persist matched donors for each emergency request
- Links donors to requests via foreign keys
- Automatically populated when admin approves a request
- Allows request creators to retrieve matched donor information later

**Schema:**
```sql
CREATE TABLE EMERGENCY_REQUEST_MATCHED_DONORS (
    match_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    donor_id INT NOT NULL,
    matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES EMERGENCY_REQUEST(request_id) ON DELETE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES DONOR(donor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_request_donor (request_id, donor_id)
);
```

### 2. Backend: New API Endpoints

#### `GET /api/requests/my-requests/:contactNumber`
**Purpose:** Fetch all emergency requests created by a specific contact number

**Features:**
- Returns all requests made by the user (identified by contact number)
- Includes matched donors for approved requests
- Sorted by creation date (newest first)
- Public endpoint (no authentication required)

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "123",
      "status": "approved",
      "patientName": "John Doe",
      "bloodGroup": "O+",
      "matchedDonors": [
        {
          "id": "456",
          "name": "Jane Smith",
          "bloodGroup": "O+",
          "city": "Dhaka",
          "area": "Dhanmondi",
          "phone": "01712345678"
        }
      ]
    }
  ],
  "count": 1
}
```

#### `DELETE /api/requests/:requestId`
**Purpose:** Allow request creators to delete their own requests

**Security:**
- Requires contact number in request body
- Verifies ownership before deletion
- Returns 403 if contact number doesn't match

**Request Body:**
```json
{
  "contactNumber": "01712345678"
}
```

#### Modified: `PUT /api/admin/requests/:requestId/approve`
**New Behavior:**
- After finding compatible donors, saves them to `EMERGENCY_REQUEST_MATCHED_DONORS` table
- Uses bulk insert for efficiency
- Matched donors persist in database for retrieval by request creator

#### Modified: `GET /api/requests/:requestId/status`
**New Behavior:**
- For approved requests, fetches and returns matched donors from database
- Includes donor contact information
- Request creators can now see their matched donors

### 3. Frontend: Enhanced Emergency Request Component

**File:** `src/components/EmergencyRequest.tsx`

**Major Changes:**
1. **Contact Number Entry Screen**
   - Users must first enter their contact number
   - This number is used to identify and fetch their requests
   - Validates Bangladesh phone number format

2. **Request Management Dashboard**
   - Shows all previous requests made by the user
   - Displays status for each request (pending/approved/rejected/completed)
   - Collapsible request cards with full details
   - Color-coded status and urgency badges

3. **Matched Donors Display**
   - For approved requests, shows all matched donors
   - Displays donor name, blood group, location, and phone number
   - Phone numbers are clickable (tel: links)
   - Grid layout for easy scanning

4. **Delete Functionality**
   - Users can delete old requests with confirmation dialog
   - Trash icon on each request card
   - Automatically refreshes list after deletion

5. **Create New Request**
   - Toggle button to show/hide form
   - Form pre-fills contact number from entry screen
   - After submission, automatically refreshes request list
   - No longer shows immediate success message with Request ID

**User Flow:**
1. User enters contact number → validates → continues
2. Sees all their previous requests
3. Can expand any request to see details
4. Sees matched donors for approved requests
5. Can delete old requests
6. Can create new requests
7. Can refresh list or change contact number

### 4. Deployment Instructions Update

**Database Migration:**
Run the new migration after deploying:
```bash
mysql -u your_username -p blood_donor_management < migrations/002_create_matched_donors_table.sql
```

**Testing the New Features:**

1. **Test Request Creator Flow:**
   - Navigate to Emergency Request page
   - Enter a valid Bangladesh phone number
   - Create a new emergency request
   - Note the request appears in the list with "Pending" status

2. **Test Admin Approval:**
   - Login as admin
   - Navigate to Emergency Requests
   - Approve the pending request
   - Verify matched donors are shown to admin

3. **Test Request Creator Sees Results:**
   - Go back to Emergency Request page (as the request creator)
   - Enter the same contact number
   - Verify the request now shows "Approved" status
   - Expand the request
   - Verify matched donors are displayed with contact information

4. **Test Delete:**
   - Click the trash icon on any request
   - Confirm deletion
   - Verify request is removed from the list

## API Documentation Updates

### New Request Object (Extended)
```typescript
interface EmergencyRequestData {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  hospitalName: string;
  city: string;
  area: string;
  urgency: 'critical' | 'high' | 'medium';
  requiredBy: string;
  contactNumber: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  matchedDonors?: MatchedDonor[];  // NEW: Available for approved requests
}
```

## Success Criteria Checklist

- [x] Find Donor section shows ONLY map view
- [x] Emergency request submission returns only confirmation (no donors)
- [x] Requests are saved with 'pending' status
- [x] Admin dashboard shows emergency requests section
- [x] Admin can view, filter, and search requests
- [x] Admin can approve requests and see matched donors
- [x] Admin can reject requests with reason
- [x] Request status updates correctly throughout workflow
- [x] Frontend builds successfully
- [x] Matched donors are saved to database when admin approves
- [x] Request creators can view all their requests by entering contact number
- [x] Request creators can see matched donors for approved requests
- [x] Request creators can delete old requests
- [x] Request creators can create new requests
- [ ] All manual tests pass
- [ ] Database migration runs successfully
- [ ] All existing functionality remains intact (to be verified)
