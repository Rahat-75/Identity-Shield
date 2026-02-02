'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('ERROR');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const verifyToken = async () => {
      try {
        const { data, error } = await apiClient.post('/auth/verify-email', { token });
        
        if (data) {
          setStatus('SUCCESS');
          setMessage(data.message || 'Your email has been successfully verified!');
        } else {
          setStatus('ERROR');
          setMessage(error?.message || 'Verification failed. The link may be expired.');
        }
      } catch (err) {
        setStatus('ERROR');
        setMessage('A network error occurred. Please try again later.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'LOADING' && (
          <div className="py-8">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h1>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="py-8 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-8">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Continue to Login <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="py-8 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="space-y-4">
                <Link
                href="/login"
                className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                Back to Login
                </Link>
                <p className="text-xs text-gray-400">
                If the link is expired, try logging in to resend the verification email.
                </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
