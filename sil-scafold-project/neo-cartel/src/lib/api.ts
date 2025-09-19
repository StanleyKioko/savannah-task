import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const API_BASE_URL = 'http://localhost:8000/api';
const GRAPHQL_ENDPOINT = 'http://localhost:8000/api/graphql/';

const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('access_token');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    }
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Product: {
        fields: {
          reviews: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
      User: {
        fields: {
          orders: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

// REST API Helper Functions
class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Check if this is a public endpoint that doesn't require authentication
    const publicEndpoints = ['/products/', '/categories/', '/orders/'];
    const isPublicEndpoint = publicEndpoints.some(publicEndpoint => endpoint.startsWith(publicEndpoint));
    
    // Only add token for non-public endpoints or if explicitly requested
    const token = !isPublicEndpoint ? localStorage.getItem('access_token') : null;
    
    // If we're sending FormData, let the browser set the Content-Type with the boundary
    const isFormData = options.body instanceof FormData;
    
    const config: RequestInit = {
      headers: {
        // Only set default Content-Type if not FormData
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        // Only add Authorization header if we have a token and it's not a public endpoint
        ...(token && !isPublicEndpoint && { Authorization: `Bearer ${token}` }),
        ...customHeaders,
        // Remove any headers coming from options that would conflict with FormData
        ...(!isFormData && options.headers),
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // For public endpoints (products, categories), don't try token refresh or redirect
          if (isPublicEndpoint) {
            console.warn('Authentication failed for public endpoint - continuing without auth');
            // For public endpoints, we'll try to return the response anyway in case it has useful error info
          } else {
            // For private endpoints, try to refresh the token if possible
            try {
              const refreshToken = localStorage.getItem('refresh_token');
              if (refreshToken) {
                const refreshResponse = await keycloakConfig.refreshToken(refreshToken);
                // Store the new tokens
                localStorage.setItem('access_token', refreshResponse.access_token);
                if (refreshResponse.refresh_token) {
                  localStorage.setItem('refresh_token', refreshResponse.refresh_token);
                }
                
                // Retry the original request with the new token
                const retryConfig: RequestInit = {
                  ...config,
                  headers: {
                    ...config.headers,
                    Authorization: `Bearer ${refreshResponse.access_token}`,
                  },
                };
                
                const retryResponse = await fetch(url, retryConfig);
                if (retryResponse.ok) {
                  const contentType = retryResponse.headers.get('content-type');
                  if (contentType && contentType.includes('application/json')) {
                    return await retryResponse.json();
                  }
                  return retryResponse as unknown as T;
                }
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
            
            // If refresh failed or there was no refresh token, clear auth and redirect
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('debug_access_token');
            localStorage.removeItem('debug_refresh_token');
            window.location.href = '/login';
          }
        }
        
        // Try to get error details from response body if it's JSON
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
        
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response as unknown as T;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<T> {
    const isFormData = data instanceof FormData;
    
    return this.request<T>(
      endpoint, 
      {
        method: 'POST',
        body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      },
      // For FormData, do NOT set Content-Type header - let the browser handle it
      isFormData ? {} : customHeaders
    );
  }

  // Upload file - special method for handling FormData
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        // Let browser set content type with appropriate boundary
        'Content-Type': undefined,
      },
      body: formData,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient(API_BASE_URL);

// Authentication API endpoints
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login/', credentials),
  
  logout: () => apiClient.post('/auth/logout/'),
  
  refresh: () => apiClient.post('/auth/refresh/'),
  
  register: (userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => apiClient.post('/auth/register/', userData),
  
  profile: () => apiClient.get('/auth/user/'),
  
  updateProfile: (data: any) => apiClient.patch('/auth/user/', data),
  
  changePassword: (data: {
    old_password: string;
    new_password: string;
  }) => apiClient.post('/auth/change-password/', data),
};

// OIDC/Keycloak Configuration
export const keycloakConfig = {
  url: 'http://localhost:8090', 
  realm: 'sil',
  clientId: 'sil-api',
  clientSecret: 'h2n5RazEBIzMUERh8OJuEDNFgkBZO73v', // Updated to match Keycloak's generated secret
  redirectUri: 'http://localhost:8085/auth/callback',
  
  // Build authorization URL
  getAuthUrl: (state?: string) => {
    const params = new URLSearchParams({
      client_id: keycloakConfig.clientId,
      redirect_uri: keycloakConfig.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: state || Math.random().toString(36).substring(7), // Use provided state or generate one
    });
    
    return `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth?${params}`;
  },
  
  // Exchange code for token - using proxy to avoid CORS issues
  exchangeCode: async (code: string, state: string): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    id_token?: string;
    scope?: string;
  }> => {
    try {
      console.log('Exchanging code for token:', { code, state });
      
      // Since direct Keycloak token endpoint calls will fail due to CORS,
      // we'll use a workaround for development - simulating the response
      // In production, you'd use a server-side proxy endpoint
      
      // For debugging - log the params we would send
      const params = {
        grant_type: 'authorization_code',
        client_id: keycloakConfig.clientId,
        client_secret: keycloakConfig.clientSecret,
        code,
        redirect_uri: keycloakConfig.redirectUri,
      };
      console.log('Token exchange params:', params);

      // Local workaround for development - check local storage for debug token
      // In a real app, you'd send the code to your backend and let it exchange for tokens
      const debugToken = localStorage.getItem('debug_access_token');
      const debugRefresh = localStorage.getItem('debug_refresh_token');

      if (debugToken) {
        console.log('Using debug tokens');
        return {
          access_token: debugToken,
          refresh_token: debugRefresh || '',
          token_type: 'Bearer',
          expires_in: 300,
        };
      }
      
      // If no debug token, simulate successful exchange
      // This is only for development to bypass CORS issues
      const dummyToken = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZfdXNlciIsIm5hbWUiOiJEZXZlbG9wbWVudCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTksInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJ1c2VyIl19LCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJkZXZfdXNlciIsImVtYWlsIjoiZGV2QGV4YW1wbGUuY29tIiwiZ2l2ZW5fbmFtZSI6IkRldmVsb3BtZW50IiwiZmFtaWx5X25hbWUiOiJVc2VyIn0.rU70-yrZAr0weK-FftRDoKDtoNFnl0S24KF9mxbSRdQ',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZfdXNlciIsImlhdCI6MTUxNjIzOTAyMn0.1akUjsvE5NZ4FfQpXLex7hHHtV_krmtM7VRjUPm8L-E',
        token_type: 'Bearer',
        expires_in: 300,
        id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZfdXNlciIsIm5hbWUiOiJEZXZlbG9wbWVudCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTksInByZWZlcnJlZF91c2VybmFtZSI6ImRldl91c2VyIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJnaXZlbl9uYW1lIjoiRGV2ZWxvcG1lbnQiLCJmYW1pbHlfbmFtZSI6IlVzZXIifQ.pOctjhNuZkNs6QuEi9xdeU4NGxp6LlXohmd7ZzG0yI8',
        scope: 'openid profile email',
      };
      
      // Store these debug tokens for reuse
      localStorage.setItem('debug_access_token', dummyToken.access_token);
      localStorage.setItem('debug_refresh_token', dummyToken.refresh_token);
      
      return dummyToken;

      /* 
      // Actual implementation to be used with server-side proxy:
      const tokenEndpoint = `/api/auth/exchange-code`; // Your backend proxy endpoint
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: keycloakConfig.redirectUri,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || 'Failed to exchange authorization code');
      }
      
      return await response.json();
      */
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  },
  
  // Refresh OIDC token
  refreshToken: async (refreshToken: string) => {
    const tokenEndpoint = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: keycloakConfig.clientId,
      client_secret: keycloakConfig.clientSecret,
      refresh_token: refreshToken,
    });
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    return await response.json();
  },
  
  // Logout from OIDC
  logout: async (refreshToken: string) => {
    try {
      // Only attempt Keycloak logout in production
      // In development, we'll skip this step to avoid CORS issues
      if (import.meta.env.PROD) {
        const logoutEndpoint = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;
        
        const params = new URLSearchParams({
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
          refresh_token: refreshToken,
        });
        
        const response = await fetch(logoutEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        });
        
        if (!response.ok) {
          console.warn('Keycloak logout request failed with status:', response.status);
        }
      } else {
        console.log('Development mode: Skipping Keycloak logout to avoid CORS issues');
      }
    } catch (error) {
      console.warn('Logout request error (safe to ignore in development):', error);
    }
  },

  // Get Keycloak registration form URL
  getRegistrationUrl: () => {
    // Try multiple approaches, as Keycloak configuration can vary
    
    // Method 1: Direct access to the registration page
    // This is the most reliable if registration is enabled in Keycloak
    return `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/registrations?client_id=${keycloakConfig.clientId}&response_type=code&scope=openid%20profile%20email&redirect_uri=${encodeURIComponent(keycloakConfig.redirectUri)}`;
    
    // Alternative methods if the above doesn't work:
    // return `${keycloakConfig.url}/realms/${keycloakConfig.realm}/login-actions/registration?client_id=${keycloakConfig.clientId}&tab_id=1`;
    // return `${keycloakConfig.url}/admin/realms/${keycloakConfig.realm}/users`;
  },
};