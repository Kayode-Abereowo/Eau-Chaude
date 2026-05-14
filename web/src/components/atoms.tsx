import React, { CSSProperties } from 'react';
import { EC, ecSerif, ecMono } from '../constants';

interface SmallCapsProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  tracking?: number;
  weight?: number;
  style?: CSSProperties;
}
export function ECSmallCaps({ children, color = EC.inkSoft, size = 10, tracking = 0.22, weight = 500, style: s = {} }: SmallCapsProps) {
  return (
    <span style={{ fontFamily: ecSerif, fontWeight: weight, fontSize: size, letterSpacing: `${tracking}em`, textTransform: 'uppercase', color, ...s }}>
      {children}
    </span>
  );
}

interface MonoProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: CSSProperties;
}
export function ECMono({ children, color = EC.ink, size = 12, style: s = {} }: MonoProps) {
  return (
    <span style={{ fontFamily: ecMono, fontSize: size, color, fontWeight: 400, letterSpacing: '0.04em', ...s }}>
      {children}
    </span>
  );
}

interface HairProps {
  color?: string;
  vertical?: boolean;
  length?: number;
  style?: CSSProperties;
}
export function ECHair({ color, vertical, length = 12, style: s = {} }: HairProps) {
  const c = color || EC.creamLine;
  return vertical
    ? <div style={{ width: 1, height: length, background: c, flexShrink: 0, ...s }} />
    : <div style={{ height: 1, width: length, background: c, ...s }} />;
}

interface MonogramProps { color?: string; size?: number; }
export function ECMonogram({ color = EC.teal, size = 18 }: MonogramProps) {
  return (
    <span style={{ fontFamily: ecSerif, fontWeight: 500, fontSize: size, color, letterSpacing: '0.04em', fontStyle: 'italic', lineHeight: 1 }}>
      É&nbsp;c
    </span>
  );
}

interface PageHeaderProps {
  left: string;
  right: string;
  dark?: boolean;
  padTop?: number;
}
export function ECPageHeader({ left, right, dark, padTop = 70 }: PageHeaderProps) {
  const c    = dark ? EC.onTealSoft : EC.inkSoft;
  const line = dark ? EC.tealLine   : EC.creamLine;
  return (
    <div style={{ padding: `${padTop}px 28px 0` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ECSmallCaps color={c}>{left}</ECSmallCaps>
        <ECSmallCaps color={c}>{right}</ECSmallCaps>
      </div>
      <div style={{ height: 1, background: line, marginTop: 10 }} />
    </div>
  );
}

export function Spinner({ dark }: { dark?: boolean }) {
  const c = dark ? EC.onTealSoft : EC.inkFaint;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}>
      <svg width="28" height="28" viewBox="0 0 28 28" style={{ animation: 'spin 1s linear infinite' }}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <circle cx="14" cy="14" r="11" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="52" strokeDashoffset="20" strokeLinecap="round" />
      </svg>
    </div>
  );
}
