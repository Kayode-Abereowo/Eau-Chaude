import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { EC } from '../constants';
import { ECMono } from './atoms';

interface TimerArcProps {
  remaining: number;
  timerTotal: number;
  dark?: boolean;
}

export function TimerArc({ remaining, timerTotal, dark }: TimerArcProps) {
  const r    = 22;
  const circ = 2 * Math.PI * r;
  const pct  = remaining / timerTotal;
  const off  = circ * (1 - pct);
  const stroke = pct > 0.4
    ? (dark ? EC.cream : EC.teal)
    : pct > 0.2 ? '#E09A3A' : '#B65B5C';

  return (
    <View style={{ width: 54, height: 54, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={54} height={54} viewBox="0 0 54 54"
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={27} cy={27} r={r} fill="none"
          stroke={dark ? 'rgba(244,238,230,0.18)' : EC.creamLine}
          strokeWidth={1.5} />
        <Circle cx={27} cy={27} r={r} fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          strokeDasharray={`${circ}`}
          strokeDashoffset={off}
          strokeLinecap="round" />
      </Svg>
      <ECMono color={dark ? EC.cream : EC.ink} size={15}>{remaining}</ECMono>
    </View>
  );
}
