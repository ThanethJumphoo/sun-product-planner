"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ModuleRegistry, AllEnterpriseModule } from "ag-grid-enterprise";

// Register AG Grid Enterprise modules globally
ModuleRegistry.registerModules([AllEnterpriseModule]);

// Suppress AG Grid license warning overlay in Next.js dev mode
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string') {
      const msg = args[0];
      if (
        msg.includes('AG Grid Enterprise License') ||
        msg.includes('License Key Not Found') ||
        msg.includes('All AG Grid Enterprise features are unlocked for trial') ||
        (msg.startsWith('*') && msg.includes('***'))
      ) {
        return;
      }
    }
    // Specific string AG Grid uses
    if (args.join(' ').includes('ag-grid.com for a trial license key')) {
      return;
    }
    originalConsoleError(...args);
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
