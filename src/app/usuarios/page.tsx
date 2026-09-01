'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppMessages, notifyApiError, notifySuccess } from '@/lib/notify';
import { formatCpf, onlyDigits } from '@/lib/masks';
import { podeGerenciarUsuarios, podeListarUsuarios } from '@/lib/permissions';
import { usuariosService } from '@/services/usuarios';
import type { UsuarioInput, UsuarioLocal } from '@/types/api';
import {
  ListagemTitulo,
  ListagemBar,
  ListagemTable,
  ListagemPanel,
  ListagemPageWrapper,
  ListagemPagination,
  ListagemSwitch,
} from '@/components/listagem';
import type { Coluna } from '@/components/listagem';
import { StatusAtivoChip } from '@/components/StatusAtivoChip';
import { ModalCloseButton } from '@/components/ModalCloseButton';
import { UsuarioGruposModal } from '@/components/UsuarioGruposModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import cadastroStyles from './usuarios.module.css';

const DEFAULT_PAGE_SIZE = 5;

const FORM_INICIAL: UsuarioInput = {
  nome: '',
  cpf: '',
  email: '',
  senha: '',
  cargo: '',
  ativo: true,
};

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarUsuarios(user);
  const podeGerenciar = podeGerenciarUsuarios(user);

  const [usuarios, setUsuarios] = useState<UsuarioLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
  const [editCodigo, setEditCodigo] = useState<string | null>(null);
  const [modalGruposOpen, setModalGruposOpen] = useState(false);
  const [usuarioGrupos, setUsuarioGrupos] = useState<UsuarioLocal | null>(null);
  const [form, setForm] = useState<UsuarioInput>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [atualizandoAtivo, setAtualizandoAtivo] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBuscaDebounced(busca);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [busca]);

  const loadData = useCallback(() => {
    if (!podeListar) return;
    setLoading(true);
    usuariosService
      .listar({ busca: buscaDebounced, page, size: pageSize })
      .then((r) => {
        setUsuarios(r.data.content ?? []);
        setTotalPages(r.data.totalPages ?? 0);
        setTotalElements(r.data.totalElements ?? 0);
      })
      .catch((err) => {
        notifyApiError(err, { toastId: 'usuarios-erro-lista' });
        setUsuarios([]);
        setTotalPages(0);
        setTotalElements(0);
      })
      .finally(() => setLoading(false));
  }, [podeListar, buscaDebounced, page, pageSize]);

  const alterarTamanhoPagina = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!podeListar) {
      setLoading(false);
      return;
    }
    loadData();
  }, [authLoading, podeListar, loadData]);

  const alterarAtivo = useCallback(
    async (usuario: UsuarioLocal, ativo: boolean) => {
      setAtualizandoAtivo(usuario.codigo);
      try {
        await usuariosService.atualizarAtivo(usuario.codigo, ativo);
        loadData();
      } catch (err) {
        notifyApiError(err);
      } finally {
        setAtualizandoAtivo(null);
      }
    },
    [loadData]
  );

  const colunas: Coluna<UsuarioLocal>[] = useMemo(
    () => [
      { key: 'nome', label: 'Nome' },
      {
        key: 'cpf',
        label: 'CPF',
        render: (u) => formatCpf(u.cpf),
      },
      {
        key: 'email',
        label: 'E-mail',
        render: (u) => u.email ?? '—',
      },
      {
        key: 'cargo',
        label: 'Cargo',
        render: (u) => u.cargo ?? '—',
      },
      {
        key: 'ativo',
        label: 'Status',
        render: (u) =>
          podeGerenciar ? (
            <ListagemSwitch
              checked={Boolean(u.ativo)}
              disabled={atualizandoAtivo === u.codigo}
              aria-label={u.ativo ? 'Inativar usuário' : 'Ativar usuário'}
              onChange={(checked) => void alterarAtivo(u, checked)}
            />
          ) : (
            <StatusAtivoChip ativo={Boolean(u.ativo)} />
          ),
      },
    ],
    [atualizandoAtivo, podeGerenciar, alterarAtivo]
  );

  const abrirCadastro = () => {
    setEditCodigo(null);
    setForm(FORM_INICIAL);
    setModalCadastroOpen(true);
  };

  const abrirEdicao = (usuario: UsuarioLocal) => {
    setEditCodigo(usuario.codigo);
    setForm({
      nome: usuario.nome ?? '',
      cpf: formatCpf(usuario.cpf ?? ''),
      email: usuario.email ?? '',
      senha: '',
      cargo: usuario.cargo ?? '',
      ativo: usuario.ativo ?? true,
    });
    setModalCadastroOpen(true);
  };

  const fecharModalCadastro = () => {
    setModalCadastroOpen(false);
    setEditCodigo(null);
    setForm(FORM_INICIAL);
  };

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.cpf.trim() || !form.email.trim()) {
      return;
    }
    if (!editCodigo && !form.senha?.trim()) {
      return;
    }
    setSalvando(true);
    try {
      const payload: UsuarioInput = {
        nome: form.nome.trim(),
        cpf: onlyDigits(form.cpf),
        email: form.email.trim(),
        cargo: form.cargo?.trim() || null,
        ativo: form.ativo ?? true,
      };
      if (form.senha?.trim()) {
        payload.senha = form.senha;
      }
      if (editCodigo) {
        await usuariosService.atualizar(editCodigo, payload);
        notifySuccess(AppMessages.usuario.atualizado);
      } else {
        await usuariosService.cadastrar(payload);
        notifySuccess(AppMessages.usuario.cadastrado);
      }
      fecharModalCadastro();
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSalvando(false);
    }
  };

  const abrirGrupos = (usuario: UsuarioLocal) => {
    setUsuarioGrupos(usuario);
    setModalGruposOpen(true);
  };

  if (authLoading) {
    return <LoadingSpinner fullPage label="Carregando..." />;
  }

  if (!authLoading && !podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Usuários" />
        <p className="emptyState">
          Você não tem permissão para listar usuários. Solicite ao administrador a permissão &quot;Listar
          usuários&quot;.
        </p>
        <button type="button" className="modalBtnSecondary" onClick={() => router.replace('/home')}>
          Voltar ao início
        </button>
      </ListagemPageWrapper>
    );
  }

  return (
    <>
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Usuários" />
        <ListagemBar
          searchPlaceholder="Busque por nome ou CPF"
          searchValue={busca}
          onSearchChange={setBusca}
          onLimparFiltros={() => {
            setBusca('');
            setPage(0);
          }}
          onCadastrar={podeGerenciar ? abrirCadastro : undefined}
          labelCadastrar="Cadastrar usuário"
        />

        {loading && <LoadingSpinner label="Carregando usuários..." />}

        {!loading && (
          <ListagemPanel>
            <ListagemTable
              colunas={colunas}
              dados={usuarios}
              rowKey={(u) => u.codigo}
              onEditar={podeGerenciar ? abrirEdicao : undefined}
              acoesExtra={
                podeGerenciar
                  ? [
                      {
                        label: 'Perfil',
                        icon: <KeyRound size={14} />,
                        onClick: abrirGrupos,
                      },
                    ]
                  : undefined
              }
              emptyMessage="Nenhum usuário cadastrado. Use Cadastrar usuário para adicionar."
            />
            <ListagemPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={pageSize}
              resourceLabel="usuários"
              onPageChange={setPage}
              onSizeChange={alterarTamanhoPagina}
            />
          </ListagemPanel>
        )}
      </ListagemPageWrapper>

      {modalCadastroOpen && podeGerenciar && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton
              onClose={fecharModalCadastro}
              disabled={salvando}
            />
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 600, paddingRight: '2.5rem' }}>
              {editCodigo ? 'Editar usuário' : 'Cadastrar usuário'}
            </h2>
            <form onSubmit={(e) => void cadastrar(e)}>
              <div className="modalFormRow">
                <label htmlFor="usuario-nome">Nome</label>
                <input
                  id="usuario-nome"
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  required
                />
              </div>
              <div className="modalFormRow">
                <label htmlFor="usuario-cpf">CPF</label>
                <input
                  id="usuario-cpf"
                  type="text"
                  value={form.cpf}
                  onChange={(e) => setForm((f) => ({ ...f, cpf: formatCpf(e.target.value) }))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  readOnly={Boolean(editCodigo)}
                  disabled={Boolean(editCodigo)}
                />
              </div>
              <div className="modalFormRow">
                <label htmlFor="usuario-email">E-mail</label>
                <input
                  id="usuario-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="modalFormRow">
                <label htmlFor="usuario-senha">{editCodigo ? 'Nova senha (opcional)' : 'Senha'}</label>
                <input
                  id="usuario-senha"
                  type="password"
                  value={form.senha ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  minLength={8}
                  required={!editCodigo}
                  autoComplete="new-password"
                  data-no-uppercase
                />
              </div>
              <div className="modalFormRow">
                <label htmlFor="usuario-cargo">Cargo</label>
                <input
                  id="usuario-cargo"
                  type="text"
                  value={form.cargo ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
                />
              </div>
              <div className={`modalActions ${cadastroStyles.actions}`}>
                <button
                  type="button"
                  className="modalBtnSecondary"
                  onClick={fecharModalCadastro}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button type="submit" className="modalBtnPrimary" disabled={salvando}>
                  {salvando ? 'Salvando...' : editCodigo ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {podeGerenciar && (
        <UsuarioGruposModal
          open={modalGruposOpen}
          usuario={usuarioGrupos}
          onClose={() => {
            setModalGruposOpen(false);
            setUsuarioGrupos(null);
          }}
          onSaved={loadData}
        />
      )}
    </>
  );
}
