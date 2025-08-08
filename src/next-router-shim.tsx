import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import React from 'react';

export const Link: React.FC<{ to: string; className?: string; children?: React.ReactNode; target?: string; onClick?: () => void } & any> = ({ to, children, ...props }) => {
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
};

export const NavLink = Link;

export function useNavigate() {
  const router = useRouter();
  return useCallback((to: string) => {
    router.push(to);
  }, [router]);
}

export function useLocation() {
  const router = useRouter();
  const { pathname, asPath } = router;
  const searchIndex = asPath.indexOf('?');
  const hashIndex = asPath.indexOf('#');
  const search = searchIndex !== -1 ? asPath.substring(searchIndex, hashIndex !== -1 ? hashIndex : undefined) : '';
  const hash = hashIndex !== -1 ? asPath.substring(hashIndex) : '';
  return useMemo(() => ({ pathname, search, hash }), [pathname, search, hash]);
}

export function useSearchParams(): [URLSearchParams, (nextInit: any) => void] {
  const router = useRouter();
  const params = useMemo(() => new URLSearchParams((typeof window !== 'undefined' && window.location.search) || ''), [router.asPath]);
  const setParams = useCallback((nextInit: any) => {
    const next = typeof nextInit === 'string' ? nextInit : new URLSearchParams(nextInit as any).toString();
    const url = `${router.pathname}${next ? `?${next}` : ''}`;
    router.push(url, undefined, { shallow: true });
  }, [router]);
  return [params, setParams];
}

export const Navigate: React.FC<{ to: string; replace?: boolean } & any> = ({ to, replace }) => {
  const router = useRouter();
  if (typeof window !== 'undefined') {
    replace ? router.replace(to) : router.push(to);
  }
  return null;
};

export const BrowserRouter: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const Routes: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const Route: React.FC<{ path?: string; element?: React.ReactNode; children?: React.ReactNode } & any> = ({ element, children }) => (
  <>{element ?? children ?? null}</>
);

