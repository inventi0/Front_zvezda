/**
 * useAuth Hook
 * Convenience hook for accessing auth state and actions
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/app/stores/auth.store';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.isAuthenticated && !store.isLoading && store.tokens) {
      store.checkAuth();
    }
  }, [store]);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isAdmin: store.isAdmin,
    isSupport: store.isSupport,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,
  };
}
