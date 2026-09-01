import axios, { AxiosInstance } from 'axios';
import { resolveApiBaseURLForClient } from '@/lib/apiBaseUrl';
import { isPublicAppRoute } from '@/lib/public-routes';

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function isPublicApiUrl(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/logout') ||
    url.includes('/usuarios/recuperar-senha')
  );
}

function isBrowserPublicRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return isPublicAppRoute(window.location.pathname);
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    config.baseURL = resolveApiBaseURLForClient();
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const url = String(error.config?.url ?? '');
        if (!isPublicApiUrl(url) && !isBrowserPublicRoute()) {
          onUnauthorized?.();
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const api = createApiClient();

export const publicApi = axios.create({
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

publicApi.interceptors.request.use((config) => {
  config.baseURL = resolveApiBaseURLForClient();
  return config;
});
