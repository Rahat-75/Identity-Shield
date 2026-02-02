'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  if (!authLoading && user) {
    const redirectPath = user.role === 'ORG_USER' ? '/org/dashboard' : '/dashboard';
    router.push(redirectPath);
    return null; 
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendStatus(null);
    setLoading(true);

    const result = await login(email, password);

    if (result.success && result.user) {
      const redirectPath = result.user.role === 'ORG_USER' ? '/org/dashboard' : '/dashboard';
      router.push(redirectPath);
    } else {
        // result.error might be the code or message. 
        // Our backend returns {error: {code: 'EMAIL_NOT_VERIFIED', message: '...'}}
        // Let's check how many auth result has error.
        setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  const handleResendEmail = async () => {
    setResending(true);
    setResendStatus(null);
    
    try {
        const { data, error: apiError } = await (await import('@/lib/api-client')).apiClient.post('/auth/resend-verification', { email });
        if (data) {
            setResendStatus({ message: data.message || 'Verification email resent!', type: 'success' });
        } else {
            setResendStatus({ message: (apiError as any)?.message || 'Failed to resend email.', type: 'error' });
        }
    } catch (err) {
        setResendStatus({ message: 'Network error.', type: 'error' });
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your Identity Shield account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            {error.includes('verify') && (
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {resending ? 'Resending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}

        {resendStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${
            resendStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="text-sm">{resendStatus.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign up
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Are you an organization?{' '}
            <Link href="/register-org" className="text-blue-600 hover:text-blue-700 font-semibold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
