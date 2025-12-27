import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Database, LogOut, Save } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { SensorService } from '../../services/sensorService';

interface SettingsProps {
  onSignOut: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onSignOut }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Settings state
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    criticalOnly: false
  });
  
  const [preferences, setPreferences] = useState({
    temperatureUnit: 'celsius',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York',
    autoRefresh: true,
    refreshInterval: 30
  });

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
      onSignOut();
    } catch (err) {
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const handleInsertSampleData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await SensorService.insertSampleData();
      setSuccess('Sample data inserted successfully! Check the dashboard to see the new data.');
    } catch (err) {
      setError('Failed to insert sample data. ' + (err instanceof Error ? err.message : 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      // In a real app, you would save these settings to Supabase
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account preferences and application settings
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="h-6 w-6 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={user?.id || ''}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 font-mono text-xs"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
            <input
              type="text"
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="h-6 w-6 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Critical Alerts Only</p>
              <p className="text-sm text-gray-600">Only receive critical system alerts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.criticalOnly}
                onChange={(e) => setNotifications(prev => ({ ...prev, criticalOnly: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <SettingsIcon className="h-6 w-6 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Application Preferences</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature Unit</label>
            <select
              value={preferences.temperatureUnit}
              onChange={(e) => setPreferences(prev => ({ ...prev, temperatureUnit: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="celsius">Celsius (°C)</option>
              <option value="fahrenheit">Fahrenheit (°F)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
            <select
              value={preferences.dateFormat}
              onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto Refresh Interval</label>
            <select
              value={preferences.refreshInterval}
              onChange={(e) => setPreferences(prev => ({ ...prev, refreshInterval: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Database className="h-6 w-6 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Demo Data</h3>
            <p className="text-blue-800 text-sm mb-4">
              Insert sample sensor data to explore the dashboard features. This will add 7 days of realistic farm monitoring data.
            </p>
            <button
              onClick={handleInsertSampleData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>{loading ? 'Inserting...' : 'Insert Sample Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? 'Saving...' : 'Save Settings'}</span>
        </button>
        
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="sm:w-auto bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;