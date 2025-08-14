import type { AppProps } from 'next/app';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { EnvironmentValidator } from '@/utils/security';
import { pageview, GA_TRACKING_ID } from '@/utils/analytics';
import '@/ssr-shims';
import '@/index.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const router = useRouter();

  useEffect(() => {
    EnvironmentValidator.logEnvironmentStatus();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      pageview(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Google tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}');
        `}
      </Script>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Component {...pageProps} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
