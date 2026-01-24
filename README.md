# Blood Donor Management System

A modern web application for managing blood donors, built with React, TypeScript, and Node.js.

![Blood Donor Management](logo.png)

## Features

- **User Registration & Authentication**: Secure signup/login with OTP verification
- **Donor Profile Management**: Complete donor profiles with blood group, location, and availability
- **Emergency Blood Requests**: Submit and track emergency blood requests
- **Donor Search**: Find donors by blood group, location, and availability
- **Admin Dashboard**: Comprehensive management tools for administrators
- **Statistics & Reports**: Visual analytics on donor data and blood group distribution
- **Location-based Search**: Find nearby donors using geolocation

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT with OTP verification
- **Maps**: Google Maps Static API for location visualization and geocoding

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn
- Google Maps API key (for geocoding and map visualization)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Joydip-007/Blood-Donor-Management.git
   cd Blood-Donor-Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory (see `.env.example`):
   ```env
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   VITE_API_URL=http://localhost:3000
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_for_static_maps
   GEOCODING_API_KEY=your_google_maps_api_key_for_geocoding
   GEOCODING_PROVIDER=google
   ```

4. **Set up the database**
   ```bash
   # Run the database migrations
   psql -d your_database -f database.sql
   ```

5. **Start the development server**
   ```bash
   # Start backend server
   npm run server
   
   # In another terminal, start frontend
   npm run dev
   ```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Admin/           # Admin dashboard components
│   │   ├── Auth/            # Authentication components
│   │   └── ...              # Other feature components
│   ├── contexts/            # React contexts (Auth, etc.)
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript type definitions
├── server/
│   └── index.js             # Express backend server
├── migrations/              # Database migrations
└── database.sql             # Database schema
```

## Google Maps API Setup

This project uses Google Maps APIs for location services:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Required APIs**
   - Maps Static API (for displaying donor locations on maps)
   - Geocoding API (for converting addresses to coordinates)

3. **Create API Key**
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Restrict the key to only the enabled APIs above

4. **Add API Key to Environment**
   - Set `VITE_GOOGLE_MAPS_API_KEY` for frontend (Static Maps)
   - Set `GEOCODING_API_KEY` for backend (Geocoding)

## Admin Features

Administrators have access to:
- Add donors manually (without OTP verification)
- View and manage all registered donors
- Edit donor profiles and blood groups
- Activate/deactivate donor accounts
- Review and approve emergency blood requests
- View statistics and generate reports
- Configure system settings

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - Verify OTP

### Donors
- `GET /api/donors/search` - Search donors
- `GET /api/donors/profile` - Get donor profile
- `POST /api/donors/register` - Register as donor
- `PUT /api/donors/profile` - Update donor profile

### Admin
- `GET /api/admin/donors/all` - Get all donors
- `PUT /api/admin/donors/:id` - Update donor
- `DELETE /api/admin/donors/:id` - Deactivate donor
- `PATCH /api/admin/donors/:id/availability` - Toggle availability

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with default settings

### Manual Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## Support

For support, please open an issue in the GitHub repository.
