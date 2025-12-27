import { supabase } from '../config/supabase';

export interface Location {
  id: string;
  place_name: string;
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
  country?: string;
  is_current: boolean;
  created_at: string;
  user_id: string;
}

export interface LocationInput {
  place_name: string;
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
  country?: string;
  is_current?: boolean;
}

export class LocationService {
  // Get current user's location
  static async getCurrentUserLocation(): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('is_current', true)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Save a new location
  static async saveLocation(location: LocationInput): Promise<Location | null> {
    try {
      // If this is being set as current, unset other current locations
      if (location.is_current) {
        await supabase
          .from('user_locations')
          .update({ is_current: false })
          .eq('is_current', true);
      }

      const { data, error } = await supabase
        .from('user_locations')
        .insert([location])
        .select()
        .single();

      if (error) {
        console.error('Error saving location:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in saveLocation:', error);
      return null;
    }
  }

  // Get all user locations
  static async getUserLocations(): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user locations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserLocations:', error);
      return [];
    }
  }

  // Set a location as current
  static async setCurrentLocation(locationId: string): Promise<boolean> {
    try {
      // First, unset all current locations
      await supabase
        .from('user_locations')
        .update({ is_current: false })
        .eq('is_current', true);

      // Then set the selected location as current
      const { error } = await supabase
        .from('user_locations')
        .update({ is_current: true })
        .eq('id', locationId);

      if (error) {
        console.error('Error setting current location:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setCurrentLocation:', error);
      return false;
    }
  }

  // Delete a location
  static async deleteLocation(locationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_locations')
        .delete()
        .eq('id', locationId);

      if (error) {
        console.error('Error deleting location:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteLocation:', error);
      return false;
    }
  }

  // Get browser geolocation
  static async getBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting browser location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Reverse geocoding (convert coordinates to place name)
  static async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      // Using a simple approach - in production you might want to use a proper geocoding service
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const place = data[0];
          return `${place.name}, ${place.state || place.country}`;
        }
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }

    // Fallback to coordinates
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  // Search for places (simple implementation)
  static async searchPlaces(query: string): Promise<Array<{
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    state?: string;
  }>> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        return data.map((place: any) => ({
          name: place.name,
          latitude: place.lat,
          longitude: place.lon,
          country: place.country,
          state: place.state
        }));
      }
    } catch (error) {
      console.error('Error searching places:', error);
    }

    return [];
  }
}