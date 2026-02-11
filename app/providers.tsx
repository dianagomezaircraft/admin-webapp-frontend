'use client';

import { useTokenRefresh } from '@/hooks/useTokenRefresh';

export function Providers({ children }: { children: React.ReactNode }) {
  useTokenRefresh(); // Auto-refresh tokens

  return <>{children}</>;
}