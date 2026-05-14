import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { EC, F, LETTERS } from '../constants';
import { ECSmallCaps } from './atoms';

type TileState = 'idle' | 'selected' | 'correct' | 'wrong';

interface AnswerTileProps {
  letter: string;
  text: string;
  state?: TileState;
  dark?: boolean;
  onPress?: () => void;
}

export function AnswerTile({ letter, text, state = 'idle', dark, onPress }: AnswerTileProps) {
  let bg          = 'transparent';
  let borderColor = dark ? 'rgba(244,238,230,0.22)' : EC.creamLine;

  if (state === 'selected') {
    borderColor = dark ? EC.cream : EC.ink;
  } else if (state === 'correct') {
    borderColor = dark ? EC.cream : EC.teal;
    bg = dark ? 'rgba(244,238,230,0.08)' : EC.tealSoft;
  } else if (state === 'wrong') {
    borderColor = EC.heart;
    bg = 'rgba(182,91,92,0.07)';
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor,
        borderRadius: 5,
        padding: 14,
        backgroundColor: pressed && onPress ? 'rgba(0,0,0,0.03)' : bg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      })}
    >
      <ECSmallCaps color={dark ? EC.onTealSoft : EC.inkFaint} size={10} tracking={0.28}>
        {letter}
      </ECSmallCaps>
      <Text style={{ flex: 1, fontFamily: F.serif, fontSize: 17, color: dark ? EC.cream : EC.ink, lineHeight: 22 }}>
        {text}
      </Text>
    </Pressable>
  );
}
