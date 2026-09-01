import { api } from '@/lib/api';
import type { DashboardCoordenador } from '@/types/api';

export const inicioService = {
  dashboard() {
    return api.get<DashboardCoordenador>('/inicio/dashboard');
  },
};
