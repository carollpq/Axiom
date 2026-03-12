'use client';

import { ThirdwebProvider } from 'thirdweb/react';
import { UserProvider } from '@/src/shared/context/user-context.client';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <UserProvider>
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: '#2d2a26',
              border: '1px solid rgba(120,110,95,0.3)',
              color: '#d4ccc0',
              fontFamily: 'Georgia, serif',
              fontSize: '13px',
            },
          }}
        />
      </UserProvider>
    </ThirdwebProvider>
  );
}
