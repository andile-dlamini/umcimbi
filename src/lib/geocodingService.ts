/**
 * Geocoding service abstraction.
 * Currently uses OpenStreetMap Nominatim (free, no API key required).
 * Can be swapped for Google Maps, Mapbox, or OpenCage in the future.
 */

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

/**
 * Geocode an address string to coordinates.
 * @param address - The address to geocode
 * @returns Coordinates or null if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address || address.trim().length === 0) {
    return null;
  }

  try {
    // Use OpenStreetMap Nominatim (free, no API key)
    const encodedAddress = encodeURIComponent(address.trim());
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'IsikoPlannerApp/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding request failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
