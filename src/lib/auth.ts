import { createApiClient } from './api';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/auth/accessToken';

export { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/auth/accessToken';
export {
  loginWithPassword,
  refreshSessionFromToken,
  fetchSession,
  logoutOnServer,
} from '@/lib/auth/apiAuth';

export function clearStoredAuth(): void {
  clearAccessToken();
}

export const api = createApiClient();
