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
        const { data } = await sb.rpc('get_rivalry_records', { p_user_id: userId });
        setRows(data || []);
      }
      setLoading(false);
    })();
  }, [tab, userId]);

  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader left="No. 006" right="The standings" />
      <div style={{ padding: '18px 28px 0' }}>
        <div style={{ fontFamily: ecSerif, fontSize: 28, lineHeight: 1.05, color: EC.ink, letterSpacing: '-0.01em' }}>
          Who plays <em style={{ fontStyle: 'italic', color: EC.teal }}>best</em>?
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '16px 24px 0', display: 'flex', borderBottom: `1px solid ${EC.creamLine}` }}>
        {TABS.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 18px', cursor: 'pointer',
            borderBottom: `2px solid ${tab === t.id ? EC.teal : 'transparent'}`, marginBottom: -1 }}>
            <ECSmallCaps color={tab === t.id ? EC.teal : EC.inkFaint} size={10}>{t.label}</ECSmallCaps>
          </div>
        ))}
      </div>

      {tab === 'h2h' && (
        <div style={{ padding: '10px 24px 0' }}>
          <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 12, color: EC.inkSoft }}>
            Your head-to-head record against each opponent.
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <Spinner />}
        {!loading && rows.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15, color: EC.inkSoft }}>
              {tab === 'h2h' ? 'No H2H matches played yet.' : 'No scores recorded yet.'}
            </div>
          </div>
        )}

        {tab === 'h2h' ? (
          /* Rivalry rows */
          rows.map((r, i) => {
            const myW    = Number(r.my_wins);
            const theirW = Number(r.their_wins);
            const total  = Number(r.total);
            const iAhead = myW > theirW;
            const tied   = myW === theirW;
            return (
              <div key={r.opponent_id || i} style={{ padding: '14px 24px',
                borderBottom: `1px solid ${EC.creamLine}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: ecSerif, fontSize: 16, color: EC.ink }}>
                    {r.opponent_name}
                  </div>
                  <ECMono color={iAhead ? EC.teal : tied ? EC.inkSoft : EC.heart} size={12}>
                    {myW}W · {theirW}L
                  </ECMono>
                </div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Win bar */}
                  <div style={{ flex: 1, height: 4, background: EC.creamLine, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4,
                      background: iAhead ? EC.teal : tied ? EC.inkFaint : EC.heart,
                      width: total > 0 ? `${(myW / total) * 100}%` : '0%',
                      transition: 'width 0.6s ease' }} />
                  </div>
                  <ECSmallCaps color={EC.inkFaint} size={8}>{total} played</ECSmallCaps>
                </div>
              </div>
            );
          })
        ) : (
          /* Global / Weekly rows */
          rows.map((r, i) => {
            const isMe = r.user_id === userId;
            const val  = tab === 'weekly'
              ? `${(r.score || 0).toLocaleString()} · ${r.games_played ?? 0}g`
              : (r.score || 0).toLocaleString();
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
                <ECMono color={isMe ? EC.teal : EC.ink} size={13}>{val}</ECMono>
              </div>
            );
          })
        )}
        <div style={{ height: 20 }} />
      </div>

      <div style={{ padding: '10px 24px 28px' }}>
        <button onClick={onBack} style={{ width: '100%', height: 48, background: 'transparent',
          color: EC.inkSoft, border: `1px solid ${EC.creamLine}`, borderRadius: 6,
          fontFamily: ecSerif, fontSize: 17, cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );
}
