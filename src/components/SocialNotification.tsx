import { useEffect, useRef, useState } from 'react';
import type { Notification } from '../types';

interface Props {
  notification: Notification | null;
}

/**
 * Card de Notificação Social em Tempo Real:
 * - Mais atraente, compacto e discreto.
 * - Inclui o logo oficial do Bolsa Família em miniatura.
 * - Transmite clareza de que pessoas reais estão se inscrevendo no benefício.
 * - Intervalo pausado e ritmo suave (devagar).
 * - Totalmente responsivo para celulares e desktops.
 */
export default function SocialNotification({ notification }: Props) {
  const [visible, setVisible] = useState(false);
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!notification || notification.id === prevId.current) return;
    prevId.current = notification.id;
    setVisible(true);

    // Permanece visível por 6 segundos com leitura calma
    const t = setTimeout(() => {
      setVisible(false);
    }, 6000);

    return () => clearTimeout(t);
  }, [notification]);

  if (!notification) return null;

  return (
    <div
      className={`social-notification-toast ${visible ? 'is-visible' : 'is-hidden'}`}
      role="status"
      aria-live="polite"
    >
      <div className="sn-logo-wrap">
        <img
          src="/bolsa-familia-logo.png"
          alt="Bolsa Família"
          className="sn-logo-img"
        />
      </div>

      <div className="sn-content">
        <div className="sn-header-row">
          <span className="sn-live-dot" aria-hidden="true" />
          <span className="sn-badge-text">Inscrição no benefício</span>
          <span className="sn-time-ago">há instantes</span>
        </div>
        <p className="sn-message">
          <strong>{notification.name}</strong>, de {notification.city}, {notification.action}.
        </p>
      </div>

      <button
        type="button"
        className="sn-close-btn"
        onClick={() => setVisible(false)}
        aria-label="Dispensar aviso"
      >
        ✕
      </button>
    </div>
  );
}
