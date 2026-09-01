import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Quando true, erros 403 não devem exibir toast (prefetch opcional por perfil). */
    silentForbidden?: boolean;
  }
}
