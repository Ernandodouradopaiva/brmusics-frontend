import { getAppUrl } from '@/lib/env';

export const API_PATH = '/brmusics-api';

export function getApiBaseURL(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${API_PATH}`;
  }
  return `${getAppUrl()}${API_PATH}`;
}

export function resolveApiBaseURLForClient(): string {
  return getApiBaseURL();
}
