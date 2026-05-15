import { useEffect, useRef } from 'react';
import { EC, ecSerif, type Badge } from '../constants';
import { ECPageHeader, ECSmallCaps, ECMono } from '../components/atoms';

interface Props {
  score: number;
  correct: number;
  totalQs: number;
  fastestSecs: number;
  bestStreak: number;
  speedBonus: number;
  prevBest: number;
  onReplay: () => void;
  onChallenge: () => void;
  matchWinner?: 'you' | 'opponent' | null;
  newBadges: string[];
  allBadges: Badge[];
}

const CONFETTI_COLORS = ['#0E6A78', '#FFD700', '#B65B5C', '#F4EEE6', '#4CAF50', '#FF6B35'];

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.8,
      duration: 2.2 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 5 + Math.random() * 7,
      skew: Math.random() * 20 - 10,
    }))
  ).current;

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-30px) rotate(0deg) skewX(var(--sk)); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(680px) rotate(540deg) skewX(var(--sk)); opacity: 0; }
        }
        @keyframes medal-pop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          65%  { transform: scale(1.25) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes victory-slide {
          0%   { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
        {pieces.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            borderRadius: 2,
            '--sk': `${p.skew}deg`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in both`,
          } as React.CSSProperties} />
        ))}
      </div>
    </>
  );
}

export function ResultsScreen({
  score, correct, totalQs, fastestSecs, bestStreak, speedBonus, prevBest,
  onReplay, onChallenge, matchWinner, newBadges, allBadges,
}: Props) {
  const isNewBest = score > prevBest;
  const isWinner  = matchWinner === 'you';
  const isLoser   = matchWinner === 'opponent';

  const rows = [
    { label: 'Correct',     mono: `${String(correct).padStart(2, '0')} / ${totalQs}` },
    { label: 'Fastest',     mono: fastestSecs < 9999 ? `${fastestSecs.toFixed(1)} s` : '—' },
    { label: 'Best streak', mono: `${bestStreak} in a row` },
    { label: 'Speed bonus', mono: `+${speedBonus}` },
  ];

  const earnedBadgeDetails = newBadges
    .map(id => allBadges.find(b => b.id === id))
    .filter(Boolean) as Badge[];

  return (
    <div style={{ width: '100%', height: '100%', background: isWinner ? EC.tealDeep : EC.cream,
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
      transition: 'background 0.5s ease' }}>

      {isWinner && <Confetti />}

      <ECPageHeader
        left="No. 004"
        right={isWinner ? 'Victory' : isLoser ? 'Well played' : 'A session, concluded'}
        dark={isWinner}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px', position: 'relative', zIndex: 1 }}>

        {/* Winner celebration header */}
        {isWinner && (
          <div style={{ padding: '28px 28px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 72, lineHeight: 1,
              animation: 'medal-pop 0.7s 0.3s cubic-bezier(.34,1.56,.64,1) both' }}>
              🥇
            </div>
            <div style={{ marginTop: 14, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 38,
              color: '#FFD700', letterSpacing: '-0.01em', lineHeight: 1,
              animation: 'victory-slide 0.5s 0.8s ease both' }}>
              You won!
            </div>
            <div style={{ marginTop: 6, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14,
              color: EC.onTealSoft, animation: 'victory-slide 0.5s 1s ease both' }}>
              First to finish — the match is yours.
            </div>
          </div>
        )}

        {/* Loser header */}
        {isLoser && (
          <div style={{ padding: '22px 28px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 52, lineHeight: 1 }}>🥈</div>
            <div style={{ marginTop: 10 }}>
              <ECSmallCaps color={EC.inkFaint} size={10}>Opponent finished first</ECSmallCaps>
            </div>
            <div style={{ marginTop: 6, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14,
              color: EC.inkSoft }}>Good game — keep practising.</div>
          </div>
        )}

        {/* Solo / no match header */}
        {!matchWinner && (
          <div style={{ padding: '22px 28px 0', textAlign: 'center' }}>
            <ECSmallCaps color={EC.inkFaint} size={10}>Final score</ECSmallCaps>
          </div>
        )}

        {/* Score */}
        <div style={{ marginTop: isWinner ? 18 : 8, textAlign: 'center', padding: '0 28px' }}>
          <div style={{ fontFamily: ecSerif, fontWeight: 400, fontSize: 76,
            lineHeight: 0.95, color: isWinner ? EC.cream : EC.ink, letterSpacing: '-0.02em' }}>
            {score.toLocaleString()}
          </div>
          {isNewBest && (
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '5px 12px', border: `1px solid ${isWinner ? '#FFD700' : EC.teal}`, borderRadius: 999 }}>
              <span style={{ color: isWinner ? '#FFD700' : EC.teal, fontFamily: ecSerif, fontSize: 13 }}>▲</span>
              <ECSmallCaps color={isWinner ? '#FFD700' : EC.teal} size={10}>
                New personal best · +{(score - prevBest).toLocaleString()}
              </ECSmallCaps>
            </div>
          )}
        </div>

        {/* Stats table */}
        <div style={{ margin: '16px 24px 0',
          border: `1px solid ${isWinner ? EC.tealLine : EC.creamLine}`, borderRadius: 6 }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 18px', borderTop: i === 0 ? 'none' : `1px solid ${isWinner ? EC.tealLine : EC.creamLine}` }}>
              <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15,
                color: isWinner ? EC.onTealSoft : EC.ink }}>{r.label}</div>
              <ECMono color={isWinner ? EC.cream : EC.ink} size={13}>{r.mono}</ECMono>
            </div>
          ))}
        </div>

        {/* Badges */}
        {earnedBadgeDetails.length > 0 && (
          <div style={{ margin: '14px 24px 0', padding: '14px 16px',
            background: isWinner ? 'rgba(255,215,0,0.1)' : EC.tealSoft,
            border: `1px solid ${isWinner ? 'rgba(255,215,0,0.3)' : 'rgba(14,106,120,0.15)'}`,
            borderRadius: 6 }}>
            <ECSmallCaps color={isWinner ? '#FFD700' : EC.teal} size={9}>
              Badge{earnedBadgeDetails.length > 1 ? 's' : ''} earned
            </ECSmallCaps>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {earnedBadgeDetails.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: ecSerif, fontSize: 16, color: isWinner ? '#FFD700' : EC.teal, minWidth: 28 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontFamily: ecSerif, fontSize: 14, color: isWinner ? EC.cream : EC.ink }}>{b.name}</div>
                    <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 11,
                      color: isWinner ? EC.onTealSoft : EC.inkSoft }}>{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
        <button onClick={onReplay} style={{ width: '100%', height: 56,
          background: isWinner ? '#FFD700' : EC.teal,
          color: isWinner ? EC.ink : EC.cream,
          border: 'none', borderRadius: 6, fontFamily: ecSerif, fontSize: 19,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px',
          cursor: 'pointer' }}>
          <span>Play another round</span><span style={{ fontSize: 19 }}>↻</span>
        </button>
        <button onClick={onChallenge} style={{ width: '100%', height: 56, background: 'transparent',
          color: isWinner ? EC.cream : EC.ink,
          border: `1px solid ${isWinner ? EC.tealLine : EC.ink}`,
          borderRadius: 6, fontFamily: ecSerif, fontSize: 19,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px',
          cursor: 'pointer' }}>
          <span>Challenge a friend</span><span style={{ fontSize: 19 }}>→</span>
        </button>
      </div>
    </div>
  );
}
