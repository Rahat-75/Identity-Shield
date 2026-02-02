'use client';

import { useState } from 'react';
import { uploadApi } from '@/lib/enrollment-api';
import { cn } from '@/lib/utils';
import { Upload, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  uploadPreset: string;
  folder?: string;
  onUploadComplete: (assetId: number) => void;
  onFileSelect?: (file: File | null) => void;
  className?: string;
}

export default function FileUpload({
  label,
  uploadPreset,
  folder,
  onUploadComplete,
  className,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size too large (max 10MB)');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
      setUploaded(false);
      onFileSelect?.(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setUploaded(false);
    setError(null);
    onFileSelect?.(null);
  };
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Direct upload to backend
      const { data, error: uploadError } = await uploadApi.uploadFile(file, folder);

      if (uploadError || !data) {
        throw new Error('Upload failed');
      }

      setUploaded(true);
      onUploadComplete(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className={cn(
        'border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center',
        preview ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50',
        error && 'border-red-200 bg-red-50'
      )}>
        {preview ? (
          <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={clearFile}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer w-full py-4">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">Click to select or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG or PDF up to 10MB</p>
            <input
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
          </label>
        )}

        {file && !uploaded && !uploading && (
          <button
            onClick={handleUpload}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Upload {file.name.substring(0, 15)}...
          </button>
        )}

        {uploading && (
          <div className="mt-4 flex items-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Uploading...</span>
          </div>
        )}

        {uploaded && (
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Success!</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 text-red-600 bg-white p-2 rounded-lg border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
