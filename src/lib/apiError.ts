import axios from 'axios';

/** Campo inválido retornado pelo backend (Bean Validation). */
interface ProblemFieldError {
  name?: string;
  userMessage?: string;
}

/** Formato Problem (RFC 7807) retornado pelo backend */
interface ProblemResponse {
  userMessage?: string;
  detail?: string;
  message?: string;
  mensagem?: string;
  title?: string;
  objects?: ProblemFieldError[];
}

const FALLBACK = 'Não foi possível concluir a operação. Tente novamente.';

/** 401 após sessão expirada — o interceptor já limpa o login; evita toast duplicado. */
export function isUnauthorizedApiError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

/** 403 em requisição marcada com `silentForbidden` (prefetch opcional por perfil). */
export function isSilentForbiddenApiError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 403 &&
    Boolean(error.config?.silentForbidden)
  );
}

type ToastErrorFn = (message: string) => void;

/** @deprecated Prefira `notifyApiError` de `@/lib/notify`. */
export function toastApiError(error: unknown, toastError: ToastErrorFn): void {
  if (isSilentForbiddenApiError(error) || isUnauthorizedApiError(error)) return;
  toastError(getApiErrorMessage(error));
}

function mensagemPorStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Os dados enviados são inválidos. Verifique o formulário e tente novamente.';
    case 401:
      return 'Sua sessão expirou ou você não está autenticado. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para realizar esta operação.';
    case 404:
      return 'O recurso solicitado não foi encontrado.';
    case 409:
      return 'Não foi possível concluir: o registro está em uso ou há conflito de dados.';
    case 422:
      return 'Os dados enviados não puderam ser processados. Verifique e tente novamente.';
    case 502:
    case 503:
      return 'O serviço está temporariamente indisponível. Tente novamente em instantes.';
    default:
      if (status >= 500) {
        return 'Ocorreu um erro no servidor. Tente novamente; se persistir, contate o suporte.';
      }
      return FALLBACK;
  }
}

function extrairMensagemProblem(problem: ProblemResponse): string | null {
  if (typeof problem.userMessage === 'string' && problem.userMessage.trim()) {
    return problem.userMessage.trim();
  }
  if (typeof problem.detail === 'string' && problem.detail.trim()) {
    return problem.detail.trim();
  }
  if (typeof problem.mensagem === 'string' && problem.mensagem.trim()) {
    return problem.mensagem.trim();
  }
  if (typeof problem.message === 'string' && problem.message.trim()) {
    return problem.message.trim();
  }
  return null;
}

function extrairMensagemCampos(objects: ProblemFieldError[] | undefined): string | null {
  if (!objects?.length) return null;
  const mensagens = objects
    .map((o) => o.userMessage?.trim())
    .filter((m): m is string => Boolean(m));
  if (mensagens.length === 1) return mensagens[0];
  if (mensagens.length > 1) {
    return `${mensagens[0]} (e mais ${mensagens.length - 1} campo(s) com erro)`;
  }
  return null;
}

/**
 * Quando a API é chamada com `responseType: 'blob'`, o corpo de erro vem como Blob.
 * Normaliza para JSON/texto para que {@link getApiErrorMessage} funcione.
 */
export async function normalizeApiError(error: unknown): Promise<unknown> {
  if (!axios.isAxiosError(error)) return error;
  const data = error.response?.data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      const text = await data.text();
      if (!text.trim()) return error;
      try {
        error.response!.data = JSON.parse(text);
      } catch {
        error.response!.data = { userMessage: text.trim(), message: text.trim() };
      }
    } catch {
      /* mantém o erro original */
    }
  }
  return error;
}

export async function resolveApiErrorMessage(error: unknown): Promise<string> {
  return getApiErrorMessage(await normalizeApiError(error));
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    }

    const data = error.response?.data;
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return mensagemPorStatus(error.response?.status ?? 500);
    }

    if (data && typeof data === 'object') {
      const problem = data as ProblemResponse;
      const campos = extrairMensagemCampos(problem.objects);
      if (campos) return campos;

      const problemMsg = extrairMensagemProblem(problem);
      if (problemMsg) return problemMsg;

      const legacy = data as { error?: string; path?: string };
      if (typeof legacy.error === 'string' && legacy.error.trim()) {
        const path =
          typeof legacy.path === 'string' && legacy.path.trim() ? ` (${legacy.path})` : '';
        return `${legacy.error.trim()}${path}`;
      }
    }

    if (error.response?.status === 400 && typeof data === 'string' && data.trim()) {
      return data.trim();
    }

    if (error.response?.status != null) {
      return mensagemPorStatus(error.response.status);
    }

    if (error.message?.trim()) {
      return error.message.trim();
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return FALLBACK;
}
