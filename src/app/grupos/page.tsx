'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { gruposService } from '@/services/grupos';
import { permissoesService } from '@/services/permissoes';
import { AppMessages, notifyApiError, notifyError, notifySuccess } from '@/lib/notify';
import { podeGerenciarGrupos, podeListarGrupos } from '@/lib/permissions';
import type { Grupo, GrupoInput, Permissao, PermissaoArvoreNodeModel } from '@/types/api';
import {
  ListagemTitulo,
  ListagemBar,
  ListagemTable,
  ListagemPanel,
  ListagemPageWrapper,
  ListagemPagination,
} from '@/components/listagem';
import type { Coluna } from '@/components/listagem';
import { ConfirmModal } from '@/components/ConfirmModal';
import { PermissaoTree } from '@/components/PermissaoTree';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  CHAVES_MINIMAS_PROPRIO_GRUPO,
  usuarioEditaProprioGrupo,
} from '@/lib/grupoPermissoesProprias';
import listagemStyles from '@/components/listagem/listagem.module.css';
import modalStyles from './GrupoFormModal.module.css';

const DEFAULT_PAGE_SIZE = 5;

const COLUNAS: Coluna<Grupo>[] = [
  { key: 'nome', label: 'Nome' },
  {
    key: 'permissoes',
    label: 'Permissões',
    render: (g) => {
      const qtd = g.permissoes?.length ?? 0;
      if (qtd === 0) return '—';
      return qtd === 1 ? '1 permissão' : `${qtd} permissões`;
    },
  },
];

export default function GruposPage() {
  const { user, isAuthenticated, loading: authLoading, refreshSession } = useAuth();
  const podeListar = podeListarGrupos(user);
  const podeGerenciar = podeGerenciarGrupos(user);

  const [lista, setLista] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCodigo, setEditCodigo] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [nomeOriginal, setNomeOriginal] = useState('');
  const [arvorePermissoes, setArvorePermissoes] = useState<PermissaoArvoreNodeModel[]>([]);
  const [chavesSelecionadas, setChavesSelecionadas] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingExcluir, setPendingExcluir] = useState<Grupo | null>(null);
  const permissoesDirtyRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBuscaDebounced(busca);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [busca]);

  const loadData = useCallback(() => {
    if (!isAuthenticated || !podeListar) return;
    setLoading(true);
    gruposService
      .listar({ busca: buscaDebounced, page, size: pageSize })
      .then((res) => {
        setLista(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 0);
        setTotalElements(res.data.totalElements ?? 0);
      })
      .catch((err) => {
        setLista([]);
        setTotalPages(0);
        setTotalElements(0);
        notifyApiError(err, { toastId: 'grupos-erro-lista' });
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, podeListar, buscaDebounced, page, pageSize]);

  const alterarTamanhoPagina = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (!podeListar) {
      setLoading(false);
      setLista([]);
      return;
    }
    loadData();
  }, [authLoading, isAuthenticated, podeListar, loadData]);

  useEffect(() => {
    if (!modalOpen) {
      permissoesDirtyRef.current = false;
      return;
    }
    permissoesDirtyRef.current = false;
    permissoesService
      .arvore()
      .then((res) => setArvorePermissoes(res.data ?? []))
      .catch(() => setArvorePermissoes([]));
    if (editCodigo) {
      gruposService
        .listarPermissoes(editCodigo)
        .then((res) => {
          if (permissoesDirtyRef.current) return;
          const data = res.data;
          const arr: Permissao[] = Array.isArray(data)
            ? data
            : data && typeof data === 'object'
              ? (Object.values(data) as Permissao[])
              : [];
          const chavesSet = new Set(arr.map((p) => p.chave).filter((c): c is string => Boolean(c)));
          if (usuarioEditaProprioGrupo(editCodigo, user?.gruposCodigos, user?.roles, nomeOriginal || nome)) {
            for (const c of CHAVES_MINIMAS_PROPRIO_GRUPO) chavesSet.add(c);
          }
          setChavesSelecionadas(chavesSet);
        })
        .catch(() => notifyError(AppMessages.grupo.erroCarregarPermissoes));
      gruposService
        .buscar(editCodigo)
        .then((res) => {
          const n = res.data.nome ?? '';
          setNome(n);
          setNomeOriginal(n);
        })
        .catch(() => notifyError(AppMessages.grupo.erroCarregarGrupo));
    } else {
      setNome('');
      setNomeOriginal('');
      setChavesSelecionadas(new Set());
    }
  }, [modalOpen, editCodigo, user?.gruposCodigos]);

  const fecharModal = () => {
    if (formLoading) return;
    setModalOpen(false);
    setEditCodigo(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: GrupoInput = { nome: nome.trim() };
    if (!payload.nome) {
      notifyError(AppMessages.validacao.campoObrigatorio('o nome do grupo'));
      return;
    }
    if (chavesSelecionadas.size === 0) {
      notifyError(AppMessages.validacao.selecionePermissaoGrupo);
      return;
    }
    const editandoProprioGrupo = usuarioEditaProprioGrupo(
      editCodigo,
      user?.gruposCodigos,
      user?.roles,
      nomeOriginal || nome
    );
    const chavesParaSalvar = [...chavesSelecionadas];
    if (editandoProprioGrupo) {
      for (const c of CHAVES_MINIMAS_PROPRIO_GRUPO) {
        if (!chavesParaSalvar.includes(c)) chavesParaSalvar.push(c);
      }
    }
    setFormLoading(true);
    const nomeAlterado = Boolean(editCodigo) && nome.trim() !== nomeOriginal.trim();
    const salvarFluxo = async () => {
      let codigoGrupo = editCodigo!;
      if (!editCodigo) {
        const res = await gruposService.criar(payload);
        codigoGrupo = res.data.codigo;
      } else if (nomeAlterado) {
        await gruposService.atualizar(editCodigo, payload);
      }
      await gruposService.substituirPermissoesPorChaves(codigoGrupo, chavesParaSalvar);
      if (
        editandoProprioGrupo ||
        usuarioEditaProprioGrupo(codigoGrupo, user?.gruposCodigos, user?.roles, nomeOriginal || nome)
      ) {
        await refreshSession();
      }
      return codigoGrupo;
    };
    salvarFluxo()
      .then((codigoGrupo) => {
        notifySuccess(AppMessages.grupo.salvo(Boolean(editCodigo)));
        if (!editCodigo) {
          setEditCodigo(codigoGrupo);
          setNomeOriginal(nome.trim());
        } else if (nomeAlterado) {
          setNomeOriginal(nome.trim());
        }
        loadData();
      })
      .catch((err) => notifyApiError(err))
      .finally(() => setFormLoading(false));
  };

  const handleExcluir = (item: Grupo) => {
    setPendingExcluir(item);
    setConfirmOpen(true);
  };

  const handleConfirmExcluir = () => {
    if (!pendingExcluir) return;
    gruposService
      .excluir(pendingExcluir.codigo)
      .then(() => {
        notifySuccess(AppMessages.grupo.excluido);
        loadData();
      })
      .catch((err) => notifyApiError(err))
      .finally(() => {
        setConfirmOpen(false);
        setPendingExcluir(null);
      });
  };

  const filtrada = lista;

  if (!authLoading && isAuthenticated && !podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Grupos" />
        <p className={listagemStyles.empty}>
          Você não tem permissão para listar grupos. Solicite ao administrador a permissão &quot;Listar
          grupos&quot;.
        </p>
      </ListagemPageWrapper>
    );
  }

  const tituloModal = editCodigo ? 'Editar grupo' : 'Cadastrar grupo';
  const subtituloModal = editCodigo
    ? 'Atualize o nome e ajuste as permissões vinculadas a este perfil de acesso.'
    : 'Informe o nome do grupo e selecione as permissões que os usuários deste perfil terão no sistema.';

  const editandoProprioGrupo = usuarioEditaProprioGrupo(
    editCodigo,
    user?.gruposCodigos,
    user?.roles,
    nomeOriginal || nome
  );
  const chavesFixasProprioGrupo = editandoProprioGrupo
    ? new Set<string>(CHAVES_MINIMAS_PROPRIO_GRUPO)
    : undefined;

  return (
    <>
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Grupos" />
        <ListagemBar
          searchPlaceholder="Busque pelo nome do grupo"
          searchValue={busca}
          onSearchChange={setBusca}
          onLimparFiltros={() => {
            setBusca('');
            setPage(0);
          }}
          onCadastrar={
            podeGerenciar
              ? () => {
                  setEditCodigo(null);
                  setModalOpen(true);
                }
              : undefined
          }
          labelCadastrar="Cadastrar"
        />
        {loading && <LoadingSpinner label="Carregando grupos..." />}
        {!loading && (
          <ListagemPanel>
            <ListagemTable
              colunas={COLUNAS}
              dados={filtrada}
              rowKey={(g) => g.codigo}
              onEditar={
                podeGerenciar
                  ? (g) => {
                      setEditCodigo(g.codigo);
                      setModalOpen(true);
                    }
                  : undefined
              }
              onExcluir={podeGerenciar ? handleExcluir : undefined}
              emptyMessage="Nenhum grupo encontrado."
            />
            <ListagemPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={pageSize}
              resourceLabel="grupos"
              onPageChange={setPage}
              onSizeChange={alterarTamanhoPagina}
            />
          </ListagemPanel>
        )}

        {modalOpen && podeGerenciar && (
          <div className="modalOverlay" role="presentation">
            <div
              className={`modalContent ${modalStyles.shell}`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="grupo-modal-title"
            >
              <header className={modalStyles.header}>
                <div className={modalStyles.headerText}>
                  <h2 id="grupo-modal-title">{tituloModal}</h2>
                  <p className={modalStyles.subtitle}>{subtituloModal}</p>
                </div>
                <button
                  type="button"
                  className="modalGlobalCloseBtn"
                  onClick={fecharModal}
                  aria-label="Fechar"
                  disabled={formLoading}
                >
                  <X size={18} strokeWidth={2} aria-hidden />
                </button>
              </header>

              <form onSubmit={handleSubmit} className={modalStyles.form}>
                <div className={modalStyles.body}>
                  <section className={modalStyles.section}>
                    <h3 className={modalStyles.sectionTitle}>Identificação</h3>
                    <label className={modalStyles.label} htmlFor="grupo-nome">
                      Nome do grupo *
                    </label>
                    <input
                      id="grupo-nome"
                      type="text"
                      required
                      className={modalStyles.input}
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex.: Analista, Coordenador..."
                      autoComplete="off"
                    />
                  </section>

                  <section className={modalStyles.permissionsSection}>
                    <h3 className={modalStyles.sectionTitle}>Permissões de acesso</h3>
                    {editandoProprioGrupo && (
                      <p className={modalStyles.loadingHint} style={{ marginBottom: '0.75rem' }}>
                        Você está editando o grupo do seu usuário. Permissões de administração de grupos
                        (menu, listar, editar, gerenciar permissões) não podem ser removidas aqui — outro
                        administrador pode alterá-las se necessário.
                      </p>
                    )}
                    {arvorePermissoes.length > 0 ? (
                      <PermissaoTree
                        arvore={arvorePermissoes}
                        selecionadas={chavesSelecionadas}
                        chavesFixas={chavesFixasProprioGrupo}
                        onChange={(chaves) => {
                          permissoesDirtyRef.current = true;
                          setChavesSelecionadas(chaves);
                        }}
                      />
                    ) : (
                      <p className={modalStyles.loadingHint}>Carregando árvore de permissões...</p>
                    )}
                  </section>
                </div>

                <div className={`modalActions ${modalStyles.footer}`}>
                  <button
                    type="button"
                    className="modalBtnSecondary"
                    onClick={fecharModal}
                    disabled={formLoading}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="modalBtnPrimary" disabled={formLoading}>
                    {formLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </ListagemPageWrapper>
      <ConfirmModal
        open={confirmOpen}
        title="Confirmar exclusão"
        message="Excluir este grupo?"
        confirmLabel="Excluir"
        onConfirm={handleConfirmExcluir}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingExcluir(null);
        }}
        variant="danger"
      />
    </>
  );
}
