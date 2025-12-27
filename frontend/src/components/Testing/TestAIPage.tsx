import React, { useState, useRef } from 'react';
import { AiService, BulkTestCase, BulkTestResult } from '../../services/aiService';
import { Download, Upload, Play, StopCircle, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const TestAIPage: React.FC = () => {
  const [testCases, setTestCases] = useState<BulkTestCase[]>([]);
  const [results, setResults] = useState<BulkTestResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    avgResponseTime: 0
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedCases = AiService.parseCsvToBulkTestCases(content);
        setTestCases(parsedCases);
        setResults([]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessTests = async () => {
    if (testCases.length === 0) {
      setError('Please upload a CSV file first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: testCases.length });
    abortControllerRef.current = new AbortController();

    try {
      const processedResults = await AiService.processBulkQueries(
        testCases,
        (current, total, result) => {
          setProgress({ current, total });
          setResults(prev => [...prev, result]);
        }
      );

      // Calculate statistics
      const successful = processedResults.filter(r => r.status === 'success').length;
      const failed = processedResults.filter(r => r.status === 'error').length;
      const avgTime = processedResults.reduce((sum, r) => sum + r.responseTime, 0) / processedResults.length;

      setStats({
        total: processedResults.length,
        successful,
        failed,
        avgResponseTime: avgTime
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process test cases');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
    }
  };

  const handleDownloadResults = async (format: 'csv' | 'json') => {
    if (results.length === 0) {
      setError('No results to download');
      return;
    }

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        content = await AiService.exportBulkResultsToCSV(results);
        filename = `ai-test-results-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        content = await AiService.exportBulkResultsToJSON(results);
        filename = `ai-test-results-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download results');
    }
  };

  const handleDownloadSampleCSV = () => {
    const sampleCSV = `id,latitude,longitude,soil_moisture,soil_ph,nitrogen,phosphorus,potassium,crop_type,language
1,28.6139,77.2090,45,6.5,120,45,180,wheat,en
2,19.0760,72.8777,35,7.2,95,38,150,rice,en
3,13.0827,80.2707,55,6.8,110,42,165,tomato,en
4,22.5726,88.3639,40,7.0,100,40,160,potato,hi
5,23.0225,72.5714,30,6.2,85,35,145,corn,en
6,26.9124,75.7873,50,6.9,105,44,170,wheat,hi
7,12.9716,77.5946,38,7.1,115,46,175,rice,en
8,17.3850,78.4867,42,6.4,90,39,155,tomato,en
9,21.1458,79.0882,48,6.7,98,41,162,potato,hi
10,25.3176,82.9739,33,7.3,88,36,148,corn,en`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-test-cases.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🧪 AI Bulk Testing Suite
              </h1>
              <p className="text-gray-600">
                Test AI responses with multiple soil and environmental parameters
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Hidden Route</div>
              <div className="text-xs text-gray-400">/test-ai</div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload Test Cases
            </h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">Click to upload CSV file</p>
                <p className="text-sm text-gray-400 mt-1">or drag and drop</p>
              </div>

              <button
                onClick={handleDownloadSampleCSV}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Sample CSV Template
              </button>

              {testCases.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      {testCases.length} test cases loaded
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" />
              Processing Control
            </h2>

            <div className="space-y-4">
              {!isProcessing ? (
                <button
                  onClick={handleProcessTests}
                  disabled={testCases.length === 0}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5" />
                  Start Processing Tests
                </button>
              ) : (
                <button
                  onClick={handleStopProcessing}
                  className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <StopCircle className="w-5 h-5" />
                  Stop Processing
                </button>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span className="font-medium">
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    Processing {progress.current} of {progress.total} tests...
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2 text-blue-700 text-xs">
                      <span className="animate-pulse">🌤️</span>
                      <span>Fetching real-time weather data from OpenWeather API for each location...</span>
                    </div>
                  </div>
                </div>
              )}

              {results.length > 0 && !isProcessing && (
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-semibold text-gray-700 mb-2">Download Results</h3>
                  <button
                    onClick={() => handleDownloadResults('csv')}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download as CSV
                  </button>
                  <button
                    onClick={() => handleDownloadResults('json')}
                    className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Download as JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Statistics */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-green-600">{stats.successful}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(stats.avgResponseTime)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Test Results ({results.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Parameters</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Response Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800 font-medium">{result.id}</td>
                      <td className="py-3 px-4">
                        {result.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Error
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {result.input.latitude && result.input.longitude
                          ? `${result.input.latitude.toFixed(2)}, ${result.input.longitude.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        <div className="space-y-1">
                          {result.input.soilMoisture && (
                            <div>💧 Moisture: {result.input.soilMoisture}%</div>
                          )}
                          {result.input.soilPH && (
                            <div>⚗️ pH: {result.input.soilPH}</div>
                          )}
                          {result.weatherData && (
                            <div className="text-blue-600">
                              🌤️ {result.weatherData.temperature}°C, {result.weatherData.humidity}%
                            </div>
                          )}
                          {result.input.cropType && (
                            <div>🌾 {result.input.cropType}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-gray-600 text-sm">
                          <Clock className="w-3 h-3" />
                          {Math.round(result.responseTime)}ms
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                            View Details
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg max-w-md">
                            {result.weatherData && (
                              <div className="mb-3 pb-3 border-b border-gray-200">
                                <div className="font-semibold text-gray-700 mb-2">Weather Data (Auto-fetched)</div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div>🌡️ Temperature: {result.weatherData.temperature}°C</div>
                                  <div>💧 Humidity: {result.weatherData.humidity}%</div>
                                  <div>🌤️ Condition: {result.weatherData.weather_description}</div>
                                  <div>💨 Wind: {result.weatherData.wind_speed} km/h</div>
                                  {result.weatherData.rainfall > 0 && (
                                    <div>🌧️ Rainfall: {result.weatherData.rainfall}mm</div>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="text-gray-700 text-xs whitespace-pre-wrap break-words">
                              {result.status === 'success' 
                                ? result.response.substring(0, 200) + '...'
                                : result.error}
                            </div>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">📋 CSV Format Instructions</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                <span>🌤️</span>
                <span>Weather Data Auto-Fetched</span>
              </div>
              <p className="text-xs text-blue-600">
                Weather data (temperature, humidity, conditions, wind speed, rainfall) is automatically 
                fetched from OpenWeather API for each latitude/longitude. You don't need to include 
                temperature or humidity in your CSV!
              </p>
            </div>
            
            <p><strong>Required Headers:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>id</code> - Unique identifier for each test case</li>
              <li><code>latitude</code> - Geographic latitude (decimal) - <strong>Required for weather data</strong></li>
              <li><code>longitude</code> - Geographic longitude (decimal) - <strong>Required for weather data</strong></li>
              <li><code>soil_moisture</code> - Soil moisture percentage (optional)</li>
              <li><code>soil_ph</code> - Soil pH value (optional)</li>
              <li><code>nitrogen</code> - Nitrogen content in mg/kg (optional)</li>
              <li><code>phosphorus</code> - Phosphorus content in mg/kg (optional)</li>
              <li><code>potassium</code> - Potassium content in mg/kg (optional)</li>
              <li><code>crop_type</code> - Type of crop like wheat, rice, tomato (optional)</li>
              <li><code>language</code> - Response language: <code>en</code> or <code>hi</code> (optional, defaults to en)</li>
            </ul>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
              <p className="text-xs text-yellow-700">
                <strong>Note:</strong> Temperature and humidity fields are no longer needed in CSV as they're 
                automatically fetched from OpenWeather API based on the location coordinates!
              </p>
            </div>
            
            <p className="mt-4"><strong>Minimal CSV Example:</strong></p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
id,latitude,longitude,soil_ph,nitrogen,phosphorus,potassium,crop_type{'\n'}
1,28.6139,77.2090,6.5,120,45,180,wheat{'\n'}
2,19.0760,72.8777,7.2,95,38,150,rice
            </pre>
            
            <p className="mt-4"><strong>Processing Flow:</strong></p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Upload your CSV with soil nutrition data and coordinates</li>
              <li>System fetches real-time weather for each location from OpenWeather</li>
              <li>AI analyzes soil + weather data to provide comprehensive advice</li>
              <li>Download results with fetched weather data included</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAIPage;
