/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient } from '@/app/api/client';
import { mockAuthService, isMockMode } from '@/app/data/mockAdapter';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/app/types/api';
import type { User } from '@/app/types';

const realAuthService = {
  /**
   * Login user
   * 
   * @example
   * POST /api/auth/login
   * Body: { email: "user@example.com", password: "password123" }
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', data);
  },

  /**
   * Register new user
   * 
   * @example
   * POST /api/auth/register
   * Body: { name: "John", email: "user@example.com", password: "password123", confirmPassword: "password123" }
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/auth/register', data);
  },

  /**
   * Refresh access token
   * 
   * @example
   * POST /api/auth/refresh
   * Body: { refreshToken: "..." }
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return apiClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken } as RefreshTokenRequest);
  },

  /**
   * Logout user
   * 
   * @example
   * POST /api/auth/logout
   */
  async logout(): Promise<void> {
    return apiClient.post<void>('/auth/logout');
  },

  /**
   * Get current user
   * 
   * @example
   * GET /api/auth/me
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<{ user: User }>('/auth/me').then((response) => response.user);
  },
};

// Export service that switches between mock and real
export const authService = isMockMode() ? mockAuthService : realAuthService;
