'use client';

import { useState, useMemo } from 'react';
import { Lock, Eye, EyeOff, Check, CircleX } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/apiError';
import { AppMessages, notifyError, notifySuccess } from '@/lib/notify';
import { usuariosService } from '@/services/usuarios';
import styles from './AlterarSenhaModal.module.css';

const PLACEHOLDER_SENHA = 'digite aqui a sua senha';

const REGRAS = [
  { id: 'min8', test: (s: string) => s.length >= 8, label: 'A senha deve ter mínimo 8.' },
  { id: 'maiuscula', test: (s: string) => /[A-Z]/.test(s), label: 'A senha deve ter pelo menos uma letra maiúscula.' },
  { id: 'minuscula', test: (s: string) => /[a-z]/.test(s), label: 'A senha deve ter pelo menos uma letra minúscula.' },
  {
    id: 'simbolo',
    test: (s: string) => /[!@#$%^&*()+=\-[\]{}|;:'",.<>?/\\`~]/.test(s),
    label: 'A senha deve ter pelo menos um símbolo. Ex: * ! # $ % & + - / : ; = ? @ \\ |',
  },
  { id: 'numero', test: (s: string) => /[0-9]/.test(s), label: 'A senha deve ter pelo menos um número.' },
] as const;

interface AlterarSenhaModalProps {
  codigoUsuario: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AlterarSenhaModal({ codigoUsuario, onClose, onSuccess }: AlterarSenhaModalProps) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const regrasNovaSenha = useMemo(
    () => REGRAS.map((r) => ({ ...r, ok: r.test(novaSenha) })),
    [novaSenha]
  );
  const todasRegrasOk = regrasNovaSenha.every((r) => r.ok);
  const senhasIguais = novaSenha.length > 0 && novaSenha === confirmarSenha;
  const podeEnviar = senhaAtual.trim() !== '' && todasRegrasOk && senhasIguais && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!podeEnviar) return;
    setLoading(true);
    try {
      await usuariosService.alterarSenha(codigoUsuario, {
        senhaAtual: senhaAtual.trim(),
        novaSenha,
      });
      notifySuccess(AppMessages.usuario.senhaAtualizada);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      setErro(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={() => !loading && onClose()}>
      <div className={`modalContent ${styles.modalSenha}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>ALTERAR SENHA</h2>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="senha-atual">* Senha atual:</label>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} aria-hidden />
                <input
                  id="senha-atual"
                  type={showAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder={PLACEHOLDER_SENHA}
                  autoComplete="current-password"
                  className={`${styles.input} modalInputNormalCase`}
                  data-no-uppercase
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowAtual((s) => !s)}
                  aria-label={showAtual ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {showAtual ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="nova-senha">* Nova senha:</label>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} aria-hidden />
                <input
                  id="nova-senha"
                  type={showNova ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder={PLACEHOLDER_SENHA}
                  autoComplete="new-password"
                  className={`${styles.input} modalInputNormalCase`}
                  data-no-uppercase
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowNova((s) => !s)}
                  aria-label={showNova ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {showNova ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmar-senha">* Confirme a nova senha:</label>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} aria-hidden />
                <input
                  id="confirmar-senha"
                  type={showConfirmar ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder={PLACEHOLDER_SENHA}
                  autoComplete="new-password"
                  className={`${styles.input} modalInputNormalCase`}
                  data-no-uppercase
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirmar((s) => !s)}
                  aria-label={showConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {showConfirmar ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmarSenha.length > 0 && confirmarSenha !== novaSenha && (
                <p className={styles.confirmarErro} role="alert">
                  A senha não é a mesma informada em *Nova Senha!
                </p>
              )}
            </div>

            <ul className={styles.regras} aria-label="Requisitos da nova senha">
              {regrasNovaSenha.map((r) => (
                <li key={r.id} className={r.ok ? styles.regraOk : styles.regraFalha}>
                  {r.ok ? (
                    <Check size={18} className={styles.regraIcon} aria-hidden />
                  ) : (
                    <CircleX size={18} className={styles.regraIcon} aria-hidden />
                  )}
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {erro && <p className={styles.erro}>{erro}</p>}

          <div className={`modalActions ${styles.formActions}`}>
            <button
              type="button"
              className="modalBtnSecondary"
              onClick={() => !loading && onClose()}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="modalBtnPrimary" disabled={!podeEnviar}>
              {loading ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
