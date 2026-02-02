/**
 * Admin API for Identity Review
 */

import { apiClient } from './api-client';
import { EnrollmentCase } from './enrollment-api';

export interface EnrollmentReviewRequest {
  status: 'APPROVED' | 'REJECTED';
  admin_notes: string;
}

export const adminApi = {
  listAllCases: () =>
    apiClient.get<EnrollmentCase[]>('/enrollment/cases'),

  reviewCase: (id: number, data: EnrollmentReviewRequest) =>
    apiClient.patch<EnrollmentCase>(`/enrollment/cases/${id}/review`, data),

  getCaseDocuments: (caseId: number) =>
    apiClient.get<any[]>(`/enrollment/cases/${caseId}/documents`),

  getVerificationResult: (caseId: number) =>
    apiClient.get<any>(`/enrollment/cases/${caseId}/auto-verify`),

  // Organization Management
  listOrganizations: () =>
    apiClient.get<any[]>('/organizations'),

  approveOrganization: (orgId: number, status: 'APPROVED' | 'REJECTED') =>
    apiClient.post(`/organizations/${orgId}/approve`, { status }),

  getDashboardStats: () =>
    apiClient.get<any>('/enrollment/admin/stats'),
};
