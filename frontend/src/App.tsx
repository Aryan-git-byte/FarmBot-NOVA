import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import ChatbotPage from './components/AI/ChatbotPage';
import RagChatInterface from './components/AI/RagChatInterface';

import SimpleNavigation from './components/Layout/SimpleNavigation';
import IntegratedDashboard from './components/Dashboard/IntegratedDashboard';
import EducationalVideos from './components/Educational/EducationalVideos';
import MobileOptimizedSettings from './components/Settings/MobileOptimizedSettings';
import SimpleHelp from './components/Help/SimpleHelp';
import TestAIPage from './components/Testing/TestAIPage';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Check if accessing hidden test route
    const path = window.location.pathname;
    if (path === '/test-ai') {
      setActiveTab('test-ai');
    }

    // Initialize app
    const initializeApp = async () => {
      try {
        // Simple initialization for MVP
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </ErrorBoundary>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <IntegratedDashboard />;
      case 'manual-entry':
        return <EducationalVideos />;
      case 'ai-chatbot':
        return <ChatbotPage onNavigateBack={() => setActiveTab('dashboard')} />;
      case 'rag-ai':
        return <RagChatInterface onNavigateBack={() => setActiveTab('dashboard')} />;
      case 'help':
        return <SimpleHelp />;
      case 'settings':
        return <MobileOptimizedSettings />;
      case 'test-ai':
        return <TestAIPage />;
      default:
        return <IntegratedDashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {activeTab !== 'test-ai' && activeTab !== 'rag-ai' && (
              <SimpleNavigation 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
              />
            )}
            <main className={activeTab === 'test-ai' || activeTab === 'rag-ai' ? '' : 'py-6'}>
              {renderContent()}
            </main>
          </div>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;