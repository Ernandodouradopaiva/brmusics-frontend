'use client';

import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@/contexts/AuthContext';
import PublicLayout from '@/app/components/PublicLayout';
import { PwaRegister } from '@/components/PwaRegister';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PublicLayout>{children}</PublicLayout>
      <PwaRegister />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </AuthProvider>
  );
}
