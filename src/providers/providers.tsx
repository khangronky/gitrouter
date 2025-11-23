import type { ReactNode } from 'react';
import ClientProviders from './client-providers';

export default function Providers({ children }: { children: ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}
