// Environment configuration for GaavConnect
// This file handles all environment variables and provides type-safe access

export interface AppConfig {
  // Google Maps Configuration
  googleMaps: {
    apiKey: string;
    libraries: string[];
  };
  
  // OSRM Configuration
  osrm: {
    baseUrl: string;
  };
  
  // Application Configuration
  app: {
    name: string;
    version: string;
    description: string;
  };
  
  // Feature Flags
  features: {
    analytics: boolean;
    offlineMode: boolean;
    exportFeatures: boolean;
  };
  
  // API Configuration
  api: {
    baseUrl: string;
    enableCustomApi: boolean;
  };
  
  // Development Configuration
  development: {
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  googleMaps: {
    apiKey: '',
    libraries: ['places', 'geometry', 'directions']
  },
  osrm: {
    baseUrl: 'https://router.project-osrm.org'
  },
  app: {
    name: 'GaavConnect',
    version: '1.0.0',
    description: 'AI-Powered Route Optimization Platform'
  },
  features: {
    analytics: true,
    offlineMode: true,
    exportFeatures: true
  },
  api: {
    baseUrl: 'http://localhost:3001',
    enableCustomApi: false
  },
  development: {
    debugMode: false,
    logLevel: 'info'
  }
};

// Load configuration from environment variables
function loadConfig(): AppConfig {
  return {
    googleMaps: {
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || defaultConfig.googleMaps.apiKey,
      libraries: defaultConfig.googleMaps.libraries
    },
    osrm: {
      baseUrl: import.meta.env.VITE_OSRM_BASE_URL || defaultConfig.osrm.baseUrl
    },
    app: {
      name: import.meta.env.VITE_APP_NAME || defaultConfig.app.name,
      version: import.meta.env.VITE_APP_VERSION || defaultConfig.app.version,
      description: import.meta.env.VITE_APP_DESCRIPTION || defaultConfig.app.description
    },
    features: {
      analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || defaultConfig.features.analytics,
      offlineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true' || defaultConfig.features.offlineMode,
      exportFeatures: import.meta.env.VITE_ENABLE_EXPORT_FEATURES === 'true' || defaultConfig.features.exportFeatures
    },
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || defaultConfig.api.baseUrl,
      enableCustomApi: import.meta.env.VITE_ENABLE_CUSTOM_API === 'true' || defaultConfig.api.enableCustomApi
    },
    development: {
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true' || defaultConfig.development.debugMode,
      logLevel: (import.meta.env.VITE_LOG_LEVEL as AppConfig['development']['logLevel']) || defaultConfig.development.logLevel
    }
  };
}

// Export the configuration
export const config = loadConfig();

// Validation function
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required Google Maps API key
  if (!config.googleMaps.apiKey || config.googleMaps.apiKey === 'your_google_maps_api_key_here') {
    errors.push('Google Maps API key is required. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.');
  }
  
  // Validate OSRM URL
  try {
    new URL(config.osrm.baseUrl);
  } catch {
    errors.push('Invalid OSRM base URL. Please check VITE_OSRM_BASE_URL in your .env file.');
  }
  
  // Validate API URL if custom API is enabled
  if (config.api.enableCustomApi) {
    try {
      new URL(config.api.baseUrl);
    } catch {
      errors.push('Invalid API base URL. Please check VITE_API_BASE_URL in your .env file.');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Development helpers
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

export function isProduction(): boolean {
  return import.meta.env.PROD;
}

export function log(level: AppConfig['development']['logLevel'], message: string, ...args: any[]): void {
  if (!config.development.debugMode && !isDevelopment()) {
    return;
  }
  
  const levels = ['error', 'warn', 'info', 'debug'];
  const currentLevelIndex = levels.indexOf(config.development.logLevel);
  const messageLevelIndex = levels.indexOf(level);
  
  if (messageLevelIndex <= currentLevelIndex) {
    console[level === 'debug' ? 'log' : level](`[GaavConnect:${level.toUpperCase()}]`, message, ...args);
  }
}

// Export individual config sections for convenience
export const {
  googleMaps: googleMapsConfig,
  osrm: osrmConfig,
  app: appConfig,
  features: featureFlags,
  api: apiConfig,
  development: devConfig
} = config;
