import { EC, ecSerif } from '../constants';
import { ECSmallCaps } from './atoms';

type TileState = 'idle' | 'selected' | 'correct' | 'wrong';

interface Props {
  letter: string;
  text: string;
  state?: TileState;
  dark?: boolean;
  onClick?: () => void;
}

export function AnswerTile({ letter, text, state = 'idle', dark, onClick }: Props) {
  let bg   = 'transparent';
  let bord = dark ? 'rgba(244,238,230,0.22)' : EC.creamLine;

  if (state === 'selected')      { bord = dark ? EC.cream : EC.ink; }
  else if (state === 'correct')  { bord = dark ? EC.cream : EC.teal; bg = dark ? 'rgba(244,238,230,0.08)' : EC.tealSoft; }
  else if (state === 'wrong')    { bord = EC.heart; bg = 'rgba(182,91,92,0.07)'; }

  return (
    <div onClick={onClick} style={{ border: `1px solid ${bord}`, borderRadius: 5, padding: '14px 16px',
      background: bg, display: 'flex', alignItems: 'center', gap: 14,
      cursor: onClick ? 'pointer' : 'default', transition: 'background 0.18s, border-color 0.18s' }}>
      <ECSmallCaps color={dark ? EC.onTealSoft : EC.inkFaint} size={10} tracking={0.28}>{letter}</ECSmallCaps>
      <div style={{ flex: 1, fontFamily: ecSerif, fontSize: 17, color: dark ? EC.cream : EC.ink, lineHeight: 1.25 }}>{text}</div>
    </div>
  );
}
