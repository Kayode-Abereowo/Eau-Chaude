import { EC, ecMono } from '../constants';

interface Props { remaining: number; timerTotal: number; dark?: boolean; }

export function TimerArc({ remaining, timerTotal, dark }: Props) {
  const r    = 22;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - remaining / timerTotal);
  const pct  = remaining / timerTotal;
  const stroke = pct > 0.4 ? (dark ? EC.cream : EC.teal)
               : pct > 0.2 ? '#E09A3A'
               : '#B65B5C';
  return (
    <div style={{ position: 'relative', width: 54, height: 54 }}>
      <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx="27" cy="27" r={r} fill="none" stroke={dark ? 'rgba(244,238,230,0.18)' : EC.creamLine} strokeWidth="1.5" />
        <circle cx="27" cy="27" r={r} fill="none" stroke={stroke} strokeWidth="1.5"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: ecMono, fontSize: 15, color: pct <= 0.2 ? '#B65B5C' : (dark ? EC.cream : EC.ink) }}>
          {remaining}
        </span>
      </div>
    </div>
  );
}
