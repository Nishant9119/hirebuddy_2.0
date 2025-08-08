import dynamic from 'next/dynamic';
import AuthGuard from '@/pages_wrappers/AuthGuard';

const Page = dynamic(() => import('@/pages/ResumeImportPage').then(m => m.ResumeImportPage), { ssr: true });
export default function Wrapped() {
  return (
    <AuthGuard>
      <Page />
    </AuthGuard>
  );
}
