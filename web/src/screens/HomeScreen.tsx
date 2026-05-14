import { EC, ecSerif, type Profile } from '../constants';
import { ECPageHeader, ECMonogram, ECHair, ECSmallCaps, ECMono } from '../components/atoms';

interface Props {
  profile: Profile | null;
  onSolo: () => void;
  onChallenge: () => void;
  onLeaderboard: () => void;
  onProfile: () => void;
  monogramTaps: number;
  onMonogramTap: () => void;
}

export function HomeScreen({ profile, onSolo, onChallenge, onLeaderboard, onProfile, onMonogramTap }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader left="No. 001" right="Chapter — Welcome" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ECHair length={28} color={EC.inkFaint} />
          <span onClick={onMonogramTap} style={{ cursor: 'default' }}>
            <ECMonogram color={EC.teal} size={20} />
          </span>
          <ECHair length={28} color={EC.inkFaint} />
        </div>
        <div style={{ fontFamily: ecSerif, fontWeight: 400, fontSize: 64,
          lineHeight: 0.95, color: EC.ink, letterSpacing: '-0.01em' }}>
          Eau<br /><em style={{ fontStyle: 'italic', color: EC.teal }}>Claude</em>
        </div>
        <div style={{ marginTop: 24, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 17,
          color: EC.inkSoft, lineHeight: 1.5, maxWidth: 260 }}>
          A trivia game,<br />made with love.
        </div>
        {profile?.display_name && (
          <div style={{ marginTop: 14 }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>Welcome back, {profile.display_name}</ECSmallCaps>
          </div>
        )}
      </div>
      <div style={{ padding: '0 24px 28px' }}>
        <button onClick={onSolo} style={{ width: '100%', height: 60, background: EC.teal,
          color: EC.cream, border: 'none', borderRadius: 6, fontFamily: ecSerif, fontSize: 21,
          letterSpacing: '0.02em', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' }}>
          <span>Begin a solo game</span>
          <ECSmallCaps color={EC.onTealSoft} size={10}>I</ECSmallCaps>
        </button>
        <button onClick={onChallenge} style={{ width: '100%', height: 60, background: 'transparent',
          color: EC.ink, border: `1px solid ${EC.ink}`, borderRadius: 6, fontFamily: ecSerif, fontSize: 21,
          letterSpacing: '0.02em',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' }}>
          <span>Invite a friend</span>
          <ECSmallCaps color={EC.inkSoft} size={10}>II</ECSmallCaps>
        </button>

        {/* Stats strip */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 4px' }}>
          <div>
            <ECSmallCaps color={EC.inkFaint} size={9}>Personal best</ECSmallCaps>
            <div style={{ marginTop: 4 }}>
              <ECMono color={EC.ink} size={14}>
                {profile?.personal_best ? profile.personal_best.toLocaleString() : '—'}
              </ECMono>
            </div>
          </div>
          <ECHair vertical length={28} color={EC.creamLine} />
          <div style={{ textAlign: 'center' }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>Streak</ECSmallCaps>
            <div style={{ marginTop: 4 }}>
              <ECMono color={EC.ink} size={14}>{profile?.current_streak ?? 0} days</ECMono>
            </div>
          </div>
          <ECHair vertical length={28} color={EC.creamLine} />
          <div style={{ textAlign: 'right' }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>Longest</ECSmallCaps>
            <div style={{ marginTop: 4 }}>
              <ECMono color={EC.ink} size={14}>{profile?.longest_streak ?? 0}d</ECMono>
            </div>
          </div>
        </div>

        {/* Secondary nav */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button onClick={onLeaderboard} style={{ flex: 1, height: 40, background: 'transparent',
            color: EC.inkSoft, border: `1px solid ${EC.creamLine}`, borderRadius: 5,
            fontFamily: ecSerif, fontSize: 14 }}>
            Standings
          </button>
          <button onClick={onProfile} style={{ flex: 1, height: 40, background: 'transparent',
            color: EC.inkSoft, border: `1px solid ${EC.creamLine}`, borderRadius: 5,
            fontFamily: ecSerif, fontSize: 14 }}>
            Profile
          </button>
        </div>
      </div>
    </div>
  );
}
