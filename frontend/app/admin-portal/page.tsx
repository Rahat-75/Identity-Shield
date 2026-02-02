'use client';

import AdminReviewPanel from '@/components/admin/AdminReviewPanel';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminPortal() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-slate-900 border-b border-slate-800 mb-8 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-300 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Exit Admin Portal</span>
          </Link>
          <div className="flex items-center gap-2 text-red-500">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold tracking-wide">ADMINISTRATIVE OVERSIGHT</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Identity Management</h1>
          <p className="text-gray-600">Review and verify citizen identities for the Identity Shield system.</p>
        </div>
        
        <AdminReviewPanel />
      </main>
    </div>
  );
}
