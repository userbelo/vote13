import { useEffect, useState } from 'react';

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
}

function formatTwo(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Hook de countdown regressivo
 */
export function useCountdown(initialMinutes = 14, initialSeconds = 58) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.floor(initialMinutes * 60 + initialSeconds))
  );

  useEffect(() => {
    if (remainingSeconds === 0) return;
    const timeout = setTimeout(() => {
      setRemainingSeconds(previous => Math.max(0, previous - 1));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [remainingSeconds]);

  const time: CountdownTime = {
    hours: Math.floor(remainingSeconds / 3600),
    minutes: Math.floor((remainingSeconds % 3600) / 60),
    seconds: remainingSeconds % 60,
  };
  const inlineTime = time.hours > 0
    ? `${formatTwo(time.hours)}:${formatTwo(time.minutes)}:${formatTwo(time.seconds)}`
    : `${formatTwo(time.minutes)}:${formatTwo(time.seconds)}`;

  return {
    formatted: {
      h: formatTwo(time.hours),
      m: formatTwo(time.minutes),
      s: formatTwo(time.seconds),
    },
    inline: inlineTime,
  };
}

interface Props {
  label?: string;
  compact?: boolean;
}

/**
 * Componente de countdown — estilo gov.br, sem emojis de jogo
 */
export default function Countdown({ label = 'Prazo do Ciclo Atual', compact = false }: Props) {
  const { formatted } = useCountdown();
  const accessibleTime = `${formatted.h}:${formatted.m}:${formatted.s}`;

  if (compact) {
    const compactTime = formatted.h === '00'
      ? `${formatted.m}:${formatted.s}`
      : accessibleTime;
    return <span className="countdown-compact" role="timer" aria-label={`${label}: ${accessibleTime}`}>{compactTime}</span>;
  }

  return (
    <div className="countdown-gov" role="timer" aria-label={`${label}: ${accessibleTime}`}>
      <div className="cg-box">
        <span>{formatted.h}</span>
        <label>Horas</label>
      </div>
      <div className="cg-sep">:</div>
      <div className="cg-box">
        <span>{formatted.m}</span>
        <label>Min</label>
      </div>
      <div className="cg-sep">:</div>
      <div className="cg-box">
        <span>{formatted.s}</span>
        <label>Seg</label>
      </div>
    </div>
  );
}
