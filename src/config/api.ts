/**
 * API Configuration for NeuroSync
 * 
 * This file centralizes all API-related configuration,
 * ensuring the correct backend URL is used based on the environment.
 */

/**
 * Get the API base URL from environment variables
 * Falls back to localhost for development if not set
 */
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Default to localhost if not set (development)
  if (!envUrl) {
    console.warn('VITE_API_URL not set, using default: http://localhost:8000');
    return 'http://localhost:8000';
  }
  
  return envUrl;
};

/**
 * Base API URL - automatically switches between dev and production
 */
export const API_URL = getApiUrl();

/**
 * All API endpoints used in the application
 */
export const API_ENDPOINTS = {
  /**
   * Audio transcription endpoint
   * POST /api/transcribe
   * Body: { audio_id: string, user_id: string, user_phone: string }
   */
  transcribe: `${API_URL}/api/transcribe`,
  
  /**
   * Health check endpoint
   * GET /
   */
  health: `${API_URL}/`,
  
  // Add more endpoints as needed
  // Example:
  // recordings: `${API_URL}/api/recordings`,
  // userProfile: `${API_URL}/api/user/profile`,
};

/**
 * Log current API configuration (development only)
 */
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    baseUrl: API_URL,
    environment: import.meta.env.MODE,
    endpoints: API_ENDPOINTS,
  });
}

/**
 * Example usage in components:
 * 
 * import { API_ENDPOINTS } from './config/api';
 * 
 * const response = await fetch(API_ENDPOINTS.transcribe, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data),
 * });
 */
