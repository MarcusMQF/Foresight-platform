/**
 * API Configuration
 * 
 * This file contains configuration settings for the backend API
 */

// Base URL for the API server
export const API_BASE_URL = 'http://localhost:8001';

// API endpoints
export const API_ENDPOINTS = {
  // Resume analysis endpoints
  ANALYZE: '/api/analyze',
  TEST_EXTRACTION: '/api/test-extraction',
  ANALYZE_BATCH: '/api/analyze-batch',
  DEFAULT_WEIGHTS: '/api/weights/default',
  JOB_DESCRIPTION: '/api/job-description',
  ANALYSIS_RESULTS: '/api/analysis-results',
  ANALYSIS_RESULT: '/api/analysis-result',
  
  // Server status
  STATUS: '/'
};

/**
 * Helper function to get the full URL for an API endpoint
 * 
 * @param endpoint The API endpoint path
 * @returns The full URL including the base URL
 */
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

/**
 * Check if the API server is available
 * 
 * @returns Promise resolving to true if the server is available, false otherwise
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.STATUS), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Short timeout to avoid hanging
      signal: AbortSignal.timeout(3000)
    });
    
    return response.ok;
  } catch (error) {
    console.error('API server is not available:', error);
    return false;
  }
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  getApiUrl,
  checkApiAvailability
}; 