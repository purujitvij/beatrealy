'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SpotifyUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SpotifyUser | null;
}

// Refresh tokens 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export function useSpotifyAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Schedule token refresh before expiry
  const scheduleRefresh = useCallback((expiresAt: number, doRefresh: () => Promise<unknown>) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const now = Date.now();
    const timeUntilRefresh = expiresAt - now - REFRESH_BUFFER_MS;

    if (timeUntilRefresh > 0) {
      console.log(`[SpotifyAuth] Scheduling token refresh in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
      refreshTimeoutRef.current = setTimeout(() => {
        doRefresh();
      }, timeUntilRefresh);
    } else if (expiresAt > now) {
      // Token still valid but close to expiry, refresh now
      doRefresh();
    }
  }, []);

  // Refresh tokens
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) return false;
    isRefreshingRef.current = true;

    try {
      const response = await fetch('/api/auth/spotify/refresh', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        console.log('[SpotifyAuth] Tokens refreshed successfully');
        // Schedule next refresh
        scheduleRefresh(data.expiresAt, () => refreshTokens());
        isRefreshingRef.current = false;
        return true;
      }
      isRefreshingRef.current = false;
      return false;
    } catch (error) {
      console.error('[SpotifyAuth] Error refreshing tokens:', error);
      isRefreshingRef.current = false;
      return false;
    }
  }, [scheduleRefresh]);

  // Check auth status
  const checkAuth = useCallback(async () => {
    try {
      // First check if we have a user cookie (faster)
      const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('spotify_user='));

      if (userCookie) {
        try {
          const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: userData,
          });

          // Check expiry and schedule refresh
          const expiryCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('spotify_expires_at='));
          if (expiryCookie) {
            const expiresAt = parseInt(expiryCookie.split('=')[1], 10);
            scheduleRefresh(expiresAt, () => refreshTokens());
          }
          return;
        } catch {
          // Invalid cookie, continue to API check
        }
      }

      // Fall back to API check
      const response = await fetch('/api/auth/spotify/me');
      const data = await response.json();

      if (!data.authenticated) {
        // Try to refresh tokens
        const refreshed = await refreshTokens();
        if (refreshed) {
          // Re-check auth after refresh
          const retryResponse = await fetch('/api/auth/spotify/me');
          const retryData = await retryResponse.json();
          setAuthState({
            isAuthenticated: retryData.authenticated,
            isLoading: false,
            user: retryData.user,
          });
          return;
        }
      }

      setAuthState({
        isAuthenticated: data.authenticated,
        isLoading: false,
        user: data.user,
      });
    } catch (error) {
      console.error('Error checking auth:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    }
  }, [refreshTokens, scheduleRefresh]);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [checkAuth]);

  const login = useCallback(() => {
    window.location.href = '/api/auth/spotify/login';
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/spotify/logout', { method: 'POST' });
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuth,
  };
}
