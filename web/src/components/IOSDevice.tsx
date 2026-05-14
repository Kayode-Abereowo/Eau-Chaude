import React from 'react';
import { EC } from '../constants';

function IOSStatusBar({ dark = false }: { dark?: boolean }) {
  const c = dark ? '#fff' : '#000';
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px 0', height: 48 }}>
      <span style={{ fontFamily: '-apple-system,system-ui', fontWeight: 590, fontSize: 15, letterSpacing: '-0.3px', color: c }}>9:41</span>
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 34, borderRadius: 20, background: '#000', zIndex: 40 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
          <rect x="0"    y="7"   width="3" height="4"   rx="0.6" fill={c} opacity="0.4"/>
          <rect x="4.5"  y="4.5" width="3" height="6.5" rx="0.6" fill={c} opacity="0.6"/>
          <rect x="9"    y="2"   width="3" height="9"   rx="0.6" fill={c} opacity="0.8"/>
          <rect x="13.5" y="0"   width="3" height="11"  rx="0.6" fill={c}/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke={c} strokeOpacity="0.35"/>
          <rect x="2" y="2" width="17" height="8" rx="2" fill={c}/>
          <path d="M23 4v4c.8-.4 1.4-1.1 1.4-2s-.6-1.6-1.4-2Z" fill={c} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

interface Props { children: React.ReactNode; dark?: boolean; }

export function IOSDevice({ children, dark = false }: Props) {
  return (
    <div style={{ width: 402, height: 874, borderRadius: 52, overflow: 'hidden',
      position: 'relative', background: dark ? EC.tealDeep : EC.cream,
      boxShadow: '0 40px 80px rgba(0,0,0,0.22), 0 0 0 1.5px rgba(0,0,0,0.14)', flexShrink: 0 }}>
      <IOSStatusBar dark={dark} />
      <div style={{ height: '100%', position: 'relative', zIndex: 1 }}>{children}</div>
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 139, height: 5, borderRadius: 100,
        background: dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.18)',
        zIndex: 50, pointerEvents: 'none' }} />
    </div>
  );
}
