'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PwaRegister.module.css';

function deveRegistrar(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;
  if (process.env.NODE_ENV !== 'production') return false;
  return window.isSecureContext || window.location.hostname === 'localhost';
}

export function PwaRegister() {
  const [workerPendente, setWorkerPendente] = useState<ServiceWorker | null>(null);
  const recarregarAposConfirmacao = useRef(false);

  useEffect(() => {
    if (!deveRegistrar()) return undefined;

    let cancelado = false;
    let recarregando = false;

    const aoControllerChange = () => {
      if (!recarregarAposConfirmacao.current || recarregando) return;
      recarregando = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', aoControllerChange);

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registro) => {
        if (cancelado) return;

        if (registro.waiting && !navigator.serviceWorker.controller) {
          registro.waiting.postMessage('SKIP_WAITING');
        } else if (registro.waiting && navigator.serviceWorker.controller) {
          setWorkerPendente(registro.waiting);
        }

        registro.addEventListener('updatefound', () => {
          const instalando = registro.installing;
          if (!instalando) return;
          instalando.addEventListener('statechange', () => {
            if (instalando.state !== 'installed') return;
            if (navigator.serviceWorker.controller) {
              if (!cancelado) setWorkerPendente(instalando);
              return;
            }
            instalando.postMessage('SKIP_WAITING');
          });
        });
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
      navigator.serviceWorker.removeEventListener('controllerchange', aoControllerChange);
    };
  }, []);

  if (!workerPendente) return null;

  return (
    <div className={styles.banner} role="status">
      <p className={styles.texto}>Nova versão do BRMusic disponível.</p>
      <button
        type="button"
        className={styles.botao}
        onClick={() => {
          recarregarAposConfirmacao.current = true;
          workerPendente.postMessage('SKIP_WAITING');
        }}
      >
        Atualizar
      </button>
    </div>
  );
}
