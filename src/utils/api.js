/**
 * API utility with automatic token handling and 401 error management
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Get the base URL without /api/
 */
export const getBaseUrl = () => {
  return API_BASE.replace(/\/$/, "");
};
// export const getBaseUrl = () => {
//   const url = API_BASE.replace('/api/', '');
//   // Ensure trailing slash
//   return url.endsWith('/') ? url : url + '/';
// };

/**
 * Get the access token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem("access_token");
};

/**
 * Get authorization headers with token
 */
export const getAuthHeaders = () => {
  const token = getToken();
  
  if (!token) {
    console.warn('⚠️ No authentication token found. User may not be logged in.');
    return {
      'Content-Type': 'application/json',
    };
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Make an authenticated API request
 * Automatically handles 401 errors by redirecting to login
 */
export const apiFetch = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(fullUrl, config);

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token expired or invalid');
      
      // Clear auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Optionally redirect to login
      // window.location.href = '/login';
      
      throw new Error('Unauthorized - Please log in again');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Safe API fetch that doesn't throw on 401
 * Returns null if unauthorized
 */
export const apiFetchSafe = async (url, options = {}) => {
  try {
    return await apiFetch(url, options);
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      return null;
    }
    throw error;
  }
};
