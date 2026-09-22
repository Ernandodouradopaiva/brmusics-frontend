import { api } from '@/lib/api';
import { normalizeApiError } from '@/lib/apiError';
import type { CategoriaLiturgica, Musica, MusicaInput, PageResponse } from '@/types/api';

export type ListarMusicasParams = {
  /** Busca unificada: título, trecho da letra, autor ou intérprete. */
  termo?: string;
  titulo?: string;
  autor?: string;
  categoria?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

export const musicasService = {
  listar(params?: ListarMusicasParams) {
    return api.get<PageResponse<Musica>>('/musicas', {
      params: {
        size: 5,
        page: 0,
        sort: 'titulo',
        ...params,
        termo: params?.termo?.trim() || undefined,
        titulo: params?.titulo?.trim() || undefined,
        autor: params?.autor?.trim() || undefined,
        categoria: params?.categoria || undefined,
      },
    });
  },
  categorias() {
    return api.get<CategoriaLiturgica[]>('/musicas/categorias');
  },
  async exportarCsv(): Promise<Blob> {
    try {
      const response = await api.get<Blob>('/musicas/exportacao.csv', {
        responseType: 'blob',
      });
      const blob = response.data;
      if (!blob || blob.size === 0) {
        throw new Error('A exportação retornou vazia. Tente novamente.');
      }
      const type = (blob.type || '').toLowerCase();
      if (type.includes('json') || type.includes('html')) {
        const text = await blob.text();
        let msg = 'Não foi possível exportar as músicas.';
        try {
          const json = JSON.parse(text) as { userMessage?: string; message?: string; detail?: string };
          msg = json.userMessage?.trim() || json.detail?.trim() || json.message?.trim() || msg;
        } catch {
          if (text.trim()) msg = text.trim();
        }
        throw new Error(msg);
      }
      return blob;
    } catch (err) {
      throw await normalizeApiError(err);
    }
  },
  buscar(codigo: string) {
    return api.get<Musica>(`/musicas/${codigo}`);
  },
  criar(body: MusicaInput) {
    return api.post<Musica>('/musicas', body);
  },
  atualizar(codigo: string, body: MusicaInput) {
    return api.put<Musica>(`/musicas/${codigo}`, body);
  },
  atualizarAtivo(codigo: string, ativo: boolean) {
    return api.put<Musica>(`/musicas/${codigo}/ativo`, { ativo });
  },
  excluir(codigo: string) {
    return api.delete(`/musicas/${codigo}`);
  },
};
