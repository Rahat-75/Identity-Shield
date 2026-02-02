'use client';

import EnrollmentForm from '@/components/enrollment/EnrollmentForm';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EnrollmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Simple Header */}
      <header className="bg-white border-b mb-8">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 text-blue-600">
            <Shield className="w-5 h-5" />
            <span className="font-bold">Identity Enrollment</span>
          </div>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Digital Identity Enrollment</h1>
          <p className="text-gray-600">Securely verify your NID to get your Privacy Pass</p>
        </div>
        
        <EnrollmentForm />
      </main>
    </div>
  );
}
