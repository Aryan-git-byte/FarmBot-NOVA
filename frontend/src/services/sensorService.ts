import { supabase, SensorData, ProcessedSensorReading, SensorType, deriveSensorStatus, getSensorUnit } from '../config/supabase';

export class SensorService {
  // Get sensor data with optional filtering
  static async getSensorData(filters?: {
    sensorType?: SensorType;
    dateRange?: { start: Date; end: Date };
    limit?: number;
    latitude?: number;
    longitude?: number;
  }): Promise<ProcessedSensorReading[]> {
    try {
      let query = supabase
        .from('sensor_data')
        .select('*')
        .order('timestamp', { ascending: false });

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

      // Convert flat sensor data to individual sensor readings
      const readings: ProcessedSensorReading[] = [];
      
      data?.forEach(record => {
        // Extract each sensor type from the record
        const sensorTypes: SensorType[] = ['soil_moisture', 'ec', 'soil_temperature', 'n', 'p', 'k', 'ph'];
        
        sensorTypes.forEach(sensorType => {
          const value = record[sensorType];
          if (value !== null && value !== undefined) {
            // Filter by sensor type if specified
            if (filters?.sensorType && sensorType !== filters.sensorType) {
              return;
            }

            readings.push({
              id: `${record.id}_${sensorType}`,
              sensor_type: sensorType,
              value: value,
              unit: getSensorUnit(sensorType),
              status: deriveSensorStatus(sensorType, value),
              timestamp: record.timestamp,
              latitude: record.latitude,
              longitude: record.longitude
            });
          }
        });
      });

      return readings;
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      throw error;
    }
  }

  // Get latest readings for each sensor type
  static async getLatestReadings(): Promise<ProcessedSensorReading[]> {
    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      const latestRecord = data[0];
      const readings: ProcessedSensorReading[] = [];
      
      // Convert the latest record to individual sensor readings
      const sensorTypes: SensorType[] = ['soil_moisture', 'ec', 'soil_temperature', 'n', 'p', 'k', 'ph'];
      
      sensorTypes.forEach(sensorType => {
        const value = latestRecord[sensorType];
        if (value !== null && value !== undefined) {
          readings.push({
            id: `${latestRecord.id}_${sensorType}`,
            sensor_type: sensorType,
            value: value,
            unit: getSensorUnit(sensorType),
            status: deriveSensorStatus(sensorType, value),
            timestamp: latestRecord.timestamp,
            latitude: latestRecord.latitude,
            longitude: latestRecord.longitude
          });
        }
      });

      return readings;
    } catch (error) {
      console.error('Error fetching latest readings:', error);
      throw error;
    }
  }

  // Subscribe to real-time sensor data updates
  static subscribeToSensorData(callback: (payload: any) => void) {
    const channel = supabase
      .channel('sensor_data_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sensor_data',
        },
        (payload) => {
          callback(payload);
        }
      );

    channel.subscribe();
    return channel;
  }

  // Add new sensor reading (for testing/simulation)
  static async addSensorReading(reading: Omit<SensorData, 'id' | 'timestamp'>): Promise<SensorData> {
    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .insert([reading])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding sensor reading:', error);
      throw error;
    }
  }

  // Insert sample data for demonstration
  static async insertSampleData(): Promise<void> {
    try {
      const sampleData = this.generateSampleData();
      
      const { error } = await supabase
        .from('sensor_data')
        .insert(sampleData);

      if (error) throw error;
    } catch (error) {
      console.error('Error inserting sample data:', error);
      throw error;
    }
  }

  // Generate realistic sample sensor data for the last 7 days
  private static generateSampleData(): Omit<SensorData, 'id'>[] {
    const data: Omit<SensorData, 'id'>[] = [];
    
    // Sample locations in India (latitude, longitude)
    const locations = [
      { lat: 28.9845, lon: 77.7064 },
      { lat: 30.9010, lon: 75.8573 },
      { lat: 22.7196, lon: 75.8577 },
      { lat: 19.9975, lon: 73.7898 }
    ];

    // Generate data for the last 7 days
    for (let day = 0; day < 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      // Generate multiple readings per day (every 3 hours)
      for (let hour = 0; hour < 24; hour += 3) {
        const timestamp = new Date(date);
        timestamp.setHours(hour);

        locations.forEach(location => {
          const reading = this.generateRealisticReading(location.lat, location.lon, timestamp);
          data.push({
            ...reading,
            timestamp: timestamp.toISOString()
          });
        });
      }
    }

    return data;
  }

  private static generateRealisticReading(
    latitude: number,
    longitude: number,
    timestamp: Date
  ): Omit<SensorData, 'id' | 'timestamp'> {
    const hour = timestamp.getHours();
    const season = this.getCurrentSeason(timestamp);
    
    // Base values with seasonal and time-based variations
    const baseValues = {
      soil_moisture: this.generateValue(45, 15, hour, season, 'moisture'),
      ec: this.generateValue(1.2, 0.4, hour, season, 'ec'),
      soil_temperature: this.generateValue(22, 8, hour, season, 'temperature'),
      n: this.generateValue(35, 15, hour, season, 'nutrients'),
      p: this.generateValue(18, 8, hour, season, 'nutrients'),
      k: this.generateValue(150, 60, hour, season, 'nutrients'),
      ph: this.generateValue(6.8, 0.8, hour, season, 'ph')
    };

    // Ensure values are within realistic bounds
    return {
      latitude,
      longitude,
      soil_moisture: Math.max(20, Math.min(80, Math.round(baseValues.soil_moisture * 10) / 10)),
      ec: Math.max(0.1, Math.min(3.0, Math.round(baseValues.ec * 100) / 100)),
      soil_temperature: Math.max(10, Math.min(40, Math.round(baseValues.soil_temperature * 10) / 10)),
      n: Math.max(5, Math.min(100, Math.round(baseValues.n))),
      p: Math.max(2, Math.min(50, Math.round(baseValues.p))),
      k: Math.max(50, Math.min(400, Math.round(baseValues.k))),
      ph: Math.max(4.0, Math.min(9.0, Math.round(baseValues.ph * 100) / 100))
    };
  }

  private static generateValue(
    base: number, 
    variation: number, 
    hour: number, 
    season: string, 
    type: string
  ): number {
    let value = base;
    
    // Seasonal adjustments
    const seasonalAdjustments = {
      winter: { moisture: -5, temperature: -8, nutrients: -3, ec: 0.1, ph: 0 },
      summer: { moisture: -10, temperature: 12, nutrients: 2, ec: 0.2, ph: -0.1 },
      monsoon: { moisture: 20, temperature: -2, nutrients: -5, ec: -0.3, ph: 0.1 },
      post_monsoon: { moisture: 5, temperature: 2, nutrients: 1, ec: 0, ph: 0 }
    };
    
    const adjustment = seasonalAdjustments[season as keyof typeof seasonalAdjustments]?.[type as keyof typeof seasonalAdjustments.winter] || 0;
    value += adjustment;
    
    // Time-based variations
    if (type === 'temperature') {
      const tempVariation = Math.sin((hour - 6) * Math.PI / 12) * (variation * 0.6);
      value += tempVariation;
    } else if (type === 'moisture') {
      const moistureVariation = Math.cos((hour - 12) * Math.PI / 12) * (variation * 0.3);
      value += moistureVariation;
    }
    
    // Add random variation
    value += (Math.random() - 0.5) * variation;
    
    return value;
  }

  private static getCurrentSeason(date: Date): string {
    const month = date.getMonth() + 1; // 1-12
    
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'summer';
    if (month >= 6 && month <= 9) return 'monsoon';
    return 'post_monsoon'; // Oct-Nov
  }

  // Get sensor status counts for dashboard overview
  static async getStatusCounts(): Promise<{ optimal: number; warning: number; critical: number }> {
    try {
      const latestReadings = await this.getLatestReadings();
      
      const counts = latestReadings.reduce(
        (acc, reading) => {
          acc[reading.status]++;
          return acc;
        },
        { optimal: 0, warning: 0, critical: 0 }
      );

      return counts;
    } catch (error) {
      console.error('Error getting status counts:', error);
      return { optimal: 0, warning: 0, critical: 0 };
    }
  }
}