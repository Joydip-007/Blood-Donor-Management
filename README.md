# Blood Donor Management App

A comprehensive blood donor management system with a React frontend and Express.js/MySQL backend, following the Entity-Relationship Diagram (ERD) defined in the repository.

## Project Structure

```
├── database.sql          # MySQL database schema (from ERD)
├── erd.jpeg              # Entity Relationship Diagram
├── index.html            # Frontend entry point
├── package.json          # Frontend dependencies
├── vite.config.ts        # Vite configuration
├── src/                  # Frontend React application
│   ├── components/       # React components
│   ├── contexts/         # React contexts (Auth)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions (API config)
└── server/               # Backend Express.js API
    ├── index.js          # API server
    ├── package.json      # Server dependencies
    └── .env.example      # Environment configuration template
```

## Database Schema (ERD)

The system follows the ERD structure with the following tables:

- **LOCATION**: Stores location information (city, area, coordinates)
- **BLOOD_GROUP**: Blood types and Rh factors (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **DONOR**: Donor information with relationships to LOCATION and BLOOD_GROUP
- **CONTACT_NUMBER**: Multiple phone numbers per donor (1:N relationship)
- **BLOOD_COMPATIBILITY**: Blood type compatibility rules for matching donors
- **EMERGENCY_REQUEST**: Emergency blood requests from hospitals
- **OTP**: OTP verification records for authentication

## Setup Instructions

### 1. Database Setup

1. Install MySQL and create the database:
   ```bash
   mysql -u root -p < database.sql
   ```

2. This will create the `blood_donor_management` database with all required tables and seed data.

### 2. Backend Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from template:
   ```bash
   cp .env.example .env
   ```

4. Configure database connection in `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=blood_donor_management
   PORT=3001
   ```

5. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend Setup

1. In the root directory, install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Configure API URL in `.env`:
   ```
   VITE_API_URL=http://localhost:3001
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/request-otp` - Request OTP for login/signup
- `POST /api/auth/verify-otp` - Verify OTP and get session token

### Donors
- `POST /api/donors/register` - Register a new donor
- `GET /api/donors/profile` - Get donor profile
- `PUT /api/donors/profile` - Update donor profile
- `DELETE /api/donors/profile` - Soft delete donor (deactivate)
- `POST /api/donors/search` - Search donors with filters

### Emergency Requests
- `POST /api/requests/create` - Create emergency blood request
- `GET /api/requests/active` - Get all active requests

### Statistics
- `GET /api/statistics` - Get donor statistics

## Key Features

- **OTP-based Authentication**: Secure login via email or phone OTP
- **Blood Compatibility Matching**: Uses BLOOD_COMPATIBILITY table to find compatible donors
- **90-Day Availability Logic**: Donors become unavailable for 90 days after donation
- **Location-based Search**: Find donors by city and area
- **Geocoding**: Automatic coordinate fetching using Locationiq API
- **Soft Delete**: Donor profiles can be deactivated without losing data
- **Normalized Database**: 3NF compliant schema matching the ERD

## 🗺️ Geocoding Configuration

This application uses **Locationiq** for automatic geocoding of donor locations.

### Setup

1. **Get API Key:**
   - Sign up at https://locationiq.com/
   - Free tier includes 5,000 requests/day

2. **Backend Configuration (Railway):**
   ```bash
   GEOCODING_API_KEY=your_locationiq_api_key
   ```

3. **Frontend Configuration (Vercel):**
   ```bash
   VITE_API_URL=https://your-backend.railway.app
   ```

### Features

- ✅ Auto-fill coordinates from city/area
- ✅ Manual coordinate entry
- ✅ Admin bulk geocoding for existing locations
- ✅ Rate limiting (2 requests/second)

### Usage

1. **During donor registration:** Enter city and area, then click "Auto-fill Coordinates"
2. **Admin panel:** Use "Geocode All Locations" button to bulk geocode existing data

## Database Migration

If you have an existing database, run the migration to update coordinate columns:

```bash
mysql -u root -p blood_donor_management < migrations/001_update_location_coordinates.sql
```

This migration:
- Cleans invalid coordinate data
- Updates latitude/longitude to DECIMAL type for precision
- Adds index for better query performance

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend**: Express.js, Node.js
- **Database**: MySQL
- **Authentication**: OTP-based (in-memory sessions for demo)

## Original Project

This code bundle is based on the original Figma design available at:
https://www.figma.com/design/yaNn4bjpwXqXcUUdUlSih2/Blood-Donor-Management-App

  
