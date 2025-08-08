declare module 'react-router-dom' {
  import * as React from 'react';
  export const Link: React.FC<any>;
  export const NavLink: React.FC<any>;
  export function useNavigate(): (to: string) => void;
  export function useLocation(): { pathname: string; search: string; hash: string };
  export function useSearchParams(): [URLSearchParams, (nextInit: any) => void];
  export const Navigate: React.FC<{ to: string; replace?: boolean }>;
  export const BrowserRouter: React.FC<{ children?: React.ReactNode }>;
  export const Routes: React.FC<{ children?: React.ReactNode }>;
  export const Route: React.FC<{ path?: string; element?: React.ReactNode; children?: React.ReactNode }>;
}
