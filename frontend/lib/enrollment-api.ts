/**
 * Enrollment & Identity API
 */

import { apiClient } from './api-client';

export interface EnrollmentCase {
  id: number;
  citizen: number;
  citizen_name: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_by?: number;
  reviewed_by_email?: string;
  reviewed_at?: string;
  admin_notes?: string;
}

export interface EnrollmentRequest {
  nid_number: string;
  full_name: string;
  date_of_birth: string;
  residency_district: string;
}

export interface EnrollmentDocumentRequest {
  document_type: 'NID_FRONT' | 'NID_BACK' | 'SELFIE' | 'PROOF';
  upload_asset: number;
}

export const enrollmentApi = {
  createCase: (data: EnrollmentRequest) =>
    apiClient.post<EnrollmentCase>('/enrollment/cases/create', data),

  listCases: () =>
    apiClient.get<EnrollmentCase[]>('/enrollment/cases'),

  getCase: (id: number) =>
    apiClient.get<EnrollmentCase>(`/enrollment/cases/${id}`),

  addDocument: (caseId: number, data: EnrollmentDocumentRequest) =>
    apiClient.post(`/enrollment/cases/${caseId}/documents`, data),
};

export const uploadApi = {
  uploadFile: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    // API client will automatically handle FormData headers
    return apiClient.post<{ id: number }>('/uploads/upload', formData);
  }
};
