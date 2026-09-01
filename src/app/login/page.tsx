'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { rotaInicialParaUsuario } from '@/lib/routePermissions';
import PublicBrandShell from './components/PublicBrandShell';
import LoginCard from './components/LoginCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import styles from './login.module.css';

function LoginPageContent() {
  const [fontSize, setFontSize] = useState(1);
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      router.replace(rotaInicialParaUsuario(user));
    }
  }, [isAuthenticated, loading, router, user]);

  if (loading || isAuthenticated) {
    return (
      <div className={styles.loginPage}>
        <LoadingSpinner fullPage label="Carregando..." />
      </div>
    );
  }

  return (
    <PublicBrandShell fontSize={fontSize} onFontSizeChange={setFontSize}>
      <LoginCard fontSizeLevel={Math.round((fontSize - 1) * 10)} />
    </PublicBrandShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loginPage}>
          <LoadingSpinner fullPage label="Carregando..." />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
