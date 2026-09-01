'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading, router]);

  if (loading) return <p style={{ padding: '2rem' }}>Carregando sessão...</p>;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
