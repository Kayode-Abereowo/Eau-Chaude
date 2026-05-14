import { EC, ecSerif, type Category } from '../constants';
import { ECMonogram, ECSmallCaps, Spinner } from '../components/atoms';

interface Props { category?: Category | null; }

export function LoadingScreen({ category }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <ECMonogram color={EC.teal} size={22} />
      <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 17, color: EC.inkSoft }}>
        Assembling your questions…
      </div>
      <Spinner />
      {category && <ECSmallCaps color={EC.inkFaint} size={9}>{category.name}</ECSmallCaps>}
    </div>
  );
}
