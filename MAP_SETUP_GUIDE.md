# Map View Setup Guide

This guide explains how to set up the map view functionality in the Blood Donor Management application.

## Prerequisites

You need a Google Maps API key with the **Google Maps Static API** enabled.

### Getting a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Maps Static API** for your project:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Maps Static API"
   - Click "Enable"
4. Create an API key:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

### Configuring API Key Restrictions (Recommended)

To prevent unauthorized use of your API key:

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your production domain (e.g., `yourdomain.com/*`)
   - Add your Vercel preview domains (e.g., `*.vercel.app/*`)
   - For local development, add `localhost:*` or `127.0.0.1:*`
4. Under "API restrictions":
   - Select "Restrict key"
   - Select only "Maps Static API"
5. Click "Save"

## Local Development Setup

1. Create a `.env` file in the root directory of the project:
   ```bash
   cp .env.example .env
   ```

2. Add your Google Maps API key to the `.env` file:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Vercel Deployment Setup

### Important: Environment Variables in Vite

Vite requires environment variables to be available at **build time**. Variables prefixed with `VITE_` are:
- Embedded into the client-side bundle during build
- Exposed to the browser code
- Must be set before building the application

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add the following variable:
   - **Name**: `VITE_GOOGLE_MAPS_API_KEY`
   - **Value**: Your Google Maps API key
   - **Environments**: Select all (Production, Preview, Development)
4. Click "Save"
5. **Important**: Redeploy your application for the changes to take effect
   - Go to "Deployments" tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"

### Troubleshooting Vercel Deployment

If the map is still not showing after deployment:

1. **Check if the environment variable is set correctly**:
   - Go to Vercel Settings > Environment Variables
   - Verify `VITE_GOOGLE_MAPS_API_KEY` is present
   - Make sure it's enabled for all environments

2. **Check the build logs**:
   - Look for any errors during the build process
   - Environment variables should be available during build

3. **Check browser console**:
   - Open DevTools (F12) > Console tab
   - Look for debug messages starting with "DonorMap:"
   - Check if `hasApiKey` is `true`

4. **Check API key restrictions**:
   - Verify your Vercel domain is allowed in Google Cloud Console
   - Check if the Maps Static API is enabled
   - Verify there are no quota limits exceeded

5. **Check the generated map URL**:
   - Look for "DonorMap: Generated map URL" in the console
   - Copy the URL and try to access it directly in a new browser tab
   - Look for any error messages from Google Maps API

## Common Issues and Solutions

### Issue: "Map Configuration Required" message shows

**Cause**: The `VITE_GOOGLE_MAPS_API_KEY` environment variable is not set or not available during build.

**Solution**:
- For local development: Add the key to your `.env` file
- For Vercel: Add the key in Environment Variables and redeploy

### Issue: Map image shows "Failed to load map"

**Possible causes and solutions**:

1. **Invalid API Key**:
   - Verify the API key is correct in your environment variables
   - Check Google Cloud Console to ensure the key exists

2. **API Restrictions**:
   - Check HTTP referrer restrictions in Google Cloud Console
   - Ensure your domain is allowed
   - Temporarily remove restrictions to test

3. **Maps Static API not enabled**:
   - Go to Google Cloud Console
   - Enable "Maps Static API" for your project

4. **Quota Exceeded**:
   - Check your Google Cloud Console for quota usage
   - Upgrade your quota or enable billing if necessary

5. **URL Too Long**:
   - The map URL has a limit of 8192 characters
   - If you have many donors, the URL might exceed this limit
   - Check the console for "Map URL exceeds Google Maps Static API limit" warning

### Issue: Button clicks don't change the view

**Possible causes and solutions**:

1. **JavaScript Error**:
   - Check browser console for errors
   - Look for any error messages before the button click

2. **State Update Issue**:
   - Check console for "DonorSearch: viewMode changed to:" messages
   - If the message appears, the state is updating correctly

## Debug Mode

The current implementation includes debug logging to help troubleshoot issues:

### Console Messages to Look For

1. **On component render**:
   ```
   DonorSearch render: { viewMode: 'list|map', totalDonors: N, donorsWithLocation: N }
   ```

2. **On view mode change**:
   ```
   DonorSearch: viewMode changed to: list|map
   ```

3. **When map component renders**:
   ```
   DonorMap render: { donorCount: N, hasApiKey: true|false, apiKeyPrefix: '...' }
   ```

4. **When map URL is generated**:
   ```
   DonorMap: Generated map URL: { url: '...', urlLength: N, containsApiKey: true, exceedsLimit: false }
   ```

5. **On map image load**:
   ```
   DonorMap: Map image loaded successfully
   ```

6. **On map image error**:
   ```
   DonorMap: Failed to load map image
   ```

## Testing the Map View

1. Navigate to the "Find Donors" page
2. Search for donors (or keep the default filters)
3. Click the "Map View" button
4. You should see:
   - A static map with markers and circles for each donor
   - Different colors for different blood groups
   - A legend showing blood group colors
   - Donor cards below the map

## Map Features

- **Privacy Protection**: Donors are shown as circles (500m radius) rather than exact pinpoints
- **Blood Group Colors**: Each blood group has a distinct color
- **Automatic Zoom**: Map zoom adjusts based on donor locations
- **Legend**: Shows which colors represent which blood groups
- **Responsive**: Works on mobile and desktop devices

## Support

If you continue to experience issues:

1. Check all console messages for debugging information
2. Verify your API key setup in Google Cloud Console
3. Ensure the API key is properly set in Vercel environment variables
4. Try accessing the map URL directly in a browser
5. Check Google Cloud Console for API usage and errors
