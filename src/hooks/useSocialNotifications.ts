import { useEffect, useState } from 'react';
import type { Notification } from '../types';
import { LIVE_NAMES, LIVE_ACTIONS } from '../constants';

function generateNotification(): Notification {
  const person = LIVE_NAMES[Math.floor(Math.random() * LIVE_NAMES.length)];
  const action = LIVE_ACTIONS[Math.floor(Math.random() * LIVE_ACTIONS.length)];
  return {
    id: crypto.randomUUID(),
    name: person.name,
    city: person.city,
    action,
    timestamp: new Date(),
  };
}

/**
 * Hook que gera notificações sociais em ritmo pausado e espaçado (devagar),
 * criando uma sensação natural e realista de inscrições acontecendo no benefício.
 */
export function useSocialNotifications(intervalMs = 16000) {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    // Primeira notificação aparece após 6 segundos
    const firstTimer = setTimeout(() => {
      setNotification(generateNotification());
    }, 6000);

    // Intervalo calmo: a cada 15s a 22s
    const intervalTimer = setInterval(() => {
      setNotification(generateNotification());
    }, intervalMs + Math.random() * 6000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(intervalTimer);
    };
  }, [intervalMs]);

  return notification;
}
