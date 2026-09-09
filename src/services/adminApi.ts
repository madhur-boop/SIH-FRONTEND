import { apiGet, apiPost, apiDelete } from './apiClient';
import { BackendStats } from '../types';

export async function getDashboardStats(): Promise<BackendStats> {
  return await apiGet('/admin/stats');
}

export async function getAuditLogs(page: number = 1, limit: number = 50) {
  return await apiGet(`/admin/audit-logs?page=${page}&limit=${limit}`);
}

export async function getUsers(page: number = 1, limit: number = 20, search: string = '') {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) query.append('search', search);
  return await apiGet(`/admin/users?${query.toString()}`);
}

export async function createUser(userData: any) {
  return await apiPost('/admin/users', userData);
}

export async function deleteUser(userId: string) {
  return await apiDelete(`/admin/users/${userId}`);
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  validationStatus?: string;
  reviewStatus?: string;
  riskLevel?: string;
  fakeDocumentStatus?: string;
  documentType?: string;
  search?: string;
}

export async function getAdminDocuments(filtersOrPage: DocumentFilters | number = 1, limitParam: number = 20) {
  const params = new URLSearchParams();
  if (typeof filtersOrPage === 'number') {
    params.append('page', String(filtersOrPage));
    params.append('limit', String(limitParam));
  } else {
    const f = filtersOrPage;
    if (f.page) params.append('page', String(f.page));
    if (f.limit) params.append('limit', String(f.limit));
    if (f.validationStatus && f.validationStatus !== 'ALL') params.append('validationStatus', f.validationStatus);
    if (f.reviewStatus && f.reviewStatus !== 'ALL') params.append('reviewStatus', f.reviewStatus);
    if (f.riskLevel && f.riskLevel !== 'ALL') params.append('riskLevel', f.riskLevel);
    if (f.fakeDocumentStatus && f.fakeDocumentStatus !== 'ALL') params.append('fakeDocumentStatus', f.fakeDocumentStatus);
    if (f.documentType && f.documentType !== 'ALL' && f.documentType !== 'All') params.append('documentType', f.documentType);
    if (f.search && f.search.trim()) params.append('search', f.search.trim());
  }
  return await apiGet(`/admin/documents?${params.toString()}`);
}

