/**
 * Consent Management API
 */

import { apiClient } from './api-client';

export interface ConsentGrant {
  id: number;
  organization: {
    id: number;
    name: string;
    org_type: string;
  };
  scopes: string[];
  granted_at: string;
  is_active: boolean;
}

export interface Organization {
  id: number;
  name: string;
  org_type: string;
  registration_number: string;
}

export const consentApi = {
  // List all granted consents
  listGrants: () =>
    apiClient.get<ConsentGrant[]>('/consent/grants'),

  // List available organizations
  listOrganizations: () =>
    apiClient.get<Organization[]>('/organizations'),

  // Grant consent to an organization
  grantConsent: (organization_id: number, scopes: string[]) =>
    apiClient.post<ConsentGrant>('/consent/grants', {
      organization_id,
      scopes
    }),

  // Revoke consent
  revokeConsent: (id: number) =>
    apiClient.delete(`/consent/grants/${id}`),
};
