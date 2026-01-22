# Deployment Guide - Blood Donor Management System

This guide covers deploying the Blood Donor Management System with geocoding support.

## Prerequisites

- MySQL database (version 5.7 or higher)
- Node.js (version 16 or higher)
- Locationiq API key (for geocoding)
- Resend API key (for email OTP)

## Environment Variables

### Backend (Railway/Server)

```bash
# Database Configuration
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=blood_donor_management

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com

# Geocoding Service (Locationiq)
GEOCODING_API_KEY=pk.xxxxxxxxx

# Server Port (optional, defaults to 3001)
PORT=3001
```

### Frontend (Vercel)

```bash
# Backend API URL
VITE_API_URL=https://your-backend.railway.app
```

## Database Setup

### 1. Initial Setup (New Installation)

If this is a fresh installation, run the main schema:

```bash
mysql -u root -p < database.sql
```

### 2. Migration (Existing Installation)

If you already have a database running with VARCHAR coordinates, run the migration:

```bash
mysql -u root -p blood_donor_management < migrations/001_update_location_coordinates.sql
```

**What the migration does:**
- Cleans any invalid existing coordinate data
- Converts `latitude` and `longitude` columns from VARCHAR to DECIMAL(10,8) and DECIMAL(11,8)
- Adds an index on coordinates for better query performance

**⚠️ Important:** Back up your database before running migrations!

```bash
mysqldump -u root -p blood_donor_management > backup_before_migration.sql
```

## Deployment Steps

### Step 1: Deploy Backend (Railway)

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Railway**
   - Go to https://railway.app
   - Create new project
   - Connect your GitHub repository
   - Select the `server` directory as root

3. **Configure Environment Variables**
   - Add all backend environment variables listed above
   - Railway will auto-provision MySQL if needed

4. **Deploy**
   - Railway will automatically build and deploy
   - Note your backend URL (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Frontend (Vercel)

1. **Connect to Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Root Directory: Leave as `/` (not `server`)
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variable**
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-app.vercel.app`

### Step 3: Run Database Migration (If Needed)

If you have existing data, connect to your Railway MySQL instance and run the migration:

```bash
# Using Railway CLI
railway connect mysql

# Or using direct connection
mysql -h <railway-host> -u <railway-user> -p<railway-password> blood_donor_management < migrations/001_update_location_coordinates.sql
```

### Step 4: Verify Deployment

1. **Check Backend Health**
   ```
   GET https://your-backend.railway.app/api/health
   ```
   
   Should return:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "emailService": "available",
     "geocoding": "available"
   }
   ```

2. **Check Frontend**
   - Visit your Vercel URL
   - Try registering a donor
   - Test the geocoding button

## Post-Deployment Tasks

### 1. Bulk Geocode Existing Locations

If you have existing locations without coordinates:

1. Log in as admin (use the email set in `ADMIN_EMAIL`)
2. Navigate to Admin Dashboard → Donor List
3. Click "Geocode All Locations" button

This will:
- Find all locations missing coordinates
- Call Locationiq API for each location
- Update the database with coordinates
- Rate-limit to 2 requests/second (free tier limit)

### 2. Test Geocoding

1. Register a new donor
2. Enter city and area
3. Click "Auto-fill Coordinates from Address"
4. Verify coordinates are populated

## Troubleshooting

### Geocoding Not Working

**Symptom:** "Geocoding not configured" error

**Solution:** 
- Verify `GEOCODING_API_KEY` is set in Railway environment variables
- Restart the backend service
- Check health endpoint shows `"geocoding": "available"`

### Database Migration Failed

**Symptom:** Migration fails with syntax error

**Solution:**
- Ensure MySQL version is 5.7 or higher
- Check that REGEXP syntax is supported
- Manually clean invalid data first:
  ```sql
  UPDATE LOCATION SET latitude = NULL WHERE latitude = '';
  UPDATE LOCATION SET longitude = NULL WHERE longitude = '';
  ```

### Email OTP Not Sending

**Symptom:** OTP not received via email

**Solution:**
- Verify `RESEND_API_KEY` is correct
- Check `RESEND_FROM_EMAIL` is a verified domain in Resend
- In development, OTP will be logged to console if Resend is not configured

## Monitoring

### Backend Logs (Railway)

View in Railway dashboard:
- Build logs
- Runtime logs
- Error tracking

### Frontend Logs (Vercel)

View in Vercel dashboard:
- Build logs
- Function logs
- Analytics

## Security Checklist

- [ ] Change default admin email
- [ ] Use strong database passwords
- [ ] Enable HTTPS (automatic on Railway/Vercel)
- [ ] Rotate API keys regularly
- [ ] Set up database backups
- [ ] Monitor API usage (Locationiq, Resend)

## Cost Estimates

- **Railway:** Free tier available, ~$5-10/month for production
- **Vercel:** Free tier sufficient for most use cases
- **Locationiq:** Free tier (5,000 requests/day), paid plans from $49/month
- **Resend:** Free tier (3,000 emails/month), paid plans from $20/month

## Support

For issues or questions:
- Check the GitHub repository issues
- Review the API health endpoint
- Check Railway/Vercel logs
