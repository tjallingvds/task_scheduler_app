// Base API service for making requests to the Flask backend

// Default options for fetch requests
const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies/sessions
  };
  
  // Function to handle API responses
  const handleResponse = async (response) => {
    // Log the response status for debugging
    console.log(`API Response: ${response.status} ${response.statusText} for ${response.url}`);
    
    if (!response.ok) {
      // Get error message from the response body
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || `HTTP error! Status: ${response.status}`;
        console.error("API Error details:", errorData);
      } catch (error) {
        // If can't parse JSON, use status text
        errorMessage = `HTTP error! Status: ${response.status} ${response.statusText}`;
        console.error("API Error (non-JSON):", errorMessage);
      }
      throw new Error(errorMessage);
    }
    
    // For successful responses, try to parse JSON
    try {
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn("API Warning: Response is not JSON", error);
      // If not JSON, return the text content
      return await response.text();
    }
  };
  
  // API service object
  const api = {
    // GET request
    get: async (endpoint) => {
      console.log(`API GET: /api/${endpoint}`);
      try {
        const response = await fetch(`/api/${endpoint}`, {
          ...defaultOptions,
          method: 'GET',
        });
        return handleResponse(response);
      } catch (error) {
        console.error(`API GET Error for ${endpoint}:`, error);
        throw error;
      }
    },
  
    // POST request
    post: async (endpoint, data) => {
      console.log(`API POST: /api/${endpoint}`, data);
      try {
        const response = await fetch(`/api/${endpoint}`, {
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
  
    // PUT request
    put: async (endpoint, data) => {
      console.log(`API PUT: /api/${endpoint}`, data);
      try {
        const response = await fetch(`/api/${endpoint}`, {
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
  
    // DELETE request
    delete: async (endpoint) => {
      console.log(`API DELETE: /api/${endpoint}`);
      try {
        const response = await fetch(`/api/${endpoint}`, {
          ...defaultOptions,
          method: 'DELETE',
        });
        return handleResponse(response);
      } catch (error) {
        console.error(`API DELETE Error for ${endpoint}:`, error);
        throw error;
      }
    },
  };
  
  export default api;