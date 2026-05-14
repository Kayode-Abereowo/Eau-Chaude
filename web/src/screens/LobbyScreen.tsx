import { useState } from 'react';
import { EC, ecSerif, CATEGORIES_LIST } from '../constants';
import { ECPageHeader, ECSmallCaps, ECMono, ECHair } from '../components/atoms';

interface Player { user_id: string; display_name: string; score?: number; }
interface Match  { id: string; code: string; status: string; category_id: number; difficulty: string; }

interface PlayerCardProps {
  name: string; initial: string; you?: boolean; host?: boolean; status: string; dark?: boolean;
}
function PlayerCard({ name, initial, you, host, status, dark }: PlayerCardProps) {
  const text  = dark ? EC.cream    : EC.ink;
  const faint = dark ? EC.onTealFaint : EC.inkFaint;
  const soft  = dark ? EC.onTealSoft  : EC.inkSoft;
  const line  = dark ? EC.tealLine    : EC.creamLine;
  return (
    <div style={{ flex: 1, padding: '18px 14px', border: `1px solid ${line}`,
      borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <ECSmallCaps color={faint} size={9}>{you ? 'You' : (host ? 'Host' : 'Guest')}</ECSmallCaps>
      <div style={{ width: 70, height: 70, borderRadius: '50%', border: `1px solid ${line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 26, color: text, lineHeight: 1 }}>{initial}</span>
      </div>
      <div style={{ fontFamily: ecSerif, fontSize: 17, color: text, textAlign: 'center' }}>{name}</div>
      <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 11, color: soft, textAlign: 'center', minHeight: 14 }}>{status}</div>
    </div>
  );
}

interface Props {
  match: Match | null;
  players: Player[];
  currentUserId: string;
  isHost: boolean;
  onStart: () => void;
  onHome: () => void;
}

export function LobbyScreen({ match, players, currentUserId, isHost, onStart, onHome }: Props) {
  const [copied, setCopied] = useState(false);
  const starting  = match?.status === 'active';
  const me        = players.find(p => p.user_id === currentUserId);
  const opponent  = players.find(p => p.user_id !== currentUserId);
  const bothReady = players.length >= 2;

  function copyLink() {
    const link = `${window.location.origin}/?join=${match?.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  const catName = CATEGORIES_LIST.find(c => c.id === match?.category_id)?.name || '';

  return (
    <div style={{ width: '100%', height: '100%',
      background: starting ? EC.tealDeep : EC.cream,
      display: 'flex', flexDirection: 'column', transition: 'background 0.4s ease' }}>
      <ECPageHeader left={starting ? 'Match · No. 005' : 'Lobby · No. 005'}
        right={starting ? 'Beginning' : 'Awaiting'} dark={starting} />

      <div style={{ padding: '22px 28px 0' }}>
        <div style={{ fontFamily: ecSerif, fontSize: 28, lineHeight: 1.05,
          letterSpacing: '-0.01em', color: starting ? EC.cream : EC.ink }}>
          {starting
            ? <><span>The match </span><em style={{ fontStyle: 'italic', opacity: 0.85 }}>begins</em></>
            : <>Head <em style={{ fontStyle: 'italic', color: EC.teal }}>to</em> head</>}
        </div>
        <div style={{ marginTop: 5, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 13,
          color: starting ? EC.onTealSoft : EC.inkSoft }}>
          {match ? `Ten questions · ${catName} · ${match.difficulty}` : 'A friendly contest of ten questions.'}
        </div>
      </div>

      <div style={{ padding: '22px 22px 0', display: 'flex', alignItems: 'stretch', gap: 10 }}>
        <PlayerCard name={me?.display_name || 'You'} initial={(me?.display_name || 'Y')[0]}
          you status="Ready" dark={starting} />
        <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 20,
            color: starting ? EC.cream : EC.ink, opacity: 0.6 }}>vs</span>
        </div>
        <PlayerCard name={opponent?.display_name || 'Claude'}
          initial={(opponent?.display_name || 'C')[0]}
          status={opponent ? 'Ready' : 'Connecting…'} dark={starting} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 28px' }}>
        {starting ? (
          <>
            <ECSmallCaps color={EC.onTealSoft} size={10}>Beginning in</ECSmallCaps>
            <div style={{ marginTop: 12, fontFamily: ecSerif, fontWeight: 400, fontSize: 112,
              lineHeight: 0.9, color: EC.cream }}>3</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
              <ECMono color={EC.onTealFaint} size={14}>3</ECMono>
              <ECHair length={14} color={EC.tealLine} />
              <ECMono color={EC.cream} size={14}>2</ECMono>
              <ECHair length={14} color={EC.tealLine} />
              <ECMono color={EC.onTealFaint} size={14}>1</ECMono>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: EC.teal, opacity: 0.5, marginBottom: 12 }} />
            <ECSmallCaps color={EC.inkFaint} size={10}>
              {bothReady ? 'Both players are ready' : 'Waiting for opponent'}
            </ECSmallCaps>
            <div style={{ marginTop: 12, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14,
              color: EC.inkSoft, textAlign: 'center', maxWidth: 240 }}>
              {bothReady
                ? 'Host can start the match when ready.'
                : 'Your invitation has been sent. They have until the kettle whistles.'}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '0 24px 28px' }}>
        {!starting && (
          <>
            {/* Invite link — copies real URL to clipboard */}
            <div onClick={copyLink} style={{ border: `1px solid ${EC.creamLine}`, borderRadius: 6,
              padding: '11px 15px', display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 10, cursor: 'pointer' }}>
              <div style={{ flex: 1 }}>
                <ECSmallCaps color={EC.inkFaint} size={9}>Invite link</ECSmallCaps>
                <div style={{ marginTop: 3 }}>
                  <ECMono color={EC.ink} size={12}>
                    {window.location.hostname}/?join={match?.code}
                  </ECMono>
                </div>
              </div>
              <ECSmallCaps color={EC.teal} size={10}>{copied ? 'Copied ✓' : 'Copy'}</ECSmallCaps>
            </div>

            {isHost && (
              <button onClick={onStart} disabled={!bothReady} style={{ width: '100%', height: 52,
                background: bothReady ? EC.teal : 'rgba(14,106,120,0.3)', color: EC.cream,
                border: 'none', borderRadius: 6, fontFamily: ecSerif, fontSize: 18,
                cursor: bothReady ? 'pointer' : 'default', transition: 'background 0.2s' }}>
                {bothReady ? 'Start match →' : 'Waiting for opponent…'}
              </button>
            )}
            {!isHost && (
              <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ECSmallCaps color={EC.inkFaint} size={10}>Waiting for host to start…</ECSmallCaps>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
