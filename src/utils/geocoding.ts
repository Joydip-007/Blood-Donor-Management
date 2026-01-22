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
