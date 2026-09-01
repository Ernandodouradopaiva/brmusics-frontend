'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Music, User } from 'lucide-react';
import { usuariosService } from '@/services/usuarios';
import PublicBrandShell from '@/app/login/components/PublicBrandShell';
import { formatCpf, onlyDigits } from '@/lib/masks';
import { getApiErrorMessage } from '@/lib/apiError';
import { AppMessages } from '@/lib/notify';
import styles from '@/app/login/login.module.css';

export default function RecuperarSenhaPage() {
  const [fontSize, setFontSize] = useState(1);
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [senhaTemporaria, setSenhaTemporaria] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSenhaTemporaria('');
    setLoading(true);
    try {
      const res = await usuariosService.recuperarSenha({
        cpf: onlyDigits(cpf),
        email: email.trim(),
      });
      setSenhaTemporaria(res.data.senhaTemporaria);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || AppMessages.auth.recuperarSenhaFalha);
    } finally {
      setLoading(false);
    }
  }

  const titleSize = 24;
  const descSize = 15;
  const linkSize = 14;

  return (
    <PublicBrandShell fontSize={fontSize} onFontSizeChange={setFontSize}>
      <div className={styles.loginPanelWrapper}>
        <div className={styles.loginCard}>
          <div className={styles.cardIcon} aria-hidden>
            <Music size={26} strokeWidth={1.8} />
          </div>
          <h1 className={styles.cardTitle} style={{ fontSize: `${titleSize}px` }}>
            Recuperar senha
          </h1>
          <p className={styles.cardDesc} style={{ fontSize: `${descSize}px` }}>
            Informe seu CPF e e-mail cadastrados. Será gerada uma senha temporária para acesso.
          </p>

          {success ? (
            <>
              <p
                className={styles.infoMsg}
                style={{
                  fontSize: `${descSize}px`,
                }}
              >
                {senhaTemporaria
                  ? `Nova senha temporária: ${senhaTemporaria}. Altere-a após o login.`
                  : 'Senha redefinida. Faça login com a nova senha.'}
              </p>
              <Link href="/login" className={styles.submitBtn}>
                Voltar ao login
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className={styles.loginForm}>
              <div className={styles.inputWrap}>
                <label htmlFor="cpf" className={styles.inputLabel}>
                  CPF
                </label>
                <div className={styles.inputWithIcon}>
                  <User size={18} className={styles.fieldIcon} aria-hidden />
                  <input
                    id="cpf"
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    required
                    maxLength={14}
                    className={styles.input}
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className={styles.inputWrap}>
                <label htmlFor="email" className={styles.inputLabel}>
                  E-mail
                </label>
                <div className={styles.inputWithIcon}>
                  <Mail size={18} className={styles.fieldIcon} aria-hidden />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={styles.input}
                    data-no-uppercase
                  />
                </div>
              </div>
              {error && <p className={styles.errorMsg}>{error}</p>}
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </form>
          )}

          <p className={styles.recoveryWrap} style={{ fontSize: `${linkSize}px` }}>
            <Link href="/login" className={styles.recoveryLink}>
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </PublicBrandShell>
  );
}
