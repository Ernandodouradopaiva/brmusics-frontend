'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, LogIn, Music, Shield, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/apiError';
import { onlyDigits, formatCpf } from '@/lib/masks';
import styles from '../login.module.css';

const LEMBRAR_CPF_KEY = 'brmusics.lembrarCpf';

interface LoginCardProps {
  fontSizeLevel?: number;
  infoMessage?: string;
}

export default function LoginCard({ fontSizeLevel = 0, infoMessage }: LoginCardProps) {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LEMBRAR_CPF_KEY);
      if (saved) {
        setCpf(formatCpf(saved));
        setLembrar(true);
      }
    } catch {
      /* storage indisponível */
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cpfDigits = onlyDigits(cpf);
      try {
        if (lembrar) {
          window.localStorage.setItem(LEMBRAR_CPF_KEY, cpfDigits);
        } else {
          window.localStorage.removeItem(LEMBRAR_CPF_KEY);
        }
      } catch {
        /* storage indisponível */
      }
      await login(cpfDigits, senha);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const titleSize = 26 + fontSizeLevel;
  const descSize = 15 + fontSizeLevel;
  const linkSize = 14 + fontSizeLevel;

  return (
    <div className={styles.loginPanelWrapper}>
      <div className={styles.loginCard}>
        <div className={styles.cardIcon} aria-hidden>
          <Music size={26} strokeWidth={1.8} />
        </div>
        <h1 className={styles.cardTitle} style={{ fontSize: `${titleSize}px` }}>
          Acesso ao sistema
        </h1>
        <p className={styles.cardDesc} style={{ fontSize: `${descSize}px` }}>
          Informe o CPF e a senha para acessar sua conta.
        </p>
        {infoMessage && (
          <p className={styles.infoMsg} style={{ fontSize: `${descSize}px` }}>
            {infoMessage}
          </p>
        )}
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.inputWrap}>
            <label htmlFor="cpf" className={styles.inputLabel}>
              CPF
            </label>
            <div className={styles.inputWithIcon}>
              <User size={18} className={styles.fieldIcon} aria-hidden />
              <input
                id="cpf"
                type="text"
                className={styles.input}
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                required
                autoComplete="username"
                maxLength={14}
              />
            </div>
          </div>
          <div className={styles.inputWrap}>
            <label htmlFor="senha" className={styles.inputLabel}>
              Senha
            </label>
            <div className={styles.inputWithIcon}>
              <Lock size={18} className={styles.fieldIcon} aria-hidden />
              <input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                required
                autoComplete="current-password"
                data-no-uppercase
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <div className={styles.formMeta}>
            <label className={styles.remember}>
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
              />
              Lembrar meu acesso
            </label>
            <Link
              href="/recuperar-senha"
              className={styles.forgotLink}
              style={{ fontSize: `${linkSize}px` }}
            >
              Esqueci minha senha
            </Link>
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            <LogIn size={18} aria-hidden />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className={styles.orRow} aria-hidden>
          <span>ou</span>
        </div>
        <Link href="/recuperar-senha" className={styles.secondaryBtn}>
          <Shield size={18} aria-hidden />
          Gerar nova senha
        </Link>
      </div>
    </div>
  );
}
