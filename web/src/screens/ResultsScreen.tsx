import { EC, ecSerif, CATEGORIES_LIST, type Badge } from '../constants';
import { ECPageHeader, ECSmallCaps, ECMono } from '../components/atoms';

interface Props {
  score: number;
  correct: number;
  fastestSecs: number;
  bestStreak: number;
  speedBonus: number;
  prevBest: number;
  categoryId: number;
  onReplay: () => void;
  onChallenge: () => void;
  matchWinner?: 'you' | 'opponent' | null;
  newBadges: string[];
  allBadges: Badge[];
}

export function ResultsScreen({
  score, correct, fastestSecs, bestStreak, speedBonus, prevBest,
  categoryId, onReplay, onChallenge, matchWinner, newBadges, allBadges,
}: Props) {
  const isNewBest = score > prevBest;
  const cat = CATEGORIES_LIST.find(c => c.id === categoryId);
  const rows = [
    { label: 'Correct',     mono: `${String(correct).padStart(2, '0')} / 10` },
    { label: 'Fastest',     mono: `${fastestSecs.toFixed(1)} s` },
    { label: 'Best streak', mono: `${bestStreak} in a row` },
    { label: 'Speed bonus', mono: `+${speedBonus}` },
  ];
  const earnedBadgeDetails = newBadges
    .map(id => allBadges.find(b => b.id === id))
    .filter(Boolean) as Badge[];

  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader left="No. 004" right="A session, concluded" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px' }}>
        <div style={{ padding: '22px 28px 0', textAlign: 'center' }}>
          {matchWinner && (
            <div style={{ marginBottom: 10 }}>
              <ECSmallCaps color={matchWinner === 'you' ? EC.teal : EC.inkFaint} size={10}>
                {matchWinner === 'you' ? 'You won the match' : 'Opponent won'}
              </ECSmallCaps>
            </div>
          )}
          <ECSmallCaps color={EC.inkFaint} size={10}>Final score</ECSmallCaps>
          <div style={{ marginTop: 10, fontFamily: ecSerif, fontWeight: 400, fontSize: 76,
            lineHeight: 0.95, color: EC.ink, letterSpacing: '-0.02em' }}>
            {score.toLocaleString()}
          </div>
          {isNewBest && (
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '5px 12px', border: `1px solid ${EC.teal}`, borderRadius: 999 }}>
              <span style={{ color: EC.teal, fontFamily: ecSerif, fontSize: 13 }}>▲</span>
              <ECSmallCaps color={EC.teal} size={10}>New personal best · +{(score - prevBest).toLocaleString()}</ECSmallCaps>
            </div>
          )}
        </div>

        <div style={{ margin: '16px 24px 0', border: `1px solid ${EC.creamLine}`, borderRadius: 6 }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 18px', borderTop: i === 0 ? 'none' : `1px solid ${EC.creamLine}` }}>
              <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15, color: EC.ink }}>{r.label}</div>
              <ECMono color={EC.ink} size={13}>{r.mono}</ECMono>
            </div>
          ))}
        </div>

        {earnedBadgeDetails.length > 0 && (
          <div style={{ margin: '14px 24px 0', padding: '14px 16px',
            background: EC.tealSoft, border: `1px solid rgba(14,106,120,0.15)`, borderRadius: 6 }}>
            <ECSmallCaps color={EC.teal} size={9}>
              Badge{earnedBadgeDetails.length > 1 ? 's' : ''} earned
            </ECSmallCaps>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {earnedBadgeDetails.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: ecSerif, fontSize: 16, color: EC.teal, minWidth: 28 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontFamily: ecSerif, fontSize: 14, color: EC.ink }}>{b.name}</div>
                    <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 11, color: EC.inkSoft }}>{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cat && (
          <div style={{ padding: '14px 28px 0' }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>By category · this session</ECSmallCaps>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 13, color: EC.inkSoft }}>{cat.name}</div>
              <div style={{ width: 100, height: 1, background: EC.creamLine, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: -1,
                  width: `${(correct / 10) * 100}%`, height: 3, background: EC.teal, transition: 'width 0.6s ease' }} />
              </div>
              <ECMono color={EC.ink} size={11} style={{ width: 32, textAlign: 'right' }}>{Math.round((correct / 10) * 100)}%</ECMono>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onReplay} style={{ width: '100%', height: 56, background: EC.teal,
          color: EC.cream, border: 'none', borderRadius: 6, fontFamily: ecSerif, fontSize: 19,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' }}>
          <span>Play another round</span><span style={{ fontSize: 19 }}>↻</span>
        </button>
        <button onClick={onChallenge} style={{ width: '100%', height: 56, background: 'transparent',
          color: EC.ink, border: `1px solid ${EC.ink}`, borderRadius: 6, fontFamily: ecSerif, fontSize: 19,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' }}>
          <span>Challenge a friend</span><span style={{ fontSize: 19 }}>→</span>
        </button>
      </div>
    </div>
  );
}
