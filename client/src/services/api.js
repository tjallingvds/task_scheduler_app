// Base API service for making requests to the Flask backend

// Default options for fetch requests
const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Function to handle API responses
  const handleResponse = async (response) => {
    if (!response.ok) {
      // Get error message from the response body
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
    }
    return response.json();
  };
  
  // API service object
  const api = {
    // GET request
    get: async (endpoint) => {
      const response = await fetch(`/api/${endpoint}`, {
        ...defaultOptions,
        method: 'GET',
      });
      return handleResponse(response);
    },
  
    // POST request
    post: async (endpoint, data) => {
      const response = await fetch(`/api/${endpoint}`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
  
    // PUT request
    put: async (endpoint, data) => {
      const response = await fetch(`/api/${endpoint}`, {
        ...defaultOptions,
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
  
    // DELETE request
    delete: async (endpoint) => {
      const response = await fetch(`/api/${endpoint}`, {
        ...defaultOptions,
        method: 'DELETE',
      });
      return handleResponse(response);
    },
  };
  
  export default api;