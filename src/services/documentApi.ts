import { apiGet, apiPost } from './apiClient';

export async function getPendingReviews(page: number = 1, limit: number = 20) {
  return await apiGet(`/documents/review/pending?page=${page}&limit=${limit}`);
}

export async function getDocumentDetails(id: string) {
  return await apiGet(`/documents/${id}/details`);
}

export async function getDocumentForReview(id: string) {
  return await apiGet(`/documents/review/${id}`);
}

export async function submitReview(id: string, decision: string, comment?: string) {
  return await apiPost(`/documents/review/${id}/decision`, {
    reviewDecision: decision,
    reviewComment: comment || '',
    decision,
    comment: comment || ''
  });
}

export function getDocumentFileEndpoint(id: string): string {
  return `/documents/${id}/file`;
}

export function getDocumentSelfieEndpoint(id: string): string {
  return `/documents/${id}/selfie`;
}

