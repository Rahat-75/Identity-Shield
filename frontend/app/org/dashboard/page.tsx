'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { credentialsApi } from '@/lib/credentials-api'; 
import VerificationHistoryList from '@/components/org/VerificationHistoryList';
import QRScanner from '@/components/org/QRScanner';
import { Loader2, Building2, ShieldCheck, ShieldAlert, AlertCircle, Search, CheckCircle2, QrCode, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgDashboardData {
  organization: {
    id: number;
    name: string;
    org_type: string;
    approval_status: string;
    registration_number: string;
  };
  user_role: string;
  is_approved: boolean;
}

export default function OrgDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<OrgDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aliasId, setAliasId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'ORG_USER') {
      router.push('/dashboard');
    } else if (user) {
      loadDashboard();
    }
  }, [user, authLoading, router]);

  const loadDashboard = async () => {
    setLoading(true);
    const { data } = await apiClient.get<OrgDashboardData>('/organizations/dashboard');
    if (data) {
      setDashboardData(data);
    }
    setLoading(false);
  };

  const handleVerify = async (e?: React.FormEvent, manualAliasId?: string) => {
    if (e) e.preventDefault();
    const finalId = manualAliasId || aliasId;
    if (!dashboardData || !finalId) return;

    setVerifying(true);
    setVerificationError(null);
    setVerificationResult(null);

    const { data, error } = await credentialsApi.verifyCredential(finalId.trim(), dashboardData.organization.id);

    if (data) {
      setVerificationResult(data);
    } else {
      setVerificationError(error?.message || 'Verification failed');
    }
    setVerifying(false);
  };

  const handleScanSuccess = (text: string) => {
    setAliasId(text);
    setShowScanner(false);
    // Auto-verify if it looks like a valid ID
    if (text.includes('ALIAS-') || text.includes('NID_VERIFY:')) {
        handleVerify(undefined, text);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Failed to load dashboard</p>
      </div>
    );
  }

  const isPending = dashboardData.organization.approval_status === 'PENDING';
  const isRejected = dashboardData.organization.approval_status === 'REJECTED';

  return (
    <div className="min-h-screen bg-gray-50">
      {showScanner && (
          <QRScanner 
            onScanSuccess={handleScanSuccess} 
            onClose={() => setShowScanner(false)} 
          />
      )}
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-800">Organization Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user?.email}</span>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="text-sm font-medium text-red-600 hover:text-red-800 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Organization Info */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{dashboardData.organization.name}</h2>
              <p className="text-gray-600 mt-1">{dashboardData.organization.org_type}</p>
              <p className="text-sm text-gray-500 mt-1">Reg: {dashboardData.organization.registration_number}</p>
            </div>
            <div>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold uppercase',
                  isPending && 'bg-yellow-100 text-yellow-800',
                  isRejected && 'bg-red-100 text-red-800',
                  dashboardData.is_approved && 'bg-green-100 text-green-800'
                )}
              >
                {dashboardData.organization.approval_status}
              </span>
            </div>
          </div>
        </div>

        {/* Pending Approval Notice */}
        {isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
             <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-yellow-900">Pending Admin Approval</h3>
                  <p className="text-yellow-800 mt-1">
                    Your organization registration requires approval to access verification features.
                  </p>
                </div>
            </div>
          </div>
        )}

        {/* Rejected Notice */}
        {isRejected && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900">Registration Rejected</h3>
              <p className="text-red-800 mt-1">
                Your organization registration was not approved. Please contact support for more information.
              </p>
            </div>
          </div>
        )}

        {/* Verification Section (only if approved) */}
        {dashboardData.is_approved && (
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              Verify Citizen Identity
            </h3>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Citizen Alias ID (from QR Code or Privacy Pass)
                </label>
                <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={aliasId}
                        onChange={(e) => setAliasId(e.target.value)}
                        placeholder="e.g. ALIAS-1234... or NID_VERIFY:ALIAS-..."
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
                        required
                      />
                      <Search className="w-6 h-6 text-gray-400 absolute left-4 top-4" />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center gap-2 font-bold"
                        title="Scan QR Code"
                    >
                        <Camera className="w-6 h-6" />
                        Scan
                    </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-100"
              >
                {verifying ? <Loader2 className="animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                Verify Identity
              </button>
            </form>

            {/* Verification Error */}
            {verificationError && (
              <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-100 flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="text-red-900 font-bold">Verification Failed</h4>
                  <p className="text-red-700 mt-1">{verificationError}</p>
                </div>
              </div>
            )}

            {/* Verification Success */}
            {verificationResult && (
              <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-xl mx-auto">
                    
                    {/* Minimal Success Header */}
                    <div className="bg-green-50 px-6 py-4 flex items-center justify-center gap-2 border-b border-green-100">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">Identity Verified Successfully</span>
                    </div>

                    {/* Content */}
                    <div className="p-8 text-center space-y-6">
                        
                        {/* Name - Hero */}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                                {verificationResult.data.full_name || 'Verified Citizen'}
                            </h2>
                            {verificationResult.data.timestamp && (
                                <p className="text-sm text-gray-400 mt-1">
                                    Verified on {new Date(verificationResult.data.timestamp).toLocaleDateString()} at {new Date(verificationResult.data.timestamp).toLocaleTimeString()}
                                </p>
                            )}
                        </div>

                        {/* Minimal Data Grid */}
                        <div className="flex flex-wrap justify-center gap-4 pt-2">
                             {verificationResult.data.age_over_18 !== undefined && (
                                <div className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium border",
                                    verificationResult.data.age_over_18 
                                        ? "bg-blue-50 text-blue-700 border-blue-100" 
                                        : "bg-red-50 text-red-700 border-red-100"
                                )}>
                                    {verificationResult.data.age_over_18 ? 'Adult (18+)' : 'Minor (<18)'}
                                </div>
                             )}
                             
                             {verificationResult.data.phone_verified !== undefined && (
                                <div className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium border",
                                    verificationResult.data.phone_verified 
                                        ? "bg-gray-50 text-gray-700 border-gray-200" 
                                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                )}>
                                    {verificationResult.data.phone_verified ? 'Phone Verified' : 'Phone Unverified'}
                                </div>
                             )}

                             {verificationResult.data.residency_district && (
                                <div className="px-4 py-2 rounded-lg text-sm font-medium border bg-gray-50 text-gray-700 border-gray-200">
                                    {verificationResult.data.residency_district}
                                </div>
                             )}
                        </div>
                    </div>
                </div>
              </div>
            )}
            
            <div className="mt-12">
                <VerificationHistoryList />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
