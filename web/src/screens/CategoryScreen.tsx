import { useState } from 'react';
import { EC, ecSerif, CATEGORIES_LIST, type Category } from '../constants';
import { ECPageHeader, ECSmallCaps, ECMono } from '../components/atoms';

interface CardProps {
  n: string; name: string; count: number; selected: boolean; onClick: () => void;
}
function CategoryCard({ n, name, count, selected, onClick }: CardProps) {
  return (
    <div onClick={onClick} style={{ flex: 1, minWidth: 0, height: 94,
      border: `1px solid ${selected ? EC.teal : EC.creamLine}`,
      background: selected ? EC.tealSoft : 'transparent', borderRadius: 4, padding: '11px 12px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}>
      <ECSmallCaps color={selected ? EC.teal : EC.inkFaint} size={9} tracking={0.28}>{n}</ECSmallCaps>
      <div>
        <div style={{ fontFamily: ecSerif, fontWeight: 400, fontSize: 15.5, lineHeight: 1.1, color: EC.ink }}>{name}</div>
        <div style={{ marginTop: 4 }}><ECMono color={EC.inkFaint} size={10}>{count.toLocaleString()}</ECMono></div>
      </div>
    </div>
  );
}

interface Props {
  onBegin: (cat: Category, difficulty: string) => void;
  mode?: 'solo' | 'h2h';
}

export function CategoryScreen({ onBegin, mode = 'solo' }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [difficulty,  setDifficulty]  = useState('Medium');
  const cat = CATEGORIES_LIST[selectedIdx];

  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader left={`${mode === 'h2h' ? 'Match' : 'Solo'} · No. 002`} right="Choose a subject" />
      <div style={{ padding: '22px 28px 8px' }}>
        <div style={{ fontFamily: ecSerif, fontSize: 30, lineHeight: 1.05, color: EC.ink, letterSpacing: '-0.01em' }}>
          What would you<br />like to know <em style={{ color: EC.teal, fontStyle: 'italic' }}>tonight</em>?
        </div>
        <div style={{ marginTop: 8, fontFamily: ecSerif, fontSize: 13, color: EC.inkSoft, fontStyle: 'italic' }}>
          Fourteen subjects. Ten questions each.
        </div>
      </div>
      <div style={{ padding: '0 28px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <ECSmallCaps color={EC.inkFaint} size={9}>Difficulty</ECSmallCaps>
        <div style={{ display: 'flex', border: `1px solid ${EC.creamLine}`, borderRadius: 4, overflow: 'hidden' }}>
          {['Gentle', 'Medium', 'Hard'].map((d, i) => (
            <div key={d} onClick={() => setDifficulty(d)} style={{ padding: '5px 12px',
              fontFamily: ecSerif, fontSize: 12,
              background: difficulty === d ? EC.ink : 'transparent',
              color: difficulty === d ? EC.cream : EC.inkSoft,
              borderLeft: i > 0 ? `1px solid ${EC.creamLine}` : 'none', cursor: 'pointer' }}>
              {d}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: '0 24px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {Array.from({ length: 7 }).map((_, row) => (
            <div key={row} style={{ display: 'flex', gap: 7 }}>
              <CategoryCard {...CATEGORIES_LIST[row * 2]} selected={selectedIdx === row * 2}
                onClick={() => setSelectedIdx(row * 2)} />
              {CATEGORIES_LIST[row * 2 + 1] && (
                <CategoryCard {...CATEGORIES_LIST[row * 2 + 1]} selected={selectedIdx === row * 2 + 1}
                  onClick={() => setSelectedIdx(row * 2 + 1)} />
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '8px 24px 28px' }}>
        <button onClick={() => onBegin(cat, difficulty)} style={{ width: '100%', height: 56,
          background: EC.teal, color: EC.cream, border: 'none', borderRadius: 6,
          fontFamily: ecSerif, fontSize: 18, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 22px' }}>
          <span>Begin {cat.name} · 10 Qs</span>
          <span style={{ fontSize: 20 }}>→</span>
        </button>
      </div>
    </div>
  );
}
