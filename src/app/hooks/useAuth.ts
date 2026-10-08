/**
 * useAuth Hook
 * Convenience hook for accessing auth state and actions
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/app/stores/auth.store';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    const restoreSession = (state = useAuthStore.getState()) => {
      if (state.tokens && !state.isAuthenticated) {
        void state.checkAuth();
        return;
      }

      if (!state.tokens) {
        useAuthStore.setState({ isLoading: false });
      }
    };

    const unsubscribe = useAuthStore.persist.onFinishHydration(restoreSession);
    if (useAuthStore.persist.hasHydrated()) restoreSession();

    return unsubscribe;
  }, []);

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
