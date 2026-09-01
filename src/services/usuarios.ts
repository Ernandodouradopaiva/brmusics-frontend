import { api, publicApi } from '@/lib/api';
import type {
  PageResponse,
  RecuperarSenhaInput,
  SenhaInput,
  SenhaTemporariaResponse,
  UsuarioInput,
  UsuarioLocal,
} from '@/types/api';

export type ListarUsuariosParams = {
  busca?: string;
  nome?: string;
  cpf?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export const usuariosService = {
  listar(params?: ListarUsuariosParams) {
    return api.get<PageResponse<UsuarioLocal>>('/usuarios', {
      params: {
        size: 5,
        page: 0,
        sort: 'nome',
        ...params,
        busca: params?.busca?.trim() || undefined,
      },
    });
  },
  buscar(codigo: string) {
    return api.get<UsuarioLocal>(`/usuarios/${codigo}`);
  },
  cadastrar(body: UsuarioInput) {
    return api.post<UsuarioLocal>('/usuarios', body);
  },
  atualizar(codigo: string, body: UsuarioInput) {
    return api.put<UsuarioLocal>(`/usuarios/${codigo}`, body);
  },
  excluir(codigo: string) {
    return api.delete(`/usuarios/${codigo}`);
  },
  atribuirGrupos(usuarioId: number, gruposIds: string[]) {
    return api.put<UsuarioLocal>(`/usuarios/${usuarioId}/grupos`, { gruposIds });
  },
  atualizarAtivo(codigo: string, ativo: boolean) {
    return api.put<UsuarioLocal>(`/usuarios/${codigo}/ativo`, { ativo });
  },
  alterarSenha(codigo: string, body: SenhaInput) {
    return api.put(`/usuarios/${codigo}/alterar-senha`, body);
  },
  recuperarSenha(body: RecuperarSenhaInput) {
    return publicApi.put<SenhaTemporariaResponse>('/usuarios/recuperar-senha', body);
  },
};
