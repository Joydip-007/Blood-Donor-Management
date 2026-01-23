import axios from 'axios';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName?: string;
}

/**
 * Geocode a location using the backend API (which uses Locationiq)
 */
export async function geocodeLocation(
  city: string,
  area: string,
  country: string = 'Bangladesh'
): Promise<GeocodeResult | null> {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const response = await axios.post(`${API_URL}/api/geocode`, {
      city,
      area,
      country
    });

    if (response.data.success) {
      return {
        latitude: response.data.latitude,
        longitude: response.data.longitude
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Convert string coordinates to numbers, handling empty strings
 */
export function parseCoordinate(value: string | number | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Automatically fetch coordinates for a location if not already provided.
 * Falls back gracefully if geocoding fails (coordinates are optional).
 * 
 * @param existingLat - Current latitude value (may be empty)
 * @param existingLon - Current longitude value (may be empty)
 * @param city - City name for geocoding
 * @param area - Area/locality name for geocoding
 * @returns Object with latitude and longitude strings (or original values if geocoding not needed/failed)
 */
export async function autoGeocodeIfNeeded(
  existingLat: string,
  existingLon: string,
  city: string,
  area: string
): Promise<{ latitude: string; longitude: string }> {
  let latitude = existingLat;
  let longitude = existingLon;
  
  // Only attempt geocoding if coordinates are not already provided
  if ((!latitude || !longitude) && city && area) {
    try {
      const coords = await geocodeLocation(city, area);
      if (coords) {
        latitude = coords.latitude.toString();
        longitude = coords.longitude.toString();
      }
    } catch (error) {
      // Silently fail - coordinates are optional
      // Log for debugging purposes only
      if (import.meta.env.DEV) {
        console.log('Auto-geocoding failed, continuing without coordinates:', error);
      }
    }
  }
  
  return { latitude, longitude };
}
