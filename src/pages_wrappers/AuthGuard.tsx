import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingWrapper } from '@/components/onboarding/OnboardingWrapper';
import { getConfig } from '@/config/environment';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isDevelopment } = getConfig();

  useEffect(() => {
    if (!loading && !isDevelopment && !user) {
      router.replace('/signin');
    }
  }, [loading, user, router, isDevelopment]);

  if (isDevelopment) {
    return <OnboardingWrapper>{children}</OnboardingWrapper>;
  }

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return <OnboardingWrapper>{children}</OnboardingWrapper>;
}
