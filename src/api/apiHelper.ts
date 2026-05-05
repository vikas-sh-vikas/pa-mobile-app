import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend-nodejs-pa.vercel.app/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  isFormData?: boolean;
}

export const apiCall = async (endpoint: string, options: ApiOptions = {}) => {
  const { method = 'GET', headers = {}, body, isFormData = false } = options;

  // Build the full URL
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...headers,
  };

  // Automatically add Auth Token if available
  try {
    const token = await AsyncStorage.getItem('@ag_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('[apiHelper] Could not retrieve auth token', e);
  }

  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    let json: any = {};
    if (contentType && contentType.includes('application/json')) {
      json = await response.json();
    } else {
      // For non-JSON responses (like blob or text)
      const text = await response.text();
      try {
        json = JSON.parse(text);
      } catch {
        json = { data: text };
      }
    }

    if (!response.ok) {
      throw new Error(json.message || `API Error: ${response.status}`);
    }

    return json;
  } catch (error: any) {
    console.error(`API Call failed [${method}] ${url}:`, error);
    throw error;
  }
};

// Convenience methods
export const api = {
  get: (endpoint: string, options?: ApiOptions) => 
    apiCall(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, body?: any, options?: ApiOptions) => 
    apiCall(endpoint, { ...options, method: 'POST', body: body || {} }),
  
  put: (endpoint: string, body?: any, options?: ApiOptions) => 
    apiCall(endpoint, { ...options, method: 'PUT', body: body || {} }),
  
  delete: (endpoint: string, body?: any, options?: ApiOptions) => 
    apiCall(endpoint, { ...options, method: 'DELETE', body: body || {} }),
};
