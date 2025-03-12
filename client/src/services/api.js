// client/src/services/api.js

/**
 * API Service
 * Handles all HTTP requests to the backend API
 */

// API base URL - set in environment variables or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Request option defaults
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies for session-based auth
};

// Custom API error class
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Helper function to handle API responses consistently
const handleResponse = async (response) => {
  // Log all API responses for debugging
  console.log(`API ${response.status} ${response.statusText}: ${response.url}`);
  
  // For non-success status codes, throw an error
  if (!response.ok) {
    let errorData = {};
    let errorMessage = `HTTP error: ${response.status} ${response.statusText}`;
    
    try {
      // Try to parse error response as JSON
      errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // If parsing fails, use the status text
      console.warn('Error response was not JSON:', e);
    }
    
    throw new ApiError(errorMessage, response.status, errorData);
  }
  
  // Handle different response types
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else if (contentType && contentType.includes('text/')) {
    return response.text();
  } else if (response.status === 204) {
    // No content responses
    return null;
  }
  
  // Default to JSON parsing (most common case)
  try {
    return await response.json();
  } catch (e) {
    // If JSON parsing fails, return the raw response
    console.warn('Response is not JSON:', e);
    return response;
  }
};

// Main API service object
const api = {
  /**
   * Performs a GET request to the API
   * @param {string} endpoint - API endpoint path (without leading slash)
   * @returns {Promise} Promise with the response data
   */
  get: async (endpoint) => {
    try {
      console.log(`API GET: ${API_BASE_URL}/${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        ...defaultOptions,
        method: 'GET',
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`API GET Error for ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Performs a POST request to the API
   * @param {string} endpoint - API endpoint path (without leading slash)
   * @param {Object} data - Request body data (will be JSON-stringified)
   * @returns {Promise} Promise with the response data
   */
  post: async (endpoint, data) => {
    try {
      console.log(`API POST: ${API_BASE_URL}/${endpoint}`, data);
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`API POST Error for ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Performs a PUT request to the API
   * @param {string} endpoint - API endpoint path (without leading slash)
   * @param {Object} data - Request body data (will be JSON-stringified)
   * @returns {Promise} Promise with the response data
   */
  put: async (endpoint, data) => {
    try {
      console.log(`API PUT: ${API_BASE_URL}/${endpoint}`, data);
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        ...defaultOptions,
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`API PUT Error for ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Performs a PATCH request to the API
   * @param {string} endpoint - API endpoint path (without leading slash)
   * @param {Object} data - Request body data (will be JSON-stringified)
   * @returns {Promise} Promise with the response data
   */
  patch: async (endpoint, data) => {
    try {
      console.log(`API PATCH: ${API_BASE_URL}/${endpoint}`, data);
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        ...defaultOptions,
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`API PATCH Error for ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Performs a DELETE request to the API
   * @param {string} endpoint - API endpoint path (without leading slash)
   * @returns {Promise} Promise with the response data
   */
  delete: async (endpoint) => {
    try {
      console.log(`API DELETE: ${API_BASE_URL}/${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        ...defaultOptions,
        method: 'DELETE',
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`API DELETE Error for ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Upload a file to the API
   * @param {string} endpoint - API endpoint path
   * @param {FormData} formData - FormData object with file and other data
   * @returns {Promise} Promise with response data
   */
  uploadFile: async (endpoint, formData) => {
    try {
      console.log(`API File Upload: ${API_BASE_URL}/${endpoint}`);
      
      // Don't include Content-Type header - browser will set it with boundary
      const options = {
        ...defaultOptions,
        headers: {}, // Let browser set the Content-Type with proper boundary
        method: 'POST',
        body: formData,
      };
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
      return handleResponse(response);
    } catch (error) {
      console.error(`API File Upload Error for ${endpoint}:`, error);
      throw error;
    }
  },
};

export default api;