/**
 * Environment configuration
 * Centralized configuration management
 */

import { logger } from '@/app/utils/logger';

interface AppConfig {
  apiUrl: string;
  apiTimeout: number;
  enableMockData: boolean;
  environment: 'development' | 'production' | 'test';
  /**
   * Commission percent that comes from payment gateway / backend.
   * Frontend использует это только для отображения, не для ручной настройки.
   * Значение указывается в долях (0.1 = 10%).
   */
  gatewayCommissionPercent: number;
}

/**
 * Get API base URL from environment variable
 * Falls back to relative path if not set (for same-origin requests)
 */
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  
  // Fallback to relative path for same-origin API
  return '/api';
};

/**
 * Check if mock data should be used (DEMO MODE)
 * 
 * DEMO MODE is enabled by default in development to allow frontend development
 * without backend. This makes it easy to develop and test the frontend independently.
 * 
 * To disable demo mode and use real API:
 * 1. Set VITE_USE_MOCK_DATA=false in .env file
 * 2. Or set VITE_API_URL to your backend URL
 * 
 * In production, demo mode is ALWAYS disabled for security.
 */
const shouldUseMockData = (): boolean => {
  // In production, NEVER use mock data (security)
  if (import.meta.env.PROD) {
    return false;
  }
  
  // In development, DEMO MODE is enabled by default
  // This allows frontend development without backend
  const envValue = import.meta.env.VITE_USE_MOCK_DATA;
  
  // Explicitly disable if set to 'false'
  if (envValue === 'false') {
    return false;
  }
  
  // If explicitly set to 'true', always use mock
  if (envValue === 'true') {
    return true;
  }
  
  // If API URL is explicitly set and mock not explicitly enabled,
  // assume real API is available
  if (import.meta.env.VITE_API_URL && envValue !== 'true') {
    return false;
  }
  
  // Default: enable demo mode in development (when no API URL is set)
  // This allows frontend development without backend
  return true;
};

export const config: AppConfig = {
  apiUrl: getApiUrl(),
  apiTimeout: 30000, // 30 seconds
  enableMockData: shouldUseMockData(),
  environment: (import.meta.env.MODE as AppConfig['environment']) || 'development',
  gatewayCommissionPercent: 0.1,
};

/**
 * Validate configuration on app startup
 */
export const validateConfig = (): void => {
  if (!config.apiUrl) {
    logger.warn('API URL is not set. Using relative path.');
  }
  
  if (config.enableMockData && config.environment === 'production') {
    logger.error('Mock data is enabled in production! This should not happen.');
  }
  
  // Log demo mode status in development
  if (config.environment === 'development') {
    if (config.enableMockData) {
      logger.info('🎭 DEMO MODE: Using mock data. Set VITE_USE_MOCK_DATA=false to use real API.');
    } else {
      logger.info('🔌 API MODE: Using real API. Make sure VITE_API_URL is set correctly.');
    }
  }
};

// Validate on import
validateConfig();
