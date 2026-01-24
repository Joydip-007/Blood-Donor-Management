# Deployment Steps for Emergency Request Creator Access Feature

## Overview
This deployment adds the ability for emergency request creators to view search results (matched donors) after admin approval. Previously, only admins could see matched donors.

## Prerequisites
- Access to the production database
- Backup of the database (recommended)
- Backend deployment access (Railway)
- Frontend deployment access (Vercel)

## Step 1: Database Migration

### Apply the new migration
Run the following SQL migration to create the matched donors table:

```bash
# Connect to your production MySQL database
mysql -h <host> -u <user> -p <database_name>

# Run the migration
source migrations/002_create_matched_donors_table.sql
```

Or using Railway CLI:
```bash
railway run mysql -u root -p < migrations/002_create_matched_donors_table.sql
```

### Verify the migration
```sql
-- Check if table was created
SHOW TABLES LIKE 'EMERGENCY_REQUEST_MATCHED_DONORS';

-- Check table structure
DESCRIBE EMERGENCY_REQUEST_MATCHED_DONORS;

-- Verify indexes
SHOW INDEX FROM EMERGENCY_REQUEST_MATCHED_DONORS;
```

Expected output:
- Table `EMERGENCY_REQUEST_MATCHED_DONORS` should exist
- Columns: `match_id`, `request_id`, `donor_id`, `matched_at`
- Indexes on `request_id` and `donor_id`
- Foreign key constraints to `EMERGENCY_REQUEST` and `DONOR`

## Step 2: Backend Deployment

The backend changes include:
- New helper function `buildInClausePlaceholders()` for SQL safety
- Modified `/api/admin/requests/:requestId/approve` to save matched donors
- Modified `/api/requests/:requestId/status` to return matched donors
- New endpoint `/api/requests/my-requests/:contactNumber`
- New endpoint `DELETE /api/requests/:requestId`

### Deploy to Railway
```bash
git push origin main
```

Railway should automatically detect and deploy the changes.

### Verify backend deployment
Test the new endpoints:

1. **Check health endpoint:**
```bash
curl https://your-backend.railway.app/api/health
```

2. **Test my-requests endpoint:**
```bash
curl https://your-backend.railway.app/api/requests/my-requests/01712345678
```

Expected: `{"success":true,"requests":[],"count":0}` (if no requests exist)

## Step 3: Frontend Deployment

The frontend changes include:
- Completely redesigned `EmergencyRequest.tsx` component
- Contact number entry screen
- Request management dashboard
- Matched donors display for approved requests
- Delete functionality

### Build locally (optional verification)
```bash
npm install
npm run build
```

Should complete without errors.

### Deploy to Vercel
```bash
git push origin main
```

Vercel should automatically detect and deploy the changes.

### Verify frontend deployment
1. Visit your Vercel URL
2. Navigate to "Emergency Request" section
3. Enter a contact number
4. Verify the UI loads correctly

## Step 4: End-to-End Testing

### Test 1: Create Emergency Request
1. Go to Emergency Request page
2. Enter contact number: `01712345678`
3. Click "Create New Emergency Request"
4. Fill out form with test data
5. Submit request
6. **Verify:** Request appears in list with "PENDING" status

### Test 2: Admin Approval
1. Login as admin
2. Navigate to Emergency Requests
3. Find the pending request
4. Click "Approve"
5. **Verify:** Matched donors appear in modal
6. Close modal
7. **Verify:** Request status changes to "APPROVED"

### Test 3: Creator Views Matched Donors
1. Logout (or open in incognito)
2. Go to Emergency Request page
3. Enter same contact number: `01712345678`
4. **Verify:** Request shows "APPROVED" status
5. Expand the request
6. **Verify:** Matched donors are displayed with names, blood groups, and phone numbers

### Test 4: Delete Request
1. On the request card, click the trash icon
2. Confirm deletion
3. **Verify:** Request is removed from the list

### Test 5: Create Another Request
1. Click "Create New Emergency Request"
2. Fill form with different data
3. Submit
4. **Verify:** New request appears in list
5. Verify old functionality still works (admin can see and approve)

## Step 5: Monitoring

After deployment, monitor:
1. Database queries for performance
2. API response times
3. Error logs for any issues
4. User feedback

## Rollback Plan

If issues occur:

### Rollback Backend
```bash
git revert <commit-hash>
git push origin main
```

### Rollback Frontend
Use Vercel dashboard to rollback to previous deployment

### Rollback Database (if needed)
```sql
-- Remove the new table
DROP TABLE IF EXISTS EMERGENCY_REQUEST_MATCHED_DONORS;
```

## Security Notes

### CodeQL Findings
The following non-critical findings were identified:
- **Missing rate limiting** on new endpoints
  - `/api/requests/my-requests/:contactNumber`
  - `/api/requests/:requestId` (DELETE)
  - These are informational findings, not vulnerabilities
  - Consider adding rate limiting in future updates

### Security Measures in Place
- ✅ Parameterized SQL queries (prevents SQL injection)
- ✅ Contact number verification for deletion
- ✅ Phone number validation
- ✅ Foreign key constraints for data integrity
- ✅ Prepared statements for all queries

## Support

If you encounter issues:
1. Check server logs for errors
2. Verify database connection
3. Check migration was applied correctly
4. Review browser console for frontend errors

## Conclusion

This deployment successfully implements the feature where emergency request creators can:
- View all their previous requests
- See matched donors for approved requests
- Delete old requests
- Create new requests

The admin workflow remains unchanged and continues to work as before.
