/**
 * API Client for Identity Shield Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface ApiError {
  code?: string;
  message: string;
  field?: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError | Record<string, string[]>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeader(): HeadersInit {
    if (typeof window === 'undefined') return {};
    
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const error = await response.json();
        return { error };
      }
      return {
        error: {
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
      };
    }

    if (isJson) {
      const data = await response.json();
      return { data };
    }

    return { data: {} as T };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  async post<T>(endpoint: string, data?: unknown, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    try {
      // Build headers conditionally - don't set Content-Type for FormData
      const headers: Record<string, string> = {
        ...this.getAuthHeader(),
      };
      
      // Only add Content-Type if not FormData (browser will set it automatically for FormData)
      if (!(data instanceof FormData)) {
        headers['Content-Type'] = options?.headers?.['Content-Type'] || 'application/json';
      }
      
      // Add any other custom headers
      if (options?.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (key !== 'Content-Type') {
            headers[key] = value;
          }
        });
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  async patch<T>(endpoint: string, data?: unknown, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeader(),
          ...(options?.headers || { 'Content-Type': 'application/json' }),
        },
        body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiError, ApiResponse };
