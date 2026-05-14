import { useState } from 'react';
import { EC, ecSerif } from '../constants';
import { ECSmallCaps, ECMonogram } from '../components/atoms';
import { signIn, signUp } from '../api';

interface Props { onAuth: () => void; }

type Tab = 'signin' | 'signup';

const inputStyle: React.CSSProperties = {
  width: '100%', height: 52, border: `1px solid ${EC.creamLine}`,
  borderRadius: 6, background: 'transparent', fontFamily: ecSerif,
  fontSize: 17, color: EC.ink, padding: '0 16px', outline: 'none',
};

export function AuthScreen({ onAuth }: Props) {
  const [tab,      setTab]      = useState<Tab>('signup');
  const [name,     setName]     = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit() {
    if (!name.trim())  { setError('Enter your game name.'); return; }
    if (!password)     { setError('Enter a password.'); return; }
    if (tab === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true); setError('');
    try {
      if (tab === 'signin') {
        await signIn(name.trim(), password);
      } else {
        await signUp(name.trim(), password);
      }
      onAuth();
    } catch (e: any) {
      // Supabase error messages can be technical — make them friendlier
      const msg: string = e.message || '';
      if (msg.includes('already registered') || msg.includes('duplicate')) {
        setError('That game name is already taken. Try another or sign in.');
      } else if (msg.includes('Invalid login')) {
        setError('Game name or password is incorrect.');
      } else {
        setError(msg || 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t: Tab) { setTab(t); setError(''); }

  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream,
      display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <ECMonogram color={EC.teal} size={22} />
        <div style={{ marginTop: 28, fontFamily: ecSerif, fontWeight: 400, fontSize: 52,
          lineHeight: 0.95, color: EC.ink, letterSpacing: '-0.01em' }}>
          Eau<br /><em style={{ fontStyle: 'italic', color: EC.teal }}>Claude</em>
        </div>
        <div style={{ marginTop: 20, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15,
          color: EC.inkSoft, lineHeight: 1.5 }}>
          A trivia game, made with love.
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '0 24px 36px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${EC.creamLine}`, marginBottom: 16 }}>
          {(['signup', 'signin'] as Tab[]).map(t => (
            <div key={t} onClick={() => switchTab(t)}
              style={{ flex: 1, paddingBottom: 10, textAlign: 'center', cursor: 'pointer',
                borderBottom: `2px solid ${tab === t ? EC.teal : 'transparent'}`,
                marginBottom: -1 }}>
              <ECSmallCaps color={tab === t ? EC.teal : EC.inkFaint} size={10}>
                {t === 'signup' ? 'New player' : 'Sign in'}
              </ECSmallCaps>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={tab === 'signup' ? 'Choose a game name' : 'Your game name'}
            autoComplete="username"
            maxLength={32}
            style={inputStyle}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={tab === 'signup' ? 'Create a password' : 'Password'}
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            style={inputStyle}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </div>

        {error && (
          <div style={{ marginTop: 10, fontFamily: ecSerif, fontStyle: 'italic',
            fontSize: 13, color: EC.heart }}>{error}</div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          marginTop: 14, width: '100%', height: 56,
          background: EC.teal, color: EC.cream, border: 'none', borderRadius: 6,
          fontFamily: ecSerif, fontSize: 19, opacity: loading ? 0.65 : 1,
          cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? '…' : tab === 'signup' ? 'Begin →' : 'Sign in'}
        </button>

        {tab === 'signup' && (
          <div style={{ marginTop: 12, fontFamily: ecSerif, fontStyle: 'italic',
            fontSize: 12, color: EC.inkFaint, textAlign: 'center' }}>
            Your game name is your identity. Choose wisely.
          </div>
        )}
      </div>
    </div>
  );
}
