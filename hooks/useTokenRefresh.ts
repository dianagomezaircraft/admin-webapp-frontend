// hooks/useTokenRefresh.ts
import { useEffect } from 'react';
import { refreshTokenIfNeeded } from '@/lib/auth';

export function useTokenRefresh() {
  useEffect(() => {
    // Check token every minute
    const interval = setInterval(() => {
      refreshTokenIfNeeded();
    }, 60 * 1000); // Every 1 minute

    // Initial check
    refreshTokenIfNeeded();

    return () => clearInterval(interval);
  }, []);
}