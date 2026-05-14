import { useState, useEffect } from 'react';
import { EC, ecSerif } from '../constants';
import { ECPageHeader, ECSmallCaps, ECMono, Spinner } from '../components/atoms';
import { sb } from '../supabase';

type TabId = 'global' | 'weekly' | 'h2h';
const TABS: { id: TabId; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'h2h',    label: 'H2H' },
];

interface Props { userId: string; onBack: () => void; }

export function LeaderboardScreen({ userId, onBack }: Props) {
  const [tab,     setTab]     = useState<TabId>('global');
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRows([]); setLoading(true);
    (async () => {
      if (tab === 'global') {
        const { data } = await sb.from('global_leaderboard').select('user_id,display_name,score,rank').order('rank').limit(50);
        setRows(data || []);
      } else if (tab === 'weekly') {
        const { data } = await sb.from('weekly_leaderboard').select('user_id,display_name,score,games_played,rank').order('rank').limit(50);
        setRows(data || []);
      } else {
        const { data } = await sb.from('h2h_leaderboard').select('user_id,display_name,wins,losses,rank').order('rank').limit(50);
        setRows(data || []);
      }
      setLoading(false);
    })();
  }, [tab]);

  function rowValue(r: any) {
    if (tab === 'h2h') return `${r.wins}W · ${r.losses}L`;
    return (r.score || 0).toLocaleString();
  }

  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader left="No. 006" right="The standings" />
      <div style={{ padding: '18px 28px 0' }}>
        <div style={{ fontFamily: ecSerif, fontSize: 28, lineHeight: 1.05, color: EC.ink, letterSpacing: '-0.01em' }}>
          Who plays <em style={{ fontStyle: 'italic', color: EC.teal }}>best</em>?
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '16px 24px 0', display: 'flex',
        borderBottom: `1px solid ${EC.creamLine}` }}>
        {TABS.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 18px', cursor: 'pointer',
            borderBottom: `2px solid ${tab === t.id ? EC.teal : 'transparent'}`, marginBottom: -1 }}>
            <ECSmallCaps color={tab === t.id ? EC.teal : EC.inkFaint} size={10}>{t.label}</ECSmallCaps>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <Spinner />}
        {!loading && rows.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15, color: EC.inkSoft }}>
              No scores recorded yet.
            </div>
          </div>
        )}
        {rows.map((r, i) => {
          const isMe = r.user_id === userId;
          return (
            <div key={r.user_id || i} style={{ display: 'flex', alignItems: 'center',
              padding: '13px 24px', borderBottom: `1px solid ${EC.creamLine}`,
              background: isMe ? EC.tealSoft : 'transparent' }}>
              <ECMono color={isMe ? EC.teal : EC.inkFaint} size={12} style={{ width: 28, flexShrink: 0 }}>
                {String(r.rank).padStart(2, '0')}
              </ECMono>
              <div style={{ flex: 1, fontFamily: ecSerif, fontSize: 16, color: EC.ink,
                fontStyle: isMe ? 'italic' : 'normal' }}>
                {r.display_name || '—'}{isMe && ' (you)'}
              </div>
              <ECMono color={isMe ? EC.teal : EC.ink} size={13}>{rowValue(r)}</ECMono>
            </div>
          );
        })}
        <div style={{ height: 20 }} />
      </div>

      <div style={{ padding: '10px 24px 28px' }}>
        <button onClick={onBack} style={{ width: '100%', height: 48, background: 'transparent',
          color: EC.inkSoft, border: `1px solid ${EC.creamLine}`, borderRadius: 6,
          fontFamily: ecSerif, fontSize: 17 }}>← Back</button>
      </div>
    </div>
  );
}
