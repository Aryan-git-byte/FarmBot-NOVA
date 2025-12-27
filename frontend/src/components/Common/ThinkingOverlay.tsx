import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Search, Database, CloudSun } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ThinkingOverlayProps {
  isVisible: boolean;
}

const ThinkingOverlay: React.FC<ThinkingOverlayProps> = ({ isVisible }) => {
  const { language } = useLanguage();
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = language === 'hi' ? [
    { text: "डेटा का विश्लेषण कर रहा हूँ...", icon: Database },
    { text: "मौसम की जानकारी जाँच रहा हूँ...", icon: CloudSun },
    { text: "कृषि ज्ञान ढूँढ रहा हूँ...", icon: Search },
    { text: "सुझाव तैयार कर रहा हूँ...", icon: Brain },
    { text: "बस एक पल...", icon: Sparkles }
  ] : [
    { text: "Analyzing sensor data...", icon: Database },
    { text: "Checking weather conditions...", icon: CloudSun },
    { text: "Consulting agricultural knowledge...", icon: Search },
    { text: "Formulating insights...", icon: Brain },
    { text: "Just a moment...", icon: Sparkles }
  ];

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible, messages.length]);

  if (!isVisible) return null;

  const CurrentIcon = messages[messageIndex].icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-200 dark:border-gray-700 transform transition-all animate-in zoom-in-95 duration-200">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 animate-spin-slow">
            <div className="h-full w-full rounded-full border-4 border-t-green-500 border-r-transparent border-b-blue-500 border-l-transparent opacity-75"></div>
          </div>
          <div className="absolute inset-2 animate-spin-reverse-slow">
            <div className="h-full w-full rounded-full border-4 border-t-transparent border-r-purple-500 border-b-transparent border-l-yellow-500 opacity-75"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <CurrentIcon className="h-8 w-8 text-gray-700 dark:text-gray-200 animate-pulse" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 min-h-[3.5rem] flex items-center justify-center">
          {messages[messageIndex].text}
        </h3>
        
        <div className="flex justify-center space-x-1 mt-4">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className="w-2 h-2 rounded-full bg-green-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThinkingOverlay;
