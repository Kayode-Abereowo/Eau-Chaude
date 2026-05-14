import { useState } from 'react';
import { EC, ecSerif, ecMono } from '../constants';
import { ECPageHeader, ECSmallCaps } from '../components/atoms';

interface Props {
  onJoin: (code: string) => void;
  onBack: () => void;
  loading: boolean;
}

export function JoinMatchScreen({ onJoin, onBack, loading }: Props) {
  const [code, setCode] = useState('');
  const [err,  setErr]  = useState('');

  function handleJoin() {
    if (code.trim().length !== 4) { setErr('Enter the 4-character match code'); return; }
    setErr('');
    onJoin(code.trim());
  }

  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader left="No. 005" right="Join a match" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 32px' }}>
        <ECSmallCaps color={EC.inkFaint} size={10}>Enter match code</ECSmallCaps>
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="e.g. 8FA3"
          style={{ marginTop: 20, width: '100%', height: 64, border: `1px solid ${EC.creamLine}`,
            borderRadius: 6, background: 'transparent', fontFamily: ecMono, fontSize: 28,
            color: EC.ink, padding: '0 16px', outline: 'none', textAlign: 'center',
            letterSpacing: '0.15em' }}
          onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }} />
        {err && (
          <div style={{ marginTop: 10, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 13, color: EC.heart }}>
            {err}
          </div>
        )}
      </div>
      <div style={{ padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={handleJoin} disabled={loading} style={{ width: '100%', height: 56,
          background: EC.teal, color: EC.cream, border: 'none', borderRadius: 6,
          fontFamily: ecSerif, fontSize: 19, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Joining…' : 'Join match →'}
        </button>
        <button onClick={onBack} style={{ width: '100%', height: 48, background: 'transparent',
          color: EC.inkSoft, border: `1px solid ${EC.creamLine}`, borderRadius: 6,
          fontFamily: ecSerif, fontSize: 17 }}>
          Back
        </button>
      </div>
    </div>
  );
}
