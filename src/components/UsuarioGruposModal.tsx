'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppMessages, notifyApiError, notifySuccess } from '@/lib/notify';
import { gruposService } from '@/services/grupos';
import { usuariosService } from '@/services/usuarios';
import type { Grupo, UsuarioLocal } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { ModalCloseButton } from '@/components/ModalCloseButton';
import styles from './UsuarioGruposModal.module.css';

interface UsuarioGruposModalProps {
  open: boolean;
  usuario: UsuarioLocal | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function UsuarioGruposModal({ open, usuario, onClose, onSaved }: UsuarioGruposModalProps) {
  const { user, refreshSession } = useAuth();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const loadData = useCallback(() => {
    if (!usuario) return;
    setLoading(true);
    Promise.all([gruposService.listar({ size: 500 }), usuariosService.buscar(usuario.codigo)])
      .then(([gruposRes, usuarioRes]) => {
        setGrupos(gruposRes.data.content ?? []);
        const vinculado = (usuarioRes.data.grupos ?? [])[0]?.codigo ?? '';
        setGrupoSelecionado(vinculado);
      })
      .catch((err) => {
        notifyApiError(err);
        setGrupos([]);
        setGrupoSelecionado('');
      })
      .finally(() => setLoading(false));
  }, [usuario]);

  useEffect(() => {
    if (open && usuario) {
      loadData();
    } else if (!open) {
      setGrupos([]);
      setGrupoSelecionado('');
      setLoading(false);
      setSalvando(false);
    }
  }, [open, usuario, loadData]);

  const salvar = async () => {
    if (!usuario) return;
    setSalvando(true);
    try {
      const gruposIds = grupoSelecionado ? [grupoSelecionado] : [];
      await usuariosService.atribuirGrupos(usuario.id, gruposIds);
      if (user?.codigo && user.codigo === usuario.codigo) {
        await refreshSession();
      }
      notifySuccess(AppMessages.usuario.gruposAtualizados);
      onSaved?.();
      onClose();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSalvando(false);
    }
  };

  if (!open || !usuario) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className={`modalContent ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        <ModalCloseButton onClose={onClose} disabled={salvando} />
        <h2 className={styles.title}>Perfil do usuário</h2>
        <p className={styles.subtitle}>
          <strong>{usuario.nome}</strong> — selecione o perfil (grupo) de permissões no BRMusics. Cada usuário
          possui apenas um perfil.
        </p>

        {loading ? (
          <p className="loadingState">Carregando...</p>
        ) : (
          <label className={styles.field} htmlFor="usuario-grupo-perfil">
            <span className={styles.fieldLabel}>Perfil</span>
            <select
              id="usuario-grupo-perfil"
              className={styles.select}
              value={grupoSelecionado}
              onChange={(e) => setGrupoSelecionado(e.target.value)}
              disabled={salvando}
            >
              <option value="">Nenhum (sem acesso)</option>
              {grupos.map((g) => (
                <option key={g.codigo} value={g.codigo}>
                  {g.nome}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className={`modalActions ${styles.actions}`}>
          <button type="button" className="modalBtnSecondary" onClick={onClose} disabled={salvando}>
            Cancelar
          </button>
          <button type="button" className="modalBtnPrimary" onClick={() => void salvar()} disabled={salvando || loading}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
