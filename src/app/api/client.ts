/**
 * API Client
 * Centralized HTTP client with interceptors and error handling
 * 
 * Using fetch API (native browser API) instead of axios:
 * - No additional dependency
 * - Smaller bundle size
 * - Modern browser support
 * - Built-in TypeScript support
 */

import { config } from '@/app/config/env';
import type { ApiError, ApiResponse } from '@/app/types/api';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  skipErrorHandling?: boolean;
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.apiUrl;
    this.timeout = config.apiTimeout;
  }

  /**
   * Build full URL from path
   */
  private buildUrl(path: string): string {
    // If path already includes base URL, use it as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Remove leading slash from path to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${cleanPath}`;
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ApiClientError('Request timeout', 'TIMEOUT', 408));
      }, timeoutMs);
    });
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown, status?: number): boolean {
    // Retry on network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // Retry on timeout
    if (error instanceof ApiClientError && error.code === 'TIMEOUT') {
      return true;
    }

    // Retry on specific HTTP status codes (5xx server errors, 429 rate limit)
    if (status !== undefined) {
      return status >= 500 || status === 429 || status === 408;
    }

    return false;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    // Exponential backoff: baseDelay * 2^attempt
    // Max delay: 30 seconds
    const delay = baseDelay * Math.pow(2, attempt);
    return Math.min(delay, 30000);
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: ApiError;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        code: 'UNKNOWN_ERROR',
        message: response.statusText || 'Unknown error occurred',
      };
    }

    throw new ApiClientError(
      errorData.message || 'An error occurred',
      errorData.code || 'UNKNOWN_ERROR',
      response.status,
      errorData.details
    );
  }

  /**
   * Make HTTP request with retry logic
   */
  private async requestWithRetry<T>(
    path: string,
    options: RequestOptions = {},
    retries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let lastError: unknown;
    let lastStatus: number | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request<T>(path, options);
      } catch (error) {
        lastError = error;

        // Get status from error if available
        if (error instanceof ApiClientError) {
          lastStatus = error.status;
        }

        // Don't retry on last attempt
        if (attempt === retries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error, lastStatus)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateRetryDelay(attempt, retryDelay);
        
        // Wait before retry
        await this.delay(delay);
      }
    }

    // Re-throw last error
    throw lastError;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.timeout, skipErrorHandling = false, ...fetchOptions } = options;

    const url = this.buildUrl(path);

    // Default headers
    const headers = new Headers(fetchOptions.headers);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    // Add auth token if available (for future use)
    const token = this.getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, {
          ...fetchOptions,
          headers,
        }),
        this.createTimeoutPromise(timeout),
      ]);

      // Handle non-OK responses
      if (!response.ok) {
        if (skipErrorHandling) {
          throw new ApiClientError(
            `HTTP ${response.status}`,
            'HTTP_ERROR',
            response.status
          );
        }
        return this.handleError(response);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return undefined as T;
      }

      // Parse JSON response
      const data: ApiResponse<T> | T = await response.json();

      // Handle wrapped responses
      if (typeof data === 'object' && data !== null && 'data' in data) {
        return (data as ApiResponse<T>).data;
      }

      return data as T;
    } catch (error) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiClientError(
          'Network error. Please check your connection.',
          'NETWORK_ERROR',
          0
        );
      }

      // Unknown error
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'UNKNOWN_ERROR',
        0
      );
    }
  }

  /**
   * Get authentication token
   * Retrieves token from localStorage (avoids circular dependency with store)
   * Store persists tokens to localStorage, so we can read directly
   */
  private getAuthToken(): string | null {
    try {
      const stored = localStorage.getItem('auth_tokens');
      if (!stored) return null;
      
      const tokens = JSON.parse(stored) as { accessToken?: string };
      return tokens.accessToken || null;
    } catch {
      return null;
    }
  }

  /**
   * GET request with retry
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const { retries = 3, retryDelay = 1000, ...requestOptions } = options || {};
    return this.requestWithRetry<T>(
      path,
      {
        ...requestOptions,
        method: 'GET',
      },
      retries,
      retryDelay
    );
  }

  /**
   * POST request with retry
   */
  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const { retries = 3, retryDelay = 1000, ...requestOptions } = options || {};
    return this.requestWithRetry<T>(
      path,
      {
        ...requestOptions,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      retries,
      retryDelay
    );
  }

  /**
   * PUT request with retry
   */
  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const { retries = 3, retryDelay = 1000, ...requestOptions } = options || {};
    return this.requestWithRetry<T>(
      path,
      {
        ...requestOptions,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      retries,
      retryDelay
    );
  }

  /**
   * DELETE request with retry
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const { retries = 3, retryDelay = 1000, ...requestOptions } = options || {};
    return this.requestWithRetry<T>(
      path,
      {
        ...requestOptions,
        method: 'DELETE',
      },
      retries,
      retryDelay
    );
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
