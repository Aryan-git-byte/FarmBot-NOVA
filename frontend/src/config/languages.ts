export type TranslationKey = 
  | 'welcome'
  | 'signIn'
  | 'signUp'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'signInButton'
  | 'signUpButton'
  | 'signingIn'
  | 'creatingAccount'
  | 'createAccount'
  | 'dontHaveAccount'
  | 'signUpHere'
  | 'dashboard'
  | 'manualEntry'
  | 'help'
  | 'settings'
  | 'farmStatus'
  | 'todayStatus'
  | 'lastChecked'
  | 'goodConditions'
  | 'needsAttention'
  | 'urgentAction'
  | 'refresh'
  | 'loading'
  | 'today'
  | 'yesterday'
  | 'comparisonYesterday'
  | 'location'
  | 'improving'
  | 'declining'
  | 'stable'
  | 'optimal'
  | 'warning'
  | 'critical'
  | 'helpTitle'
  | 'helpGreen'
  | 'helpYellow'
  | 'helpRed'
  | 'addNewData'
  | 'selectDataType'
  | 'waterQuality'
  | 'fertilizer'
  | 'weather'
  | 'custom'
  | 'success'
  | 'save'
  | 'notes'
  | 'account'
  | 'language'
  | 'theme'
  | 'lightMode'
  | 'darkMode'
  | 'signOut'
  | 'selectLanguage'
  | 'settingsSaved'
  | 'dateFormat'
  | 'timezone'
  | 'currentLocation'
  | 'getLocation'
  | 'searchLocation'
  | 'soilMoisture'
  | 'soilHealth'
  | 'temperature'
  | 'humidity'
  | 'irrigationAdvice'
  | 'currentWeather'
  | 'weatherForecast'
  | 'soilData'
  | 'soilType'
  | 'soilPh'
  | 'sandContent'
  | 'clayContent'
  | 'cropSuggestions'
  | 'windSpeed'
  | 'visibility'
  | 'dataManagement'
  | 'insertMockData'
  | 'error'
  | 'retry'
  | 'latitude'
  | 'longitude'
  // New translation keys for previously hardcoded English strings
  | 'understandingColors'
  | 'everythingGood'
  | 'everythingGoodDesc'
  | 'checkSoon'
  | 'checkSoonDesc'
  | 'takeActionNow'
  | 'takeActionNowDesc'
  | 'usingOnMobile'
  | 'tapRefreshButton'
  | 'usePlusButton'
  | 'swipeLeftRight'
  | 'internetConnection'
  | 'worksSlowInternet'
  | 'dataSavedAutomatically'
  | 'addDataOffline'
  | 'commonQuestions'
  | 'howOftenCheck'
  | 'howOftenCheckAnswer'
  | 'whatRedStatus'
  | 'whatRedStatusAnswer'
  | 'useWithoutSensors'
  | 'useWithoutSensorsAnswer'
  | 'signInToMonitor'
  | 'createFarmAccount'
  | 'simpleFarmMonitoring'
  | 'simpleFarmMonitoringDesc'
  | 'whatDidYouObserve'
  | 'howDoesItLook'
  | 'saving'
  | 'entryType'
  | 'customEntry'
  | 'waterQualityEntry'
  | 'fertilizerApplication'
  | 'weatherObservation'
  | 'title'
  | 'description'
  | 'optionalDescription'
  | 'saveEntry'
  | 'cancel'
  | 'entrySaved'
  | 'entrySavedDesc'
  | 'errorSavingEntry'
  | 'titleRequired'
  | 'locationRequired'
  | 'viewEntries'
  | 'newEntry'
  | 'recordObservations'
  | 'viewManageEntries'
  | 'filterByType'
  | 'allTypes'
  | 'noEntriesFound'
  | 'noEntriesDesc'
  | 'noEntriesForType'
  | 'searchResults'
  | 'popularFarmingAreas'
  | 'savedLocations'
  | 'setCurrent'
  | 'locationSaved'
  | 'mockDataIncludes'
  | 'sevenDaysSensorData'
  | 'currentWeatherInfo'
  | 'soilAnalysisData'
  | 'locationInfo'
  | 'agriculturalAdvice'
  | 'insertingData'
  | 'sensorDataDesc'
  | 'weatherDataDesc'
  | 'soilAnalysisDesc'
  | 'agriculturalAdviceDesc'
  | 'dangerZone'
  | 'clearAllDataDesc'
  | 'clearAllData'
  | 'usageInstructions'
  | 'afterInsertingData'
  | 'dataForTesting'
  | 'realSensorData'
  // Educational Videos
  | 'educationalVideos'
  | 'learnAboutFarming'
  | 'selectTopic'
  | 'allTopics'
  | 'noVideosAvailable'
  | 'noVideosDesc'
  | 'watchVideo'
  | 'videoDuration'
  | 'topicPhLevels'
  | 'topicSoilMoisture'
  | 'topicFertilizer'
  | 'topicWeather'
  | 'topicSoilHealth'
  | 'topicWaterQuality'
  | 'topicCropManagement'
  | 'topicPestControl'
  | 'topicIrrigation'
  | 'topicGeneral'
  | 'closeVideo'
  | 'helpfulResources'
  | 'aiAssistant';

export const DEFAULT_LANGUAGE = 'hi';

export const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'en', name: 'English', nativeName: 'English' }
];

export const translations = {
  hi: {
    welcome: 'स्वागत है',
    signIn: 'साइन इन',
    signUp: 'साइन अप',
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    signInButton: 'साइन इन करें',
    signUpButton: 'साइन अप करें',
    signingIn: 'साइन इन हो रहे हैं...',
    creatingAccount: 'खाता बनाया जा रहा है...',
    createAccount: 'खाता बनाएं',
    dontHaveAccount: 'खाता नहीं है?',
    signUpHere: 'यहाँ साइन अप करें',
    dashboard: 'डैशबोर्ड',
    manualEntry: 'सीखें',
    help: 'सहायता',
    settings: 'सेटिंग्स',
    farmStatus: 'खेत की स्थिति',
    todayStatus: 'आज की स्थिति',
    lastChecked: 'अंतिम जांच',
    goodConditions: 'अच्छी स्थिति',
    needsAttention: 'ध्यान चाहिए',
    urgentAction: 'तुरंत कार्रवाई',
    refresh: 'रिफ्रेश',
    loading: 'लोड हो रहा है',
    today: 'आज',
    yesterday: 'कल',
    comparisonYesterday: 'की तुलना में',
    location: 'स्थान',
    improving: 'सुधार हो रहा है',
    declining: 'खराब हो रहा है',
    stable: 'स्थिर',
    optimal: 'अच्छा',
    warning: 'सावधान',
    critical: 'खतरनाक',
    helpTitle: 'सहायता',
    helpGreen: 'हरा - सब कुछ ठीक है',
    helpYellow: 'पीला - जल्दी देखें',
    helpRed: 'लाल - तुरंत कार्रवाई करें',
    addNewData: 'नया डेटा जोड़ें',
    selectDataType: 'डेटा प्रकार चुनें',
    waterQuality: 'पानी की गुणवत्ता',
    fertilizer: 'खाद',
    weather: 'मौसम',
    custom: 'कस्टम',
    success: 'सफल',
    save: 'सेव करें',
    notes: 'नोट्स',
    account: 'खाता',
    language: 'भाषा',
    theme: 'थीम',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    signOut: 'साइन आउट',
    selectLanguage: 'भाषा चुनें',
    settingsSaved: 'सेटिंग्स सेव हो गईं',
    dateFormat: 'दिनांक प्रारूप',
    timezone: 'समय क्षेत्र',
    currentLocation: 'वर्तमान स्थान',
    getLocation: 'स्थान प्राप्त करें',
    searchLocation: 'स्थान खोजें',
  soilMoisture: 'मिट्टी की नमी',
  soilHealth: 'pH',
  temperature: 'तापमान',
  humidity: 'नमी',
    irrigationAdvice: 'सिंचाई सलाह',
    currentWeather: 'वर्तमान मौसम',
    weatherForecast: 'मौसम पूर्वानुमान',
    soilData: 'मिट्टी डेटा',
    soilType: 'मिट्टी का प्रकार',
    soilPh: 'मिट्टी pH',
    sandContent: 'रेत सामग्री',
    clayContent: 'मिट्टी सामग्री',
    cropSuggestions: 'फसल सुझाव',
    windSpeed: 'हवा की गति',
    visibility: 'दृश्यता',
    dataManagement: 'डेटा प्रबंधन',
    insertMockData: 'नमूना डेटा डालें',
    error: 'त्रुटि',
    retry: 'फिर कोशिश करें',
    latitude: 'अक्षांश',
    longitude: 'देशांतर',
    // New translations for previously hardcoded English strings
    understandingColors: 'रंगों को समझना',
    everythingGood: 'सब कुछ ठीक है',
    everythingGoodDesc: 'आपकी फसलें स्वस्थ हैं। अपनी वर्तमान देखभाल जारी रखें।',
    checkSoon: 'जल्दी जांचें',
    checkSoonDesc: 'अगले दिन या दो में कुछ ध्यान देने की जरूरत है।',
    takeActionNow: 'अभी कार्रवाई करें',
    takeActionNowDesc: 'इसे तुरंत ध्यान देने की जरूरत है।',
    usingOnMobile: 'मोबाइल पर उपयोग',
    tapRefreshButton: 'नवीनतम अपडेट पाने के लिए रिफ्रेश बटन दबाएं',
    usePlusButton: 'अपने अवलोकन जोड़ने के लिए + बटन का उपयोग करें',
    swipeLeftRight: 'विभिन्न अनुभाग देखने के लिए बाएं और दाएं स्वाइप करें',
    internetConnection: 'इंटरनेट कनेक्शन',
    worksSlowInternet: 'धीमे इंटरनेट कनेक्शन के साथ काम करता है',
    dataSavedAutomatically: 'डेटा स्वचालित रूप से सेव होता है',
    addDataOffline: 'आप ऑफलाइन भी डेटा जोड़ सकते हैं (ऑनलाइन होने पर सेव होता है)',
    commonQuestions: 'सामान्य प्रश्न',
    howOftenCheck: 'कितनी बार स्थिति जांचनी चाहिए?',
    howOftenCheckAnswer: 'दिन में एक या दो बार जांचें। सिस्टम स्वचालित रूप से अपडेट होता है, इसलिए आपको हमेशा नवीनतम जानकारी मिलेगी।',
    whatRedStatus: 'लाल (गंभीर) स्थिति देखने पर क्या करना चाहिए?',
    whatRedStatusAnswer: 'लाल का मतलब तुरंत कार्रवाई की जरूरत है। अपनी फसलों, पानी के स्तर या मिट्टी की स्थिति तुरंत जांचें।',
    useWithoutSensors: 'क्या मैं इसे सेंसर के बिना उपयोग कर सकता हूं?',
    useWithoutSensorsAnswer: 'हां! आप "डेटा जोड़ें" अनुभाग का उपयोग करके मैन्युअल रूप से अपने अवलोकन जोड़ सकते हैं। जो कुछ आप देखते हैं उसे रिकॉर्ड करें और सिस्टम इसे ट्रैक करेगा।',
    signInToMonitor: 'अपने खेत की निगरानी के लिए साइन इन करें',
    createFarmAccount: 'अपना खेत निगरानी खाता बनाएं',
    simpleFarmMonitoring: 'सरल खेत निगरानी',
    simpleFarmMonitoringDesc: 'किसानों के लिए डिज़ाइन किए गए आसान-समझने वाले रंगों और सरल नियंत्रणों के साथ अपनी फसलों की निगरानी करें।',
    whatDidYouObserve: 'आपने क्या देखा?',
    howDoesItLook: 'यह कैसा दिखता है?',
    saving: 'सेव हो रहा है...',
    entryType: 'प्रविष्टि प्रकार',
    customEntry: 'कस्टम प्रविष्टि',
    waterQualityEntry: 'पानी की गुणवत्ता',
    fertilizerApplication: 'खाद का प्रयोग',
    weatherObservation: 'मौसम अवलोकन',
    title: 'शीर्षक',
    description: 'विवरण',
    optionalDescription: 'वैकल्पिक विवरण या नोट्स',
    saveEntry: 'प्रविष्टि सेव करें',
    cancel: 'रद्द करें',
    entrySaved: 'प्रविष्टि सेव हो गई!',
    entrySavedDesc: 'आपकी मैन्युअल प्रविष्टि रिकॉर्ड और सेव हो गई है।',
    errorSavingEntry: 'प्रविष्टि सेव करने में त्रुटि',
    titleRequired: 'शीर्षक आवश्यक है',
    locationRequired: 'स्थान आवश्यक है',
    viewEntries: 'प्रविष्टियां देखें',
    newEntry: 'नई प्रविष्टि',
    recordObservations: 'नए अवलोकन और माप रिकॉर्ड करें',
    viewManageEntries: 'अपनी मैन्युअल प्रविष्टियों को देखें और प्रबंधित करें',
    filterByType: 'प्रकार के अनुसार फ़िल्टर करें:',
    allTypes: 'सभी प्रकार',
    noEntriesFound: 'कोई प्रविष्टि नहीं मिली',
    noEntriesDesc: 'अभी तक कोई मैन्युअल प्रविष्टि रिकॉर्ड नहीं की गई है।',
    noEntriesForType: 'प्रविष्टियां नहीं मिलीं।',
    searchResults: 'खोज परिणाम',
    popularFarmingAreas: 'लोकप्रिय कृषि क्षेत्र',
    savedLocations: 'सेव किए गए स्थान',
    setCurrent: 'वर्तमान सेट करें',
    locationSaved: 'स्थान सेव हो गया',
    mockDataIncludes: 'नमूना डेटा में शामिल है:',
    sevenDaysSensorData: '7 दिनों का सेंसर डेटा (मिट्टी की नमी, pH, तापमान, आदि)',
    currentWeatherInfo: 'वर्तमान मौसम की जानकारी',
    soilAnalysisData: 'मिट्टी विश्लेषण डेटा (रेत, मिट्टी, गाद सामग्री)',
    locationInfo: 'स्थान की जानकारी (दिल्ली, भारत)',
    agriculturalAdvice: 'कृषि सलाह और सुझाव',
    insertingData: 'डेटा डाला जा रहा है...',
  sensorDataDesc: 'मिट्टी की नमी, pH, तापमान, नाइट्रोजन, फास्फोरस, और पोटेशियम के स्तर के साथ यथार्थवादी रीडिंग।',
    weatherDataDesc: 'तापमान, आर्द्रता, हवा की गति, और बारिश की जानकारी के साथ वर्तमान मौसम की स्थिति।',
    soilAnalysisDesc: 'मिट्टी के प्रकार, pH स्तर, जैविक कार्बन, और रेत/मिट्टी/गाद की संरचना का विस्तृत विश्लेषण।',
    agriculturalAdviceDesc: 'सिंचाई, उर्वरक, कीट नियंत्रण, और फसल प्रबंधन के लिए स्वचालित सुझाव।',
    dangerZone: 'खतरनाक क्षेत्र',
    clearAllDataDesc: 'सभी डेटा साफ करने से सेंसर रीडिंग, मौसम की जानकारी, और सभी सहेजे गए डेटा हट जाएंगे।',
    clearAllData: 'सभी डेटा साफ करें',
    usageInstructions: 'उपयोग निर्देश',
    afterInsertingData: 'नमूना डेटा डालने के बाद डैशबोर्ड पर जाकर परिणाम देखें',
    dataForTesting: 'यह डेटा केवल परीक्षण और प्रदर्शन के लिए है',
    realSensorData: 'वास्तविक सेंसर कनेक्ट करने पर यह डेटा बदल जाएगा',
    aiAssistant: 'AI सहायक',
    // Educational Videos
    educationalVideos: 'शिक्षा वीडियो',
    learnAboutFarming: 'खेती के बारे में सीखें',
    selectTopic: 'विषय चुनें',
    allTopics: 'सभी विषय',
    noVideosAvailable: 'कोई वीडियो उपलब्ध नहीं',
    noVideosDesc: 'इस विषय के लिए अभी तक कोई वीडियो उपलब्ध नहीं है।',
    watchVideo: 'वीडियो देखें',
    videoDuration: 'अवधि',
    topicPhLevels: 'pH स्तर',
    topicSoilMoisture: 'मिट्टी की नमी',
    topicFertilizer: 'उर्वरक',
    topicWeather: 'मौसम',
    topicSoilHealth: 'मिट्टी का स्वास्थ्य',
    topicWaterQuality: 'पानी की गुणवत्ता',
    topicCropManagement: 'फसल प्रबंधन',
    topicPestControl: 'कीट नियंत्रण',
    topicIrrigation: 'सिंचाई',
    topicGeneral: 'सामान्य',
    closeVideo: 'बंद करें',
    helpfulResources: 'उपयोगी संसाधन'
  },
  en: {
    welcome: 'Welcome',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    signInButton: 'Sign In',
    signUpButton: 'Sign Up',
    signingIn: 'Signing in...',
    creatingAccount: 'Creating account...',
    createAccount: 'Create Account',
    dontHaveAccount: "Don't have an account?",
    signUpHere: 'Sign up here',
    dashboard: 'Dashboard',
    manualEntry: 'Learn',
    help: 'Help',
    settings: 'Settings',
    farmStatus: 'Farm Status',
    todayStatus: "Today's Status",
    lastChecked: 'Last checked',
    goodConditions: 'Good Conditions',
    needsAttention: 'Needs Attention',
    urgentAction: 'Urgent Action',
    refresh: 'Refresh',
    loading: 'Loading',
    today: 'Today',
    yesterday: 'Yesterday',
    comparisonYesterday: 'compared to yesterday',
    location: 'Location',
    improving: 'Improving',
    declining: 'Declining',
    stable: 'Stable',
    optimal: 'Good',
    warning: 'Warning',
    critical: 'Critical',
    helpTitle: 'Help',
    helpGreen: 'Green - Everything is good',
    helpYellow: 'Yellow - Check soon',
    helpRed: 'Red - Take action now',
    addNewData: 'Add New Data',
    selectDataType: 'Select Data Type',
    waterQuality: 'Water Quality',
    fertilizer: 'Fertilizer',
    weather: 'Weather',
    custom: 'Custom',
    success: 'Success',
    save: 'Save',
    notes: 'Notes',
    account: 'Account',
    language: 'Language',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    signOut: 'Sign Out',
    selectLanguage: 'Select Language',
    settingsSaved: 'Settings saved',
    dateFormat: 'Date Format',
    timezone: 'Timezone',
    currentLocation: 'Current Location',
    getLocation: 'Get Location',
    searchLocation: 'Search Location',
  soilMoisture: 'Soil Moisture',
  soilHealth: 'pH',
  temperature: 'Temperature',
  humidity: 'Humidity',
    irrigationAdvice: 'Irrigation Advice',
    currentWeather: 'Current Weather',
    weatherForecast: 'Weather Forecast',
    soilData: 'Soil Data',
    soilType: 'Soil Type',
    soilPh: 'Soil pH',
    sandContent: 'Sand Content',
    clayContent: 'Clay Content',
    cropSuggestions: 'Crop Suggestions',
    windSpeed: 'Wind Speed',
    visibility: 'Visibility',
    dataManagement: 'Data Management',
    insertMockData: 'Insert Mock Data',
    error: 'Error',
    retry: 'Retry',
    latitude: 'Latitude',
    longitude: 'Longitude',
    // New translations for previously hardcoded English strings
    understandingColors: 'Understanding the Colors',
    everythingGood: 'Everything is Good',
    everythingGoodDesc: 'Your crops are healthy. Continue your current care routine.',
    checkSoon: 'Check Soon',
    checkSoonDesc: 'Something needs attention in the next day or two.',
    takeActionNow: 'Take Action Now',
    takeActionNowDesc: 'This needs immediate attention to protect your crops.',
    usingOnMobile: 'Using on Mobile',
    tapRefreshButton: 'Tap the refresh button to get latest updates',
    usePlusButton: 'Use the + button to add your observations',
    swipeLeftRight: 'Swipe left and right to see different sections',
    internetConnection: 'Internet Connection',
    worksSlowInternet: 'Works with slow internet connections',
    dataSavedAutomatically: 'Data is saved automatically',
    addDataOffline: 'You can add data even offline (saves when online)',
    commonQuestions: 'Common Questions',
    howOftenCheck: 'How often should I check the status?',
    howOftenCheckAnswer: 'Check once or twice a day. The system updates automatically, so you\'ll always see the latest information.',
    whatRedStatus: 'What should I do when I see red (critical) status?',
    whatRedStatusAnswer: 'Red means immediate action is needed. Check your crops, water levels, or soil conditions right away.',
    useWithoutSensors: 'Can I use this without sensors?',
    useWithoutSensorsAnswer: 'Yes! You can manually add your observations using the "Add Data" section. Record what you see and the system will track it.',
    signInToMonitor: 'Sign in to monitor your farm',
    createFarmAccount: 'Create your farm monitoring account',
    simpleFarmMonitoring: 'Simple Farm Monitoring',
    simpleFarmMonitoringDesc: 'Monitor your crops with easy-to-understand colors and simple controls designed for farmers.',
    whatDidYouObserve: 'What did you observe?',
    howDoesItLook: 'How does it look?',
    saving: 'Saving...',
    entryType: 'Entry Type',
    customEntry: 'Custom Entry',
    waterQualityEntry: 'Water Quality',
    fertilizerApplication: 'Fertilizer Application',
    weatherObservation: 'Weather Observation',
    title: 'Title',
    description: 'Description',
    optionalDescription: 'Optional description or notes',
    saveEntry: 'Save Entry',
    cancel: 'Cancel',
    entrySaved: 'Entry saved successfully!',
    entrySavedDesc: 'Your manual entry has been recorded and saved.',
    errorSavingEntry: 'Error saving entry',
    titleRequired: 'Title is required',
    locationRequired: 'Location is required',
    viewEntries: 'View Entries',
    newEntry: 'New Entry',
    recordObservations: 'Record new observations and measurements',
    viewManageEntries: 'View and manage your manual entries',
    filterByType: 'Filter by type:',
    allTypes: 'All Types',
    noEntriesFound: 'No entries found',
    noEntriesDesc: 'No manual entries have been recorded yet.',
    noEntriesForType: 'entries found.',
    searchResults: 'Search Results',
    popularFarmingAreas: 'Popular Farming Areas',
    savedLocations: 'Saved Locations',
    setCurrent: 'Set Current',
    locationSaved: 'Location saved',
    mockDataIncludes: 'Mock data includes:',
    sevenDaysSensorData: '7 days of sensor data (soil moisture, pH, temperature, etc.)',
    currentWeatherInfo: 'Current weather information',
    soilAnalysisData: 'Soil analysis data (sand, clay, silt content)',
    locationInfo: 'Location information (Delhi, India)',
    agriculturalAdvice: 'Agricultural advice and recommendations',
    insertingData: 'Inserting data...',
    sensorDataDesc: 'Realistic readings with soil moisture, pH, temperature, nitrogen, phosphorus, and potassium levels.',
    weatherDataDesc: 'Current weather conditions with temperature, humidity, wind speed, and rainfall information.',
    soilAnalysisDesc: 'Detailed analysis of soil type, pH levels, organic carbon, and sand/clay/silt composition.',
    agriculturalAdviceDesc: 'Automated recommendations for irrigation, fertilizer, pest control, and crop management.',
    dangerZone: 'Danger Zone',
    clearAllDataDesc: 'Clearing all data will remove sensor readings, weather information, and all saved data.',
    clearAllData: 'Clear All Data',
    usageInstructions: 'Usage Instructions',
    afterInsertingData: 'After inserting mock data, go to the dashboard to see results',
    dataForTesting: 'This data is for testing and demonstration purposes only',
    realSensorData: 'Real sensor data will replace this when sensors are connected',
    aiAssistant: 'AI Assistant',
    // Educational Videos
    educationalVideos: 'Educational Videos',
    learnAboutFarming: 'Learn About Farming',
    selectTopic: 'Select a Topic',
    allTopics: 'All Topics',
    noVideosAvailable: 'No videos available',
    noVideosDesc: 'No videos are available for this topic yet.',
    watchVideo: 'Watch Video',
    videoDuration: 'Duration',
    topicPhLevels: 'pH Levels',
    topicSoilMoisture: 'Soil Moisture',
    topicFertilizer: 'Fertilizer',
    topicWeather: 'Weather',
    topicSoilHealth: 'Soil Health',
    topicWaterQuality: 'Water Quality',
    topicCropManagement: 'Crop Management',
    topicPestControl: 'Pest Control',
    topicIrrigation: 'Irrigation',
    topicGeneral: 'General',
    closeVideo: 'Close',
    helpfulResources: 'Helpful Resources'
  }
};