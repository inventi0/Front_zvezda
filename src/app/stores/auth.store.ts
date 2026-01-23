/**
 * Auth Store (Zustand)
 * Manages authentication state globally
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/app/services/auth.service';
import type { User, AuthTokens } from '@/app/types';
import { logger } from '@/app/utils/logger';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_STORAGE_KEY = 'auth_tokens';
const USER_STORAGE_KEY = 'auth_user';

/**
 * Secure storage for tokens
 * In production, consider using httpOnly cookies instead
 */
const secureStorage = {
  getTokens: (): AuthTokens | null => {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as AuthTokens;
    } catch {
      return null;
    }
  },
  setTokens: (tokens: AuthTokens): void => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      logger.error('Failed to store tokens', error);
    }
  },
  removeTokens: (): void => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      logger.error('Failed to remove tokens', error);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          secureStorage.setTokens(response.tokens);
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isAdmin: response.user.role === 'admin',
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка входа';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string, confirmPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({ name, email, password, confirmPassword });
          secureStorage.setTokens(response.tokens);
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isAdmin: response.user.role === 'admin',
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка регистрации';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          logger.error('Logout error', error);
        } finally {
          secureStorage.removeTokens();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isAdmin: false,
            error: null,
          });
        }
      },

      refreshAccessToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authService.refreshToken(tokens.refreshToken);
          secureStorage.setTokens(response.tokens);
          set({ tokens: response.tokens });
        } catch (error) {
          logger.error('Token refresh failed', error);
          // If refresh fails, logout user
          secureStorage.removeTokens();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isAdmin: false,
          });
          throw error;
        }
      },

      checkAuth: async () => {
        const tokens = secureStorage.getTokens();
        if (!tokens) {
          set({ isAuthenticated: false, user: null, isAdmin: false });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            tokens,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isLoading: false,
          });
        } catch (error) {
          logger.error('Auth check failed', error);
          secureStorage.removeTokens();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
      }),
    }
  )
);
