'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { consentApi, Organization } from '@/lib/consent-api';
import { credentialsApi } from '@/lib/credentials-api';
import { Loader2, ShieldCheck, ShieldAlert, Building2, ScanLine, UserCheck, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function VerifierPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [aliasId, setAliasId] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
        // Allow unauthenticated access? 
        // Backend currently requires IsAuthenticated.
        // User is Citizen, so they can access it.
        router.push('/login');
    } else {
        loadOrgs();
    }
  }, [user, authLoading, router]);

  const loadOrgs = async () => {
    setLoading(true);
    const { data } = await consentApi.listOrganizations();
    if (data) setOrganizations(data);
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !aliasId) return;
    
    setVerifying(true);
    setError(null);
    setResult(null);

    // Call verify endpoint
    // We need to add verify to credentialsApi first
    const cleanId = aliasId.trim();
    
    const { data, error: apiError } = await credentialsApi.verifyCredential(cleanId, selectedOrg.id);
    
    if (data) {
        setResult(data);
    } else {
        // Simplify error message
        setError(apiError?.message || "Verification Failed");
    }
    setVerifying(false);
  };

  if (authLoading || loading) return <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <ScanLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verifier Portal Demo</h1>
          <p className="mt-2 text-gray-600">Simulate how an organization verifies a Privacy Pass.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
            {/* Step 1: Select Org */}
            <div className="p-8 border-b bg-gray-50/50">
                <label className="block text-sm font-medium text-gray-700 mb-3">Simulate As:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {organizations.map(org => (
                        <button
                            key={org.id}
                            onClick={() => { setSelectedOrg(org); setResult(null); setError(null); }}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border transition text-left",
                                selectedOrg?.id === org.id 
                                    ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50" 
                                    : "border-gray-200 hover:border-blue-300 hover:bg-white"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                selectedOrg?.id === org.id ? "bg-blue-200 text-blue-700" : "bg-gray-100 text-gray-500"
                            )}>
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{org.name}</div>
                                <div className="text-xs text-gray-500 uppercase">{org.org_type}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Input ID */}
            {selectedOrg && (
                <div className="p-8">
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Citizen Alias ID (or QR Data)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={aliasId}
                                    onChange={(e) => setAliasId(e.target.value)}
                                    placeholder="e.g. ALIAS-1234..."
                                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
                                    required
                                />
                                <Search className="w-6 h-6 text-gray-400 absolute left-4 top-4" />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Tip: Copy your ID from the Dashboard and paste it here.
                            </p>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={verifying}
                            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {verifying ? <Loader2 className="animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            Verify Identity
                        </button>
                    </form>

                    {/* Results */}
                    {error && (
                         <div className="mt-8 p-6 bg-red-50 rounded-xl border border-red-100 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-red-900 font-bold">Verification Failed</h3>
                                <p className="text-red-700 mt-1">{error}</p>
                            </div>
                         </div>
                    )}

                    {result && (
                        <div className="mt-8 bg-green-50 rounded-xl border border-green-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-4 bg-green-100 border-b border-green-200 flex items-center gap-3">
                                <UserCheck className="w-6 h-6 text-green-700" />
                                <h3 className="text-green-900 font-bold">Identity Verified</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid gap-4">
                                    {result.data.full_name && (
                                        <div className="flex justify-between border-b border-green-200 pb-2">
                                            <span className="text-green-800">Full Name</span>
                                            <span className="font-bold text-gray-900">{result.data.full_name}</span>
                                        </div>
                                    )}
                                    {result.data.age_over_18 !== undefined && (
                                        <div className="flex justify-between border-b border-green-200 pb-2">
                                            <span className="text-green-800">Age Check (18+)</span>
                                            <span className={cn("font-bold", result.data.age_over_18 ? "text-green-700" : "text-red-600")}>
                                                {result.data.age_over_18 ? "PASS" : "FAIL"}
                                            </span>
                                        </div>
                                    )}
                                     {result.data.residency_district && (
                                        <div className="flex justify-between border-b border-green-200 pb-2">
                                            <span className="text-green-800">District</span>
                                            <span className="font-bold text-gray-900">{result.data.residency_district}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-green-700 mt-4 pt-4 border-t border-green-200">
                                    Verified by {result.data.organization} at {new Date(result.data.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
