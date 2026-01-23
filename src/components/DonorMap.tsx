import React from 'react';
import { MapPin } from 'lucide-react';
import { Donor, BloodGroup } from '../types';

interface DonorMapProps {
  donors: Donor[];
}

// Blood group color mapping (matching requirements)
const BLOOD_GROUP_COLORS: Record<BloodGroup, string> = {
  'A+': '0xFF0000',   // Red
  'A-': '0xCC0000',   // Dark Red
  'B+': '0x0000FF',   // Blue
  'B-': '0x0000CC',   // Dark Blue
  'AB+': '0xFF00FF',  // Magenta
  'AB-': '0xCC00CC',  // Dark Magenta
  'O+': '0x00FF00',   // Green
  'O-': '0x00CC00',   // Dark Green
};

// Display colors for legend (CSS-compatible)
const LEGEND_COLORS: Record<BloodGroup, string> = {
  'A+': '#FF0000',
  'A-': '#CC0000',
  'B+': '#0000FF',
  'B-': '#0000CC',
  'AB+': '#FF00FF',
  'AB-': '#CC00CC',
  'O+': '#00FF00',
  'O-': '#00CC00',
};

// Map configuration constants
const MAP_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  SCALE: 2,
  CIRCLE_RADIUS_METERS: 500,
  CIRCLE_POINTS: 16,
  // Approximate meters per degree latitude at the equator
  METERS_PER_DEGREE: 111000,
};

// Zoom level thresholds based on coordinate spread
const ZOOM_THRESHOLDS = [
  { maxDiff: 10, zoom: 6 },
  { maxDiff: 5, zoom: 7 },
  { maxDiff: 2, zoom: 8 },
  { maxDiff: 1, zoom: 9 },
  { maxDiff: 0.5, zoom: 10 },
  { maxDiff: 0.2, zoom: 11 },
  { maxDiff: 0.1, zoom: 12 },
  { maxDiff: 0, zoom: 13 },
];

export function DonorMap({ donors }: DonorMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  console.log('[DonorMap] Component rendered with', donors.length, 'donors');
  console.log('[DonorMap] API Key present:', !!apiKey);

  // Check if API key is configured
  if (!apiKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 md:p-8 text-center">
        <MapPin size={48} className="text-yellow-500 mx-auto mb-4" />
        <p className="text-yellow-900 font-medium mb-2 text-base md:text-lg">Map Configuration Required</p>
        <p className="text-sm md:text-base text-yellow-800">
          Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.
        </p>
      </div>
    );
  }

  // Handle empty state
  if (donors.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 md:p-8 text-center">
        <MapPin size={48} className="text-gray-400 mx-auto mb-4" />
        <p className="text-gray-700 font-medium mb-2 text-base md:text-lg">No Donors to Display</p>
        <p className="text-sm md:text-base text-gray-600">
          No donors with location data are available to show on the map.
        </p>
      </div>
    );
  }

  // Calculate map center (average of all coordinates)
  const centerLat = donors.reduce((sum, d) => sum + (d.latitude || 0), 0) / donors.length;
  const centerLng = donors.reduce((sum, d) => sum + (d.longitude || 0), 0) / donors.length;

  // Calculate zoom level based on coordinate spread
  const lats = donors.map(d => d.latitude || 0);
  const lngs = donors.map(d => d.longitude || 0);
  const maxLat = Math.max(...lats);
  const minLat = Math.min(...lats);
  const maxLng = Math.max(...lngs);
  const minLng = Math.min(...lngs);
  const maxDiff = Math.max(maxLat - minLat, maxLng - minLng);

  // Find appropriate zoom level from thresholds
  const zoom = ZOOM_THRESHOLDS.find(threshold => maxDiff > threshold.maxDiff)?.zoom || 13;

  // Generate circle points for a given location
  const generateCircle = (lat: number, lng: number): string => {
    const radiusDegrees = MAP_CONFIG.CIRCLE_RADIUS_METERS / MAP_CONFIG.METERS_PER_DEGREE;
    const circlePoints: string[] = [];
    
    for (let i = 0; i <= MAP_CONFIG.CIRCLE_POINTS; i++) {
      const angle = (i * 2 * Math.PI) / MAP_CONFIG.CIRCLE_POINTS;
      const latOffset = radiusDegrees * Math.cos(angle);
      const lngOffset = (radiusDegrees * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180);
      const pointLat = lat + latOffset;
      const pointLng = lng + lngOffset;
      circlePoints.push(`${pointLat},${pointLng}`);
    }
    
    return circlePoints.join('|');
  };

  // Build Google Maps Static API URL
  const buildMapUrl = (): string => {
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      center: `${centerLat},${centerLng}`,
      zoom: zoom.toString(),
      size: `${MAP_CONFIG.WIDTH}x${MAP_CONFIG.HEIGHT}`,
      scale: MAP_CONFIG.SCALE.toString(),
      maptype: 'roadmap',
      key: apiKey,
    });

    let url = `${baseUrl}?${params.toString()}`;

    // Group donors by blood group for markers
    const donorsByBloodGroup = donors.reduce((acc, donor) => {
      if (!acc[donor.bloodGroup]) {
        acc[donor.bloodGroup] = [];
      }
      acc[donor.bloodGroup].push(donor);
      return acc;
    }, {} as Record<BloodGroup, Donor[]>);

    // Add markers for each blood group
    Object.entries(donorsByBloodGroup).forEach(([bloodGroup, groupDonors]) => {
      const color = BLOOD_GROUP_COLORS[bloodGroup as BloodGroup];
      const locations = groupDonors
        .map(d => `${d.latitude},${d.longitude}`)
        .join('|');
      url += `&markers=color:${color}|${locations}`;
    });

    // Add circular paths around each donor
    donors.forEach(donor => {
      if (donor.latitude && donor.longitude) {
        const color = BLOOD_GROUP_COLORS[donor.bloodGroup];
        const circlePoints = generateCircle(donor.latitude, donor.longitude);
        // Semi-transparent fill (1A opacity) and visible border (80 opacity)
        url += `&path=color:${color}80|fillcolor:${color}1A|weight:2|${circlePoints}`;
      }
    });

    return url;
  };

  const mapUrl = buildMapUrl();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Map Image */}
      <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <img
          src={mapUrl}
          alt="Donor locations map"
          className="w-full h-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Informational Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm md:text-base text-blue-800">
          <MapPin size={16} className="inline mr-2" />
          Circles represent approximate donor locations based on city and area geocoding
        </p>
      </div>

      {/* Legend */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
        <h4 className="font-semibold text-base md:text-lg mb-4">Blood Group Legend</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {(Object.keys(LEGEND_COLORS) as BloodGroup[]).map(bloodGroup => {
            const donorCount = donors.filter(d => d.bloodGroup === bloodGroup).length;
            if (donorCount === 0) return null;
            
            return (
              <div key={bloodGroup} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{ 
                    backgroundColor: LEGEND_COLORS[bloodGroup],
                    borderColor: LEGEND_COLORS[bloodGroup]
                  }}
                />
                <span className="text-sm md:text-base font-medium">
                  {bloodGroup} ({donorCount})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
