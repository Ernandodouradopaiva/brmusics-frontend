'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsuariosRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/usuarios');
  }, [router]);
  return null;
}
