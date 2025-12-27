import React, { useState, useEffect } from 'react';
import { Play, BookOpen, X, Clock, Filter } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { VideoService, EducationalVideo, VideoTopic } from '../../services/videoService';
import LoadingSpinner from '../Common/LoadingSpinner';

const EducationalVideos: React.FC = () => {
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<EducationalVideo[]>([]);
  const [groupedVideos, setGroupedVideos] = useState<Record<VideoTopic, EducationalVideo[]>>({} as Record<VideoTopic, EducationalVideo[]>);
  const [selectedTopic, setSelectedTopic] = useState<VideoTopic | 'all'>('all');
  const [selectedVideo, setSelectedVideo] = useState<EducationalVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, [language]);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentLang = language === 'hi' ? 'hi' : 'en';
      const fetchedVideos = await VideoService.getVideosByLanguage(currentLang);
      const grouped = await VideoService.getVideosGroupedByTopic(currentLang);
      
      setVideos(fetchedVideos);
      setGroupedVideos(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTopicTranslation = (topic: VideoTopic): string => {
    const topicMap: Record<VideoTopic, string> = {
      ph_levels: t('topicPhLevels'),
      soil_moisture: t('topicSoilMoisture'),
      fertilizer: t('topicFertilizer'),
      weather: t('topicWeather'),
      soil_health: t('topicSoilHealth'),
      water_quality: t('topicWaterQuality'),
      crop_management: t('topicCropManagement'),
      pest_control: t('topicPestControl'),
      irrigation: t('topicIrrigation'),
      general: t('topicGeneral')
    };
    return topicMap[topic] || topic;
  };

  const getTopicColor = (topic: VideoTopic): string => {
    const colorMap: Record<VideoTopic, string> = {
      ph_levels: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400',
      soil_moisture: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-400',
      fertilizer: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400',
      weather: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400',
      soil_health: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400',
      water_quality: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400',
      crop_management: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400',
      pest_control: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400',
      irrigation: 'bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-400',
      general: 'bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400'
    };
    return colorMap[topic] || colorMap.general;
  };

  const filteredVideos = selectedTopic === 'all' 
    ? videos 
    : videos.filter(video => video.topic === selectedTopic);

  const availableTopics = Object.keys(groupedVideos) as VideoTopic[];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 mb-4">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('educationalVideos')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('learnAboutFarming')}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl p-6 text-center">
          <p className="text-red-800 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Topic Filter */}
      {availableTopics.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('selectTopic')}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`px-4 py-2 rounded-xl border-2 transition-all duration-200 ${
                selectedTopic === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white border-transparent shadow-lg'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-600'
              }`}
            >
              {t('allTopics')}
            </button>
            {availableTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-4 py-2 rounded-xl border-2 transition-all duration-200 ${
                  selectedTopic === topic
                    ? getTopicColor(topic) + ' border-2 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                {getTopicTranslation(topic)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('noVideosAvailable')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('noVideosDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const currentLang = language === 'hi' ? 'hi' : 'en';
            const title = VideoService.getLocalizedTitle(video, currentLang);
            const description = VideoService.getLocalizedDescription(video, currentLang);
            
            return (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedVideo(video)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Play className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-4">
                      <Play className="h-8 w-8 text-gray-900" />
                    </div>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {VideoService.formatDuration(video.duration)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Topic Badge */}
                  <div className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold mb-2 border ${getTopicColor(video.topic)}`}>
                    {getTopicTranslation(video.topic)}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {title}
                  </h3>

                  {/* Description */}
                  {description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {description}
                    </p>
                  )}

                  {/* Watch Button */}
                  <button className="mt-4 w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    {t('watchVideo')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {VideoService.getLocalizedTitle(selectedVideo, language === 'hi' ? 'hi' : 'en')}
              </h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black">
              <iframe
                src={VideoService.getEmbedUrl(selectedVideo.video_url)}
                title={VideoService.getLocalizedTitle(selectedVideo, language === 'hi' ? 'hi' : 'en')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Description */}
            {VideoService.getLocalizedDescription(selectedVideo, language === 'hi' ? 'hi' : 'en') && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300">
                  {VideoService.getLocalizedDescription(selectedVideo, language === 'hi' ? 'hi' : 'en')}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t('closeVideo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationalVideos;
