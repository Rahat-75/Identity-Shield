'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';
import { EnrollmentCase } from '@/lib/enrollment-api';
import { Check, X, Eye, Loader2, AlertCircle, ShieldCheck, User, Building2, Store, Zap } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function AdminReviewPanel() {
  const [activeTab, setActiveTab] = useState<'ENROLLMENTS' | 'ORGANIZATIONS'>('ENROLLMENTS');
  
  // Enrollment State
  const [cases, setCases] = useState<EnrollmentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<EnrollmentCase | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // Organization State
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);

  useEffect(() => {
    loadCases();
    loadOrgs();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    const { data } = await adminApi.listAllCases();
    if (data) setCases(data);
    setLoading(false);
  };

  const loadOrgs = async () => {
    setOrgsLoading(true);
    const { data } = await adminApi.listOrganizations();
    if (data) setOrganizations(data);
    setOrgsLoading(false);
  };

  const loadDocuments = async (caseId: number) => {
    setDocsLoading(true);
    const { data } = await adminApi.getCaseDocuments(caseId);
    if (data) setDocuments(data);
    setDocsLoading(false);
  };
  
  const handleSelectCase = (c: EnrollmentCase) => {
    setSelectedCase(c);
    setReviewNotes(c.admin_notes || '');
    loadDocuments(c.id);
  };


  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedCase) return;
    setProcessing(true);
    
    const { data, error: apiError } = await adminApi.reviewCase(selectedCase.id, {
      status,
      admin_notes: reviewNotes
    });

    if (data) {
      setCases(prev => prev.map(c => c.id === data.id ? data : c));
      setSelectedCase(null);
      setReviewNotes('');
    }
    setProcessing(false);
  };

  const initOrgReview = (org: any, status: 'APPROVED' | 'REJECTED') => {
    setSelectedOrg(org);
    setActionType(status);
    setModalOpen(true);
  };

  const confirmOrgReview = async () => {
    if (!selectedOrg || !actionType) return;
    
    const { data } = await adminApi.approveOrganization(selectedOrg.id, actionType);
    if (data) {
        setOrganizations(prev => prev.map(o => o.id === data.organization.id ? data.organization : o));
    }
    setModalOpen(false);
    setSelectedOrg(null);
    setActionType(null);
  };

  if (loading && activeTab === 'ENROLLMENTS') return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div>
        {/* Helper Modal */}
        {modalOpen && selectedOrg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center mb-4",
                            actionType === 'APPROVED' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                            {actionType === 'APPROVED' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {actionType === 'APPROVED' ? 'Approve' : 'Reject'} Organization?
                        </h3>
                        
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to {actionType === 'APPROVED' ? 'approve' : 'reject'} <span className="font-semibold text-gray-900">{selectedOrg.name}</span>?
                            {actionType === 'APPROVED' ? 
                                " They will immediately be able to verify citizen identities." : 
                                " They will not be able to access the portal."}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmOrgReview}
                                className={cn(
                                    "flex-1 px-4 py-2 text-white rounded-lg font-bold transition shadow-sm",
                                    actionType === 'APPROVED' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                                )}
                            >
                                Confirm {actionType === 'APPROVED' ? 'Approval' : 'Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
            <button
                onClick={() => setActiveTab('ENROLLMENTS')}
                className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2",
                    activeTab === 'ENROLLMENTS' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                )}
            >
                <User className="w-4 h-4" />
                Enrollments
            </button>
            <button
                onClick={() => setActiveTab('ORGANIZATIONS')}
                className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2",
                    activeTab === 'ORGANIZATIONS' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                )}
            >
                <Building2 className="w-4 h-4" />
                Organizations
                {organizations.filter(o => o.approval_status === 'PENDING').length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {organizations.filter(o => o.approval_status === 'PENDING').length}
                    </span>
                )}
            </button>
        </div>

        {activeTab === 'ENROLLMENTS' ? (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Case List */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Enrollments ({cases.filter(c => c.status === 'PENDING_REVIEW').length})</h2>
                
                {cases.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-dashed text-center text-gray-500">
                    No enrollment cases found.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-700">Citizen</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-700">Submitted</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cases.map((c) => (
                          <tr key={c.id} className={cn("hover:bg-blue-50/50 transition", selectedCase?.id === c.id && "bg-blue-50")}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-gray-900">{c.citizen_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(c.submitted_at)}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                                c.status === 'PENDING_REVIEW' && "bg-yellow-100 text-yellow-700",
                                c.status === 'APPROVED' && "bg-green-100 text-green-700",
                                c.status === 'REJECTED' && "bg-red-100 text-red-700",
                              )}>
                                {c.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleSelectCase(c)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Review Side Panel */}
              <div className="lg:col-span-1">
                {selectedCase ? (
                  <div className="bg-white rounded-2xl shadow-lg border p-6 sticky top-8 space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">Reviewing: {selectedCase.citizen_name}</h3>
                      <button onClick={() => setSelectedCase(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Document Verification */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Submitted Documents</h4>
                      
                      {docsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      ) : documents.length === 0 ? (
                        <div className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded">
                          No documents uploaded
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {documents.map((doc) => (
                            <div key={doc.id} className="border rounded-xl overflow-hidden bg-gray-50">
                              <div className="px-3 py-2 bg-gray-100 border-b text-xs font-bold text-gray-700 uppercase flex justify-between">
                                <span>{doc.document_type.replace('_', ' ')}</span>
                                <span className="text-gray-400 font-normal">{formatDate(doc.uploaded_at)}</span>
                              </div>
                              <div className="relative aspect-video w-full bg-gray-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                  src={doc.file_url} 
                                  alt={doc.document_type}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Auto-Verification Results */}

                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-700 font-medium mb-1 uppercase tracking-wider">Verification Checklist</p>
                        <ul className="text-sm text-blue-800 space-y-2">
                          <li className="flex items-center gap-2">
                            <Check className="w-3 h-3" /> Verify NID number matches photo
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3 h-3" /> Verify Selfie matches NID photo
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3 h-3" /> Check for signs of tampering
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Internal Audit Notes</label>
                        {selectedCase.status !== 'PENDING_REVIEW' && (
                           <span className={cn(
                             "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                             selectedCase.status === 'APPROVED' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                           )}>
                             {selectedCase.status}
                           </span>
                        )}
                       </div>
                      <textarea 
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Observed matching signature..."
                        className={cn(
                            "w-full h-32 p-3 border rounded-xl outline-none text-sm transition",
                            selectedCase.status !== 'PENDING_REVIEW' 
                                ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100" 
                                : "focus:ring-2 focus:ring-blue-500"
                        )}
                        readOnly={selectedCase.status !== 'PENDING_REVIEW'}
                      />
                    </div>

                    {selectedCase.status === 'PENDING_REVIEW' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <button
                            disabled={processing}
                            onClick={() => handleReview('REJECTED')}
                            className="py-3 border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 transition flex items-center justify-center gap-2"
                        >
                            <X className="w-5 h-5" /> Reject
                        </button>
                        <button
                            disabled={processing}
                            onClick={() => handleReview('APPROVED')}
                            className="py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" /> Approve
                        </button>
                        </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-12 text-center text-gray-400">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">Select a case to begin review</p>
                  </div>
                )}
              </div>
             </div>
        ) : (
            /* ORGANIZATIONS TAB */
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Organization Management</h2>
                
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Organization</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Type</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Registration</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {organizations.map(org => (
                                <tr key={org.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                <Store className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{org.name}</div>
                                                <div className="text-xs text-gray-500">{org.contact_email || 'No email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {org.org_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                        {org.registration_number}
                                    </td>
                                    <td className="px-6 py-4">
                                         <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-bold",
                                            org.approval_status === 'PENDING' ? "bg-yellow-100 text-yellow-800" :
                                            org.approval_status === 'APPROVED' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                        )}>
                                            {org.approval_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {org.approval_status === 'PENDING' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => initOrgReview(org, 'REJECTED')}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Reject"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => initOrgReview(org, 'APPROVED')}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                    title="Approve"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {organizations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No organizations found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
}
