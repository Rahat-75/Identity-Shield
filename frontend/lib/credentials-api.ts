/**
 * Credentials & Privacy Pass API
 */

import { apiClient } from './api-client';

export interface AliasIdentifier {
  id: number;
  alias_id: string; // The anonymous ID (e.g. "ALIAS-...")
  alias_type: 'GLOBAL' | 'PAIRWISE';
  organization_name?: string;
  created_at: string;
}

export interface VerificationToken {
  token: string;
  qr_data: string;
  expires_at: string;
}

export const credentialsApi = {
  // Get all active aliases
  listAliases: () =>
    apiClient.get<AliasIdentifier[]>('/credentials/aliases'),

  // Generate a new alias
  createAlias: (type: 'GLOBAL' | 'PAIRWISE', orgId?: number, rotate?: boolean) =>
    apiClient.post<AliasIdentifier>('/credentials/aliases', { 
      alias_type: type, 
      organization_id: orgId,
      rotate: rotate 
    }),

  // Create a verification request (for demo purposes, self-initiated)
  generateToken: (request_id: number) =>
    apiClient.post<VerificationToken>('/verification/approve', { request_id }),

  // Verify a credential (Simulated Org View)
  verifyCredential: (aliasId: string, orgId: number) => 
    apiClient.post<any>('/credentials/verify', { alias_id: aliasId, org_id: orgId }),
    
  // Get verification history
  getHistory: () =>
    apiClient.get<any[]>('/credentials/history'),
};
