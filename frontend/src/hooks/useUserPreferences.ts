import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export interface UserPreferences {
  id: string;
  user_id: string;
  language: string;
  theme: 'light' | 'dark';
  date_format: string;
  timezone: string;
  auto_refresh: boolean;
  refresh_interval: number;
  temperature_unit: 'celsius' | 'fahrenheit';
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs = {
          user_id: user.id,
          language: 'hi',
          theme: 'light' as const,
          date_format: 'DD/MM/YY',
          timezone: 'Asia/Kolkata',
          auto_refresh: true,
          refresh_interval: 30,
          temperature_unit: 'celsius' as const,
          notifications_enabled: true
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert([defaultPrefs])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setPreferences(newPrefs);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    try {
      if (!preferences) return false;

      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', preferences.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPreferences(data);
      return true;
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      return false;
    }
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    reload: loadPreferences
  };
};