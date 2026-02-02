'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { enrollmentApi } from '@/lib/enrollment-api';
import FileUpload from '@/components/shared/file-upload';
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const enrollmentSchema = z.object({
  full_name: z.string().min(3, 'Full name is required'),
  nid_number: z.string().min(10, 'NID must be at least 10 digits').max(17, 'NID too long'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  residency_district: z.string().min(1, 'District is required'),
});

type EnrollmentValues = z.infer<typeof enrollmentSchema>;

export default function EnrollmentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<number | null>(null);
  
  // Document asset IDs
  const [docs, setDocs] = useState<{
    NID_FRONT?: number;
    NID_BACK?: number;
    SELFIE?: number;
  }>({});

  const form = useForm<EnrollmentValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      full_name: '',
      nid_number: '',
      date_of_birth: '',
      residency_district: '',
    },
  });

  const onSubmitInfo = async (values: EnrollmentValues) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await enrollmentApi.createCase(values);
      
      if (apiError) {
          // If apiError is an object like { nid_number: "..." }, throw it directly
          throw apiError;
      }
      
      if (!data) throw new Error('Failed to start enrollment');
      
      setCaseId(data.id);
      setStep(2);
    } catch (err: any) {
      // Check for specific field errors from backend
      if (err?.nid_number) {
        // Handle array or string
        const msg = Array.isArray(err.nid_number) ? err.nid_number[0] : err.nid_number;
        setError(msg);
      } else if (err?.message) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null) {
          // Fallback: Try to find first value if it's a dict like {"nid_number": ...}
          const values = Object.values(err);
          if (values.length > 0 && typeof values[0] === 'string') {
              setError(values[0] as string);
          } else {
             setError('Failed to start enrollment');
          }
      } else {
        setError('Something went wrong');
      }
      console.error("Enrollment Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocComplete = (type: keyof typeof docs, assetId: number) => {
    setDocs(prev => ({ ...prev, [type]: assetId }));
  };

  const onFinalSubmit = async () => {
    if (!caseId || !docs.NID_FRONT || !docs.NID_BACK || !docs.SELFIE) return;
    
    setLoading(true);
    try {
      // Register all documents
      const results = await Promise.all([
        enrollmentApi.addDocument(caseId, { document_type: 'NID_FRONT', upload_asset: docs.NID_FRONT }),
        enrollmentApi.addDocument(caseId, { document_type: 'NID_BACK', upload_asset: docs.NID_BACK }),
        enrollmentApi.addDocument(caseId, { document_type: 'SELFIE', upload_asset: docs.SELFIE }),
      ]);
      
      const hasError = results.some(r => r.error);
      if (hasError) {
        throw new Error('Some documents failed to save. Please try again.');
      }

      setStep(3); // Success step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNidFileSelect = (file: File | null) => {
    // No-op for client side matching
  };

  const handleSelfieSelect = (file: File | null) => {
    // No-op for client side matching
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border p-8">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-10 px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
              step === s ? "bg-blue-600 text-white" : 
              step > s ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
            )}>
              {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
            </div>
            {s < 3 && <div className={cn("h-1 w-12 sm:w-24 mx-2 rounded", step > s ? "bg-green-100" : "bg-gray-100")} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 rotate-180" />
          {error}
        </div>
      )}

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <form onSubmit={form.handleSubmit(onSubmitInfo)} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            <p className="text-gray-500 text-sm">Enter your details exactly as they appear on your NID card.</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                {...form.register('full_name')}
                placeholder="Ahmed Rahman"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {form.formState.errors.full_name && <p className="mt-1 text-xs text-red-500">{form.formState.errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NID Number</label>
              <input 
                {...form.register('nid_number')}
                placeholder="1990123456789"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {form.formState.errors.nid_number && <p className="mt-1 text-xs text-red-500">{form.formState.errors.nid_number.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input 
                  type="date"
                  {...form.register('date_of_birth')}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input 
                  {...form.register('residency_district')}
                  placeholder="Dhaka"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Next Step <ChevronRight className="w-5 h-5" /></>}
          </button>
        </form>
      )}

      {/* Step 2: Document Upload */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Upload Documents</h2>
            <p className="text-gray-500 text-sm">Please provide clear photos of your NID and a selfie.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FileUpload 
              label="NID Front Side"
              uploadPreset="nid_documents"
              onUploadComplete={(id) => handleDocComplete('NID_FRONT', id)}
              onFileSelect={handleNidFileSelect}
            />
            <FileUpload 
              label="NID Back Side"
              uploadPreset="nid_documents"
              onUploadComplete={(id) => handleDocComplete('NID_BACK', id)}
            />
            <FileUpload 
              label="Selfie for Verification"
              uploadPreset="nid_selfie"
              className="sm:col-span-2"
              onUploadComplete={(id) => handleDocComplete('SELFIE', id)}
              onFileSelect={handleSelfieSelect}
            />
          </div>


          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-3 border rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <button
              onClick={onFinalSubmit}
              disabled={loading || !docs.NID_FRONT || !docs.NID_BACK || !docs.SELFIE}
              className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Submit Enrollment'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="text-center py-12 space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Application Submitted!</h2>
            <p className="text-gray-600">Your enrollment case is now being reviewed by our team. This usually takes 24-48 hours.</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border text-sm text-gray-500 max-w-sm mx-auto">
            Case ID: <span className="font-mono font-bold text-gray-900">#{caseId}</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
