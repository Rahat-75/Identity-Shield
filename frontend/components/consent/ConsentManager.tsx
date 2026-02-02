'use client';

import { useState, useEffect } from 'react';
import { consentApi, ConsentGrant, Organization } from '@/lib/consent-api';
import { Loader2, Shield, AlertCircle, Check, X, Search, Building2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const AVAILABLE_SCOPES = [
  { id: 'name_match', label: 'Verify Name Match' },
  { id: 'age_over_18', label: 'Verify Age > 18' },
  { id: 'phone_verified', label: 'Verify Phone Status' },
  { id: 'residency_district', label: 'View District' },
];

export default function ConsentManager() {
  const [grants, setGrants] = useState<ConsentGrant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['name_match']);
  const [processing, setProcessing] = useState(false);
  const [view, setView] = useState<'list' | 'add'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [grantsRes, orgsRes] = await Promise.all([
      consentApi.listGrants(),
      consentApi.listOrganizations(),
    ]);
    
    if (grantsRes.data) setGrants(grantsRes.data);
    if (orgsRes.data) setOrganizations(orgsRes.data);
    setLoading(false);
  };

  const handleGrant = async () => {
    if (!selectedOrg) return;
    setProcessing(true);
    const { data } = await consentApi.grantConsent(selectedOrg.id, selectedScopes);
    if (data) {
      setGrants(prev => [data, ...prev]);
      setView('list');
      setSelectedOrg(null);
      setSelectedScopes(['name_match']);
    }
    setProcessing(false);
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to revoke access? This organization will no longer be able to verify your identity.')) return;
    
    // Optimistic update
    setGrants(prev => prev.filter(g => g.id !== id));
    await consentApi.revokeConsent(id);
  };

  const toggleScope = (scopeId: string) => {
    setSelectedScopes(prev => 
      prev.includes(scopeId) 
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  if (loading) return (
    <div className="bg-white p-12 rounded-2xl shadow-sm border flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Data Access & Consent</h2>
          <p className="text-sm text-gray-500">Manage which organizations can verify your information.</p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => setView('add')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            New Grant
          </button>
        )}
      </div>

      <div className="p-6">
        {view === 'list' ? (
          <div className="space-y-4">
            {grants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No active consents found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {grants.map(grant => (
                  <div key={grant.id} className="border rounded-xl p-4 hover:border-blue-200 transition bg-gray-50/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center text-gray-400">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{grant.organization.name}</h3>
                          <p className="text-xs text-gray-500">{grant.organization.org_type}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevoke(grant.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg text-sm font-medium transition"
                      >
                        Revoke Access
                      </button>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Allowed Verifications</p>
                      <div className="flex flex-wrap gap-2">
                        {grant.scopes.map(scope => (
                          <span key={scope} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                            {AVAILABLE_SCOPES.find(s => s.id === scope)?.label || scope}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-4 pt-4 border-t">
                      Granted on {formatDate(grant.granted_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-8">
            {/* Step 1: Select Org */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Select Organization</label>
              <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-xl p-2 bg-gray-50">
                {organizations.map(org => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg text-left transition",
                      selectedOrg?.id === org.id ? "bg-blue-600 text-white shadow-md transform scale-[1.02]" : "hover:bg-white bg-transparent"
                    )}
                  >
                    <Building2 className={cn("w-5 h-5", selectedOrg?.id === org.id ? "text-blue-200" : "text-gray-400")} />
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className={cn("text-xs", selectedOrg?.id === org.id ? "text-blue-200" : "text-gray-500")}>{org.org_type}</p>
                    </div>
                    {selectedOrg?.id === org.id && <Check className="w-5 h-5 ml-auto text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Scopes */}
            {selectedOrg && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <label className="block text-sm font-medium text-gray-700">What data can they verify?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_SCOPES.map(scope => (
                    <button
                      key={scope.id}
                      onClick={() => toggleScope(scope.id)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition flex items-center justify-between",
                        selectedScopes.includes(scope.id) 
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className={cn("text-sm font-medium", selectedScopes.includes(scope.id) ? "text-blue-900" : "text-gray-700")}>
                        {scope.label}
                      </span>
                      {selectedScopes.includes(scope.id) && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    onClick={() => {
                      setView('list');
                      setSelectedOrg(null);
                    }}
                    className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGrant}
                    disabled={processing || selectedScopes.length === 0}
                    className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? <Loader2 className="animate-spin" /> : 'Grant Access'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
