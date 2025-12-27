import { supabase, ManualEntry } from '../config/supabase';

export class ManualEntryService {
  // Get manual entries with optional filtering
  static async getManualEntries(filters?: {
    entryType?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
  }): Promise<ManualEntry[]> {
    try {
      let query = supabase
        .from('manual_entry')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.entryType) {
        query = query.eq('entry_type', filters.entryType);
      }

      if (filters?.dateRange) {
        query = query
          .gte('timestamp', filters.dateRange.start.toISOString())
          .lte('timestamp', filters.dateRange.end.toISOString());
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching manual entries:', error);
      throw error;
    }
  }

  // Add new manual entry
  static async addManualEntry(entry: Omit<ManualEntry, 'id' | 'timestamp'>): Promise<ManualEntry> {
    try {
      const { data, error } = await supabase
        .from('manual_entry')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding manual entry:', error);
      throw error;
    }
  }

  // Update manual entry
  static async updateManualEntry(id: string, updates: Partial<Omit<ManualEntry, 'id'>>): Promise<ManualEntry> {
    try {
      const { data, error } = await supabase
        .from('manual_entry')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating manual entry:', error);
      throw error;
    }
  }

  // Delete manual entry
  static async deleteManualEntry(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('manual_entry')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting manual entry:', error);
      throw error;
    }
  }

  // Subscribe to real-time manual entry updates
  static subscribeToManualEntries(callback: (payload: any) => void) {
    const channel = supabase
      .channel('manual_entry_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manual_entry',
        },
        callback
      )
      .subscribe();

    return channel;
  }
}