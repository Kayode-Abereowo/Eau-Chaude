import { EC, ecSerif } from '../constants';
import { ECPageHeader } from '../components/atoms';

interface Props {
  onCreateMatch: () => void;
  onJoinMatch: () => void;
  onBack: () => void;
}

export function ChallengeMenuScreen({ onCreateMatch, onJoinMatch, onBack }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader left="No. 005" right="Head to head" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 32px', gap: 12, textAlign: 'center' }}>
        <div style={{ fontFamily: ecSerif, fontSize: 28, lineHeight: 1.05, color: EC.ink,
          letterSpacing: '-0.01em' }}>
          Head <em style={{ fontStyle: 'italic', color: EC.teal }}>to</em> head
        </div>
        <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15, color: EC.inkSoft }}>
          Challenge a friend to ten questions<br />on the same question set.
        </div>
      </div>
      <div style={{ padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onCreateMatch} style={{ width: '100%', height: 56,
          background: EC.teal, color: EC.cream, border: 'none', borderRadius: 6,
          fontFamily: ecSerif, fontSize: 19,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' }}>
          <span>Create a match</span><span>→</span>
        </button>
        <button onClick={onJoinMatch} style={{ width: '100%', height: 56,
          background: 'transparent', color: EC.ink, border: `1px solid ${EC.ink}`,
          borderRadius: 6, fontFamily: ecSerif, fontSize: 19,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' }}>
          <span>Join a match</span><span>→</span>
        </button>
        <button onClick={onBack} style={{ width: '100%', height: 48, background: 'transparent',
          color: EC.inkSoft, border: `1px solid ${EC.creamLine}`, borderRadius: 6,
          fontFamily: ecSerif, fontSize: 17 }}>
          ← Back
        </button>
      </div>
    </div>
  );
}
