import { toast, type ToastOptions } from 'react-toastify';
import {
  getApiErrorMessage,
  isSilentForbiddenApiError,
  isUnauthorizedApiError,
} from '@/lib/apiError';

const DEFAULT_OPTS: ToastOptions = { hideProgressBar: true };

/** Mensagens padronizadas de sucesso, aviso e validação client-side. */
export const AppMessages = {
  validacao: {
    campoObrigatorio: (campo: string) => `Informe ${campo}.`,
    selecionePermissaoGrupo: 'Selecione ao menos uma permissão para o grupo.',
  },
  grupo: {
    salvo: (editando: boolean) =>
      editando ? 'Grupo atualizado com sucesso.' : 'Grupo cadastrado com sucesso.',
    excluido: 'Grupo excluído com sucesso.',
    erroCarregarLista: 'Não foi possível carregar a lista de grupos.',
    erroCarregarPermissoes: 'Não foi possível carregar as permissões do grupo.',
    erroCarregarGrupo: 'Não foi possível carregar os dados do grupo.',
  },
  usuario: {
    cadastrado: 'Usuário cadastrado com sucesso.',
    atualizado: 'Usuário atualizado com sucesso.',
    excluido: 'Usuário excluído com sucesso.',
    gruposAtualizados: 'Perfil do usuário atualizado com sucesso.',
    senhaAtualizada: 'Senha atualizada com sucesso.',
    semPermissaoGestao:
      'Você não tem permissão para acessar a gestão de usuários. Solicite ao administrador.',
    semPermissaoAcao:
      'Você não tem permissão para esta ação. Solicite ao administrador.',
  },
  musico: {
    salvo: (editando: boolean) =>
      editando ? 'Músico atualizado com sucesso.' : 'Músico cadastrado com sucesso.',
    ativoAtualizado: (ativo: boolean) =>
      ativo ? 'Músico ativado com sucesso.' : 'Músico inativado com sucesso.',
    erroCarregarLista: 'Não foi possível carregar a lista de músicos.',
    erroCarregar: 'Não foi possível carregar os dados do músico.',
  },
  instrumento: {
    salvo: (editando: boolean) =>
      editando ? 'Instrumento atualizado com sucesso.' : 'Instrumento cadastrado com sucesso.',
    ativoAtualizado: (ativo: boolean) =>
      ativo ? 'Instrumento ativado com sucesso.' : 'Instrumento inativado com sucesso.',
    excluido: 'Instrumento excluído com sucesso.',
    inativadoPorVinculo: 'Instrumento inativado porque já está vinculado a músicos.',
  },
  local: {
    salvo: (editando: boolean) =>
      editando ? 'Local atualizado com sucesso.' : 'Local cadastrado com sucesso.',
    ativoAtualizado: (ativo: boolean) =>
      ativo ? 'Local ativado com sucesso.' : 'Local inativado com sucesso.',
    excluido: 'Local excluído com sucesso.',
  },
  celebracao: {
    salvo: (editando: boolean) =>
      editando ? 'Celebração atualizada com sucesso.' : 'Celebração cadastrada com sucesso.',
    excluido: 'Celebração excluída com sucesso.',
  },
  escala: {
    salvo: (editando: boolean) =>
      editando ? 'Escala atualizada com sucesso.' : 'Escala montada com sucesso.',
    copiada: 'Equipe copiada com sucesso.',
    duplicada: 'Escala anterior duplicada com sucesso.',
    excluido: 'Equipe da escala removida. O histórico foi preservado.',
    publicada: (versao: number, competencia: string) =>
      `Escalas de ${competencia} publicadas (versão ${versao}).`,
  },
  repertorio: {
    salvo: (editando: boolean) =>
      editando ? 'Repertório atualizado com sucesso.' : 'Repertório montado com sucesso.',
    excluido: 'Músicas do repertório removidas. O histórico foi preservado.',
  },
  musica: {
    salvo: (editando: boolean) =>
      editando ? 'Música atualizada com sucesso.' : 'Música cadastrada com sucesso.',
    ativoAtualizado: (ativo: boolean) =>
      ativo ? 'Música ativada com sucesso.' : 'Música inativada com sucesso.',
    excluido: 'Música excluída com sucesso.',
  },
  whatsapp: {
    reenviado: 'Envio reencaminhado para a fila.',
    reenviadosLote: (qtd: number) =>
      qtd === 1
        ? '1 envio pendente/com erro foi reenviado.'
        : `${qtd} envios pendentes/com erro foram reenviados.`,
    lembretesEnfileirados: (qtd: number) =>
      qtd === 1
        ? '1 lembrete foi enfileirado.'
        : `${qtd} lembretes foram enfileirados.`,
    alteracoesComunicadas: (qtd: number) =>
      qtd === 1
        ? '1 alteração foi enfileirada para o WhatsApp.'
        : `${qtd} alterações foram enfileiradas para o WhatsApp.`,
    erroCarregarLista: 'Não foi possível carregar o histórico de envios.',
    erroCarregar: 'Não foi possível carregar o envio.',
  },
  auth: {
    recuperarSenhaFalha:
      'Não foi possível solicitar a recuperação de senha. Tente novamente mais tarde.',
  },
} as const;

export function notifySuccess(message: string, options?: ToastOptions): void {
  toast.success(message, { ...DEFAULT_OPTS, ...options });
}

export function notifyError(message: string, options?: ToastOptions): void {
  toast.error(message, { ...DEFAULT_OPTS, ...options });
}

export function notifyInfo(message: string, options?: ToastOptions): void {
  toast.info(message, { ...DEFAULT_OPTS, ...options });
}

export function notifyWarning(message: string, options?: ToastOptions): void {
  toast.warning(message, { ...DEFAULT_OPTS, ...options });
}

/** Exibe toast de erro da API, ignorando 401 (logout) e 403 silencioso. */
export function notifyApiError(error: unknown, options?: ToastOptions): void {
  if (isSilentForbiddenApiError(error) || isUnauthorizedApiError(error)) return;
  notifyError(getApiErrorMessage(error), options);
}
