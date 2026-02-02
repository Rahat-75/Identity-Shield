'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { credentialsApi, AliasIdentifier } from '@/lib/credentials-api';
import { Loader2, Key, Shield, Info } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '@/lib/utils';

export default function PrivacyPassCard() {
  const { user } = useAuth();
  const [aliases, setAliases] = useState<AliasIdentifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeAlias, setActiveAlias] = useState<AliasIdentifier | null>(null);

  useEffect(() => {
    loadAliases();
  }, []);

  const loadAliases = async () => {
    setLoading(true);
    const { data } = await credentialsApi.listAliases();
    if (data) {
      setAliases(data);
      // Default to the most recent Global alias
      const globalAlias = data.find(a => a.alias_type === 'GLOBAL');
      if (globalAlias) setActiveAlias(globalAlias);
    }
    setLoading(false);
  };

  const generateAlias = async () => {
    setGenerating(true);
    // Aliases are now permanent, backend will return existing one if found
    const { data } = await credentialsApi.createAlias('GLOBAL');
    if (data) {
      setAliases([data]); // Only one global alias supported now
      setActiveAlias(data);
    }
    setGenerating(false);
  };

  if (loading) return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
        <h2 className="text-xl font-bold mb-1">My Privacy Pass</h2>
        <p className="text-blue-100 text-sm opacity-90">Secure Anonymous Verification</p>
      </div>

      <div className="p-6">
        {activeAlias ? (
          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl border-4 border-blue-50 shadow-sm">
                <QRCodeSVG 
                  value={`NID_VERIFY:${activeAlias.alias_id}`} 
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="mt-4 text-xs font-mono text-gray-500 bg-gray-50 px-3 py-1 rounded-full border">
                {activeAlias.alias_id}
              </p>
            </div>

            {/* Info Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm px-2">
                <span className="text-gray-500">Pass Type</span>
                <span className="font-medium text-gray-900 flex items-center gap-1">
                  <Shield className="w-4 h-4 text-blue-500" /> Global
                </span>
              </div>
              <div className="flex items-center justify-between text-sm px-2">
                <span className="text-gray-500">Created</span>
                <span className="font-medium text-gray-900">{formatDate(activeAlias.created_at)}</span>
              </div>
              <div className="flex items-center justify-between text-sm px-2">
                <span className="text-gray-500">Status</span>
                <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded-full uppercase">Active</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p>
                  This is your permanent Privacy Pass ID. It allows secure verification without revealing your NID.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500">
              <Key className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">No Active Pass</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                You haven't generated a privacy pass yet. Create one to start verifying anonymously.
              </p>
            </div>
            <button
              onClick={generateAlias}
              disabled={generating}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              {generating ? 'Generating...' : 'Create First Pass'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
