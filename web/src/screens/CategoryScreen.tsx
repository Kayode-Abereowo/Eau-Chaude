import { useState } from 'react';
import { EC, ecSerif } from '../constants';
import { ECPageHeader, ECSmallCaps } from '../components/atoms';

const Q_COUNTS = [5, 10, 15, 20, 25];

interface Props {
  onBegin: (difficulty: string, count: number) => void;
  mode?: 'solo' | 'h2h';
}

export function CategoryScreen({ onBegin, mode = 'solo' }: Props) {
  const [difficulty,    setDifficulty]    = useState('Medium');
  const [questionCount, setQuestionCount] = useState(10);

  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader
        left={`${mode === 'h2h' ? 'Match' : 'Solo'} · Setup`}
        right="Configure your game"
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px' }}>
        <div style={{ fontFamily: ecSerif, fontSize: 34, lineHeight: 1.05, color: EC.ink, letterSpacing: '-0.01em' }}>
          Ready to play<br />
          <em style={{ color: EC.teal, fontStyle: 'italic' }}>tonight</em>?
        </div>
        <div style={{ marginTop: 10, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14, color: EC.inkSoft, lineHeight: 1.5 }}>
          Questions are drawn at random from across all fourteen subjects.
        </div>

        <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Difficulty */}
          <div>
            <ECSmallCaps color={EC.inkFaint} size={9}>Difficulty</ECSmallCaps>
            <div style={{ marginTop: 10, display: 'flex', border: `1px solid ${EC.creamLine}`, borderRadius: 6, overflow: 'hidden' }}>
              {['Gentle', 'Medium', 'Hard'].map((d, i) => (
                <div key={d} onClick={() => setDifficulty(d)} style={{
                  flex: 1, padding: '13px 0', textAlign: 'center',
                  fontFamily: ecSerif, fontSize: 16,
                  background: difficulty === d ? EC.ink : 'transparent',
                  color: difficulty === d ? EC.cream : EC.inkSoft,
                  borderLeft: i > 0 ? `1px solid ${EC.creamLine}` : 'none',
                  cursor: 'pointer', transition: 'background 0.15s' }}>
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div>
            <ECSmallCaps color={EC.inkFaint} size={9}>Number of questions</ECSmallCaps>
            <div style={{ marginTop: 10, display: 'flex', border: `1px solid ${EC.creamLine}`, borderRadius: 6, overflow: 'hidden' }}>
              {Q_COUNTS.map((c, i) => (
                <div key={c} onClick={() => setQuestionCount(c)} style={{
                  flex: 1, padding: '13px 0', textAlign: 'center',
                  fontFamily: ecSerif, fontSize: 16,
                  background: questionCount === c ? EC.ink : 'transparent',
                  color: questionCount === c ? EC.cream : EC.inkSoft,
                  borderLeft: i > 0 ? `1px solid ${EC.creamLine}` : 'none',
                  cursor: 'pointer', transition: 'background 0.15s' }}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px 36px' }}>
        <button onClick={() => onBegin(difficulty, questionCount)} style={{
          width: '100%', height: 56,
          background: EC.teal, color: EC.cream, border: 'none', borderRadius: 6,
          fontFamily: ecSerif, fontSize: 18, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 22px', cursor: 'pointer' }}>
          <span>{mode === 'h2h' ? 'Create match' : 'Begin'} · {questionCount} questions</span>
          <span style={{ fontSize: 20 }}>→</span>
        </button>
      </div>
    </div>
  );
}
