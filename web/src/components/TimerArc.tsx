import { EC, ecMono, TIMER_TOTAL } from '../constants';

interface Props { remaining: number; dark?: boolean; }

export function TimerArc({ remaining, dark }: Props) {
  const r    = 22;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - remaining / TIMER_TOTAL);
  return (
    <div style={{ position: 'relative', width: 54, height: 54 }}>
      <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx="27" cy="27" r={r} fill="none" stroke={dark ? 'rgba(244,238,230,0.18)' : EC.creamLine} strokeWidth="1.5" />
        <circle cx="27" cy="27" r={r} fill="none" stroke={dark ? EC.cream : EC.teal} strokeWidth="1.5"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: ecMono, fontSize: 15, color: dark ? EC.cream : EC.ink }}>{remaining}</span>
      </div>
    </div>
  );
}
