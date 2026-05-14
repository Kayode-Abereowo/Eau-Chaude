import { useState } from 'react';
import { EC, ecSerif } from '../constants';
import { ECPageHeader, ECMonogram } from '../components/atoms';

interface Props { onSave: (name: string) => void; }

export function NameSetupScreen({ onSave }: Props) {
  const [name, setName] = useState('');
  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader left="Welcome" right="Your name" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <ECMonogram color={EC.teal} size={22} />
        <div style={{ marginTop: 32, fontFamily: ecSerif, fontWeight: 400, fontSize: 48,
          lineHeight: 0.95, color: EC.ink, letterSpacing: '-0.01em' }}>
          Eau<br /><em style={{ fontStyle: 'italic', color: EC.teal }}>Claude</em>
        </div>
        <div style={{ marginTop: 24, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 16,
          color: EC.inkSoft, lineHeight: 1.5, maxWidth: 260 }}>
          Before we begin —<br />what shall we call you?
        </div>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Your name"
          style={{ marginTop: 28, width: '100%', height: 52, border: `1px solid ${EC.creamLine}`,
            borderRadius: 6, background: 'transparent', fontFamily: ecSerif, fontSize: 18,
            color: EC.ink, padding: '0 16px', outline: 'none', textAlign: 'center' }}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()); }} />
      </div>
      <div style={{ padding: '0 24px 36px' }}>
        <button onClick={() => name.trim() && onSave(name.trim())} style={{
          width: '100%', height: 56, background: name.trim() ? EC.teal : 'rgba(14,106,120,0.3)',
          color: EC.cream, border: 'none', borderRadius: 6, fontFamily: ecSerif, fontSize: 19,
          cursor: name.trim() ? 'pointer' : 'default', transition: 'background 0.2s',
        }}>
          Begin
        </button>
      </div>
    </div>
  );
}
