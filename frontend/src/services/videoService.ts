import { supabase } from '../config/supabase';

export interface EducationalVideo {
  id: string;
  title_en: string;
  title_hi: string;
  description_en?: string;
  description_hi?: string;
  video_url: string;
  thumbnail_url?: string;
  topic: VideoTopic;
  language: 'en' | 'hi';
  duration?: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type VideoTopic = 
  | 'ph_levels'
  | 'soil_moisture'
  | 'fertilizer'
  | 'weather'
  | 'soil_health'
  | 'water_quality'
  | 'crop_management'
  | 'pest_control'
  | 'irrigation'
  | 'general';

export class VideoService {
  /**
   * Fetch all educational videos filtered by language
   */
  static async getVideosByLanguage(language: 'en' | 'hi'): Promise<EducationalVideo[]> {
    try {
      const { data, error } = await supabase
        .from('educational_videos')
        .select('*')
        .eq('language', language)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVideosByLanguage:', error);
      return [];
    }
  }

  /**
   * Fetch educational videos by topic and language
   */
  static async getVideosByTopic(
    topic: VideoTopic,
    language: 'en' | 'hi'
  ): Promise<EducationalVideo[]> {
    try {
      const { data, error } = await supabase
        .from('educational_videos')
        .select('*')
        .eq('topic', topic)
        .eq('language', language)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching videos by topic:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVideosByTopic:', error);
      return [];
    }
  }

  /**
   * Fetch all topics that have videos in a specific language
   */
  static async getAvailableTopics(language: 'en' | 'hi'): Promise<VideoTopic[]> {
    try {
      const { data, error } = await supabase
        .from('educational_videos')
        .select('topic')
        .eq('language', language)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching topics:', error);
        throw error;
      }

      // Get unique topics
      const uniqueTopics = [...new Set(data?.map((item) => item.topic as VideoTopic) || [])];
      return uniqueTopics;
    } catch (error) {
      console.error('Error in getAvailableTopics:', error);
      return [];
    }
  }

  /**
   * Get a single video by ID
   */
  static async getVideoById(id: string): Promise<EducationalVideo | null> {
    try {
      const { data, error } = await supabase
        .from('educational_videos')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching video by ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getVideoById:', error);
      return null;
    }
  }

  /**
   * Get videos grouped by topic
   */
  static async getVideosGroupedByTopic(
    language: 'en' | 'hi'
  ): Promise<Record<VideoTopic, EducationalVideo[]>> {
    try {
      const videos = await this.getVideosByLanguage(language);
      
      // Group videos by topic
      const grouped = videos.reduce((acc, video) => {
        if (!acc[video.topic]) {
          acc[video.topic] = [];
        }
        acc[video.topic].push(video);
        return acc;
      }, {} as Record<VideoTopic, EducationalVideo[]>);

      return grouped;
    } catch (error) {
      console.error('Error in getVideosGroupedByTopic:', error);
      return {} as Record<VideoTopic, EducationalVideo[]>;
    }
  }

  /**
   * Format duration from seconds to MM:SS
   */
  static formatDuration(seconds?: number): string {
    if (!seconds) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get the localized title for a video based on current language
   */
  static getLocalizedTitle(video: EducationalVideo, language: 'en' | 'hi'): string {
    return language === 'hi' ? video.title_hi : video.title_en;
  }

  /**
   * Get the localized description for a video based on current language
   */
  static getLocalizedDescription(video: EducationalVideo, language: 'en' | 'hi'): string {
    return language === 'hi' 
      ? (video.description_hi || '') 
      : (video.description_en || '');
  }

  /**
   * Convert a YouTube URL to an embeddable format
   * Supports various YouTube URL formats:
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://youtu.be/VIDEO_ID
   * - https://www.youtube.com/embed/VIDEO_ID (already in embed format)
   */
  static getEmbedUrl(videoUrl: string): string {
    try {
      // If already an embed URL, return as is
      if (videoUrl.includes('/embed/')) {
        return videoUrl;
      }

      // Extract video ID from various YouTube URL formats
      let videoId: string | null = null;

      // Format: https://www.youtube.com/watch?v=VIDEO_ID
      const watchMatch = videoUrl.match(/[?&]v=([^&]+)/);
      if (watchMatch) {
        videoId = watchMatch[1];
      }

      // Format: https://youtu.be/VIDEO_ID
      const shortMatch = videoUrl.match(/youtu\.be\/([^?&]+)/);
      if (shortMatch) {
        videoId = shortMatch[1];
      }

      // If we found a video ID, create embed URL
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      // If not a YouTube URL or couldn't parse, return original
      return videoUrl;
    } catch (error) {
      console.error('Error converting to embed URL:', error);
      return videoUrl;
    }
  }
}
