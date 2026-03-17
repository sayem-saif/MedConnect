export const LOCATION_DATA: Record<string, Record<string, string[]>> = {
  India: {
    Delhi: ['New Delhi'],
    Haryana: ['Gurugram', 'Gurgaon', 'Faridabad'],
    Maharashtra: ['Mumbai', 'Pune', 'Navi Mumbai'],
    Karnataka: ['Bengaluru'],
    'Tamil Nadu': ['Chennai'],
  },
  'United States': {
    'New York': ['New York'],
    Arizona: ['Phoenix'],
    California: ['Los Angeles', 'San Francisco'],
    Texas: ['Houston'],
  },
  Canada: {
    Ontario: ['Toronto', 'Ottawa'],
    Quebec: ['Montreal'],
    Alberta: ['Calgary'],
  },
};

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'New Delhi': { lat: 28.6139, lng: 77.2090 },
  Gurugram: { lat: 28.4595, lng: 77.0266 },
  Gurgaon: { lat: 28.4595, lng: 77.0266 },
  Faridabad: { lat: 28.4089, lng: 77.3178 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  'Navi Mumbai': { lat: 19.0330, lng: 73.0297 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  Phoenix: { lat: 33.4484, lng: -112.0740 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  Houston: { lat: 29.7604, lng: -95.3698 },
  Toronto: { lat: 43.6532, lng: -79.3832 },
  Ottawa: { lat: 45.4215, lng: -75.6972 },
  Montreal: { lat: 45.5017, lng: -73.5673 },
  Calgary: { lat: 51.0447, lng: -114.0719 },
};

export const COUNTRIES = Object.keys(LOCATION_DATA);

export const getStatesByCountry = (country: string): string[] => {
  return country ? Object.keys(LOCATION_DATA[country] || {}) : [];
};

export const getCitiesByCountryAndState = (country: string, state: string): string[] => {
  if (!country || !state) return [];
  return LOCATION_DATA[country]?.[state] || [];
};

export const getCityCoordinates = (city: string): { lat: number; lng: number } | null => {
  if (!city) return null;
  return CITY_COORDINATES[city] || null;
};
