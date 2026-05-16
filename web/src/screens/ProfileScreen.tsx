import { useState, useEffect } from 'react';
import { EC, ecSerif, CATEGORIES_LIST, type Profile, type Badge } from '../constants';
import { ECPageHeader, ECSmallCaps, ECMono, Spinner } from '../components/atoms';
import { sb } from '../supabase';

interface Props {
  userId: string;
  profile: Profile | null;
  allBadges: Badge[];
  onBack: () => void;
}

const TM_ROSE = '#B65B5C';

export function ProfileScreen({ userId, profile, allBadges, onBack }: Props) {
  const [userBadges, setUserBadges] = useState<{ badge_id: string }[]>([]);
  const [catBests,   setCatBests]   = useState<{ category_id: number; score: number }[]>([]);
  const [h2hRecord,  setH2hRecord]  = useState<{ wins: number; losses: number } | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [debts, setDebts] = useState<{
    id: string; session_id: string;
    debtor_user_id: string; creditor_user_id: string;
    debtor_name: string; creditor_name: string;
    request_text: string; is_paid: boolean;
    created_at: string;
  }[]>([]);

  useEffect(() => {
    (async () => {
      sb.from('toi_moi_debts').select('*')
        .or(`debtor_user_id.eq.${userId},creditor_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .then(({ data }) => setDebts((data as any[]) || []));

      const [{ data: ub }, { data: pb }, { data: h2hRows }] = await Promise.all([
        sb.from('user_badges').select('badge_id,earned_at').eq('user_id', userId),
        sb.from('personal_bests').select('category_id,score').eq('user_id', userId).order('score', { ascending: false }),
        sb.from('h2h_records').select('wins,losses').eq('user_id', userId),
      ]);
      setUserBadges((ub as any[]) || []);
      setCatBests((pb as any[]) || []);
      const rows = (h2hRows as { wins: number; losses: number }[]) || [];
      setH2hRecord(rows.length > 0
        ? { wins: rows.reduce((s, r) => s + r.wins, 0), losses: rows.reduce((s, r) => s + r.losses, 0) }
        : null
      );
      setLoading(false);
    })();
  }, [userId]);

  const earnedIds = new Set(userBadges.map(b => b.badge_id));

  async function markDebtPaid(debtId: string) {
    await sb.from('toi_moi_debts').update({ is_paid: true, paid_at: new Date().toISOString() }).eq('id', debtId);
    setDebts(prev => prev.map(d => d.id === debtId ? { ...d, is_paid: true } : d));
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader left="No. 007" right="Your record" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        {/* Identity */}
        <div style={{ padding: '20px 0 16px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%',
            border: `1px solid ${EC.creamLine}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 26, color: EC.teal }}>
              {(profile?.display_name || '?')[0]}
            </span>
          </div>
          <div style={{ fontFamily: ecSerif, fontSize: 22, color: EC.ink }}>{profile?.display_name || '—'}</div>
          <div style={{ marginTop: 4 }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>Member · Eau Claude</ECSmallCaps>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', border: `1px solid ${EC.creamLine}`, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
          {[
            { label: 'Best score', val: (profile?.personal_best || 0).toLocaleString() },
            { label: 'Streak',     val: `${profile?.current_streak || 0}d` },
            { label: 'H2H wins',   val: String(h2hRecord?.wins || 0) },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '12px 8px', textAlign: 'center',
              borderLeft: i > 0 ? `1px solid ${EC.creamLine}` : 'none' }}>
              <ECSmallCaps color={EC.inkFaint} size={8}>{s.label}</ECSmallCaps>
              <div style={{ marginTop: 5 }}><ECMono color={EC.ink} size={14}>{s.val}</ECMono></div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <ECSmallCaps color={EC.inkFaint} size={9}>Badges ({earnedIds.size} / {allBadges.length})</ECSmallCaps>
        {loading ? <Spinner /> : (
          <div style={{ marginTop: 10, border: `1px solid ${EC.creamLine}`, borderRadius: 6,
            overflow: 'hidden', marginBottom: 20 }}>
            {allBadges.map((b, i) => {
              const earned = earnedIds.has(b.id);
              return (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px', opacity: earned ? 1 : 0.38,
                  borderTop: i > 0 ? `1px solid ${EC.creamLine}` : 'none' }}>
                  <span style={{ fontFamily: ecSerif, fontSize: 16,
                    color: earned ? EC.teal : EC.inkFaint, minWidth: 28 }}>{b.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: ecSerif, fontSize: 14, color: EC.ink }}>{b.name}</div>
                    <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 11, color: EC.inkSoft }}>{b.description}</div>
                  </div>
                  {earned && <ECSmallCaps color={EC.teal} size={8}>Earned</ECSmallCaps>}
                </div>
              );
            })}
          </div>
        )}

        {/* Category personal bests */}
        {catBests.length > 0 && (
          <>
            <ECSmallCaps color={EC.inkFaint} size={9}>Personal bests by category</ECSmallCaps>
            <div style={{ marginTop: 10, border: `1px solid ${EC.creamLine}`, borderRadius: 6,
              overflow: 'hidden', marginBottom: 20 }}>
              {catBests.map((pb, i) => {
                const cat = CATEGORIES_LIST.find(c => c.id === pb.category_id);
                return (
                  <div key={pb.category_id} style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '11px 16px',
                    borderTop: i > 0 ? `1px solid ${EC.creamLine}` : 'none' }}>
                    <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14, color: EC.ink }}>
                      {cat?.name || '—'}
                    </div>
                    <ECMono color={EC.ink} size={13}>{pb.score.toLocaleString()}</ECMono>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {/* Toi & Moi Debts */}
        {debts.length > 0 && (
          <>
            <ECSmallCaps color={EC.inkFaint} size={9}>Toi &amp; Moi — debts</ECSmallCaps>

            {/* What you owe */}
            {debts.filter(d => d.debtor_user_id === userId).length > 0 && (
              <>
                <div style={{ marginTop: 10, marginBottom: 4 }}>
                  <ECSmallCaps color={TM_ROSE} size={8}>You owe</ECSmallCaps>
                </div>
                <div style={{ border: `1px solid ${EC.creamLine}`, borderRadius: 6,
                  overflow: 'hidden', marginBottom: 14 }}>
                  {debts.filter(d => d.debtor_user_id === userId).map((d, i, arr) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px 16px', opacity: d.is_paid ? 0.45 : 1,
                      borderTop: i > 0 ? `1px solid ${EC.creamLine}` : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14,
                          color: EC.ink, textDecoration: d.is_paid ? 'line-through' : 'none' }}>
                          {d.request_text}
                        </div>
                        <div style={{ marginTop: 3, fontFamily: ecSerif, fontSize: 11,
                          color: EC.inkFaint }}>Owed to {d.creditor_name}</div>
                      </div>
                      {d.is_paid
                        ? <ECSmallCaps color={EC.inkFaint} size={8}>Paid</ECSmallCaps>
                        : <ECSmallCaps color={TM_ROSE} size={8}>Pending</ECSmallCaps>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* What others owe you */}
            {debts.filter(d => d.creditor_user_id === userId).length > 0 && (
              <>
                <div style={{ marginBottom: 4 }}>
                  <ECSmallCaps color={EC.inkFaint} size={8}>Owed to you</ECSmallCaps>
                </div>
                <div style={{ border: `1px solid ${EC.creamLine}`, borderRadius: 6,
                  overflow: 'hidden', marginBottom: 20 }}>
                  {debts.filter(d => d.creditor_user_id === userId).map((d, i) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px 16px', opacity: d.is_paid ? 0.45 : 1,
                      borderTop: i > 0 ? `1px solid ${EC.creamLine}` : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14,
                          color: EC.ink, textDecoration: d.is_paid ? 'line-through' : 'none' }}>
                          {d.request_text}
                        </div>
                        <div style={{ marginTop: 3, fontFamily: ecSerif, fontSize: 11,
                          color: EC.inkFaint }}>From {d.debtor_name}</div>
                      </div>
                      {d.is_paid ? (
                        <ECSmallCaps color={EC.inkFaint} size={8}>Paid ✓</ECSmallCaps>
                      ) : (
                        <button onClick={() => markDebtPaid(d.id)}
                          style={{ background: 'transparent', border: `1px solid ${EC.creamLine}`,
                            borderRadius: 4, padding: '4px 8px', fontFamily: ecSerif, fontSize: 10,
                            color: EC.inkSoft, cursor: 'pointer', letterSpacing: '0.1em' }}>
                          Mark paid
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div style={{ height: 16 }} />
      </div>

      <div style={{ padding: '10px 24px 28px' }}>
        <button onClick={onBack} style={{ width: '100%', height: 48, background: 'transparent',
          color: EC.inkSoft, border: `1px solid ${EC.creamLine}`, borderRadius: 6,
          fontFamily: ecSerif, fontSize: 17 }}>← Back</button>
      </div>
    </div>
  );
}
