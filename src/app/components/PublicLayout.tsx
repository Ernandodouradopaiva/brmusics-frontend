'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { isPublicAppRoute } from '@/lib/public-routes';
import { isRelatorioPdfViewerRoute } from '@/lib/relatorioPdfViewerRoute';

interface Props {
  children: ReactNode;
}

export default function PublicLayout({ children }: Props) {
  const pathname = usePathname();
  const isPublicPath = isPublicAppRoute(pathname);
  const isPdfViewer = isRelatorioPdfViewerRoute(pathname);

  if (isPublicPath || isPdfViewer) {
    return <>{children}</>;
  }

  return <ShellLayout>{children}</ShellLayout>;
}
