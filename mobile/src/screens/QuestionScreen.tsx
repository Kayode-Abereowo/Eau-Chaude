import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { EC, F, LETTERS, TIMER_TOTAL } from '../constants';
import type { Question } from '../constants';
import { ECHair, ECMono, ECSmallCaps } from '../components/atoms';
import { TimerArc } from '../components/TimerArc';
import { AnswerTile } from '../components/AnswerTile';

interface Props {
  question: Question;
  qIndex: number;
  totalQs: number;
  score: number;
  difficulty: string;
  opponentScore?: number;
  onAnswer: (isCorrect: boolean, pts: number, timeAtAnswer: number) => void;
  onExit: () => void;
}

export function QuestionScreen({ question, qIndex, totalQs, score, difficulty, opponentScore, onAnswer, onExit }: Props) {
  const [timeLeft,  setTimeLeft]  = useState(TIMER_TOTAL);
  const [chosen,    setChosen]    = useState<number | null>(null);
  const [revealed,  setRevealed]  = useState(false);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeAtAnswerRef = useRef(TIMER_TOTAL);

  const personal = !!question.personal;
  const dark     = personal;

  useEffect(() => {
    setTimeLeft(TIMER_TOTAL); setChosen(null); setRevealed(false);
    timeAtAnswerRef.current = TIMER_TOTAL;
  }, [question]);

  useEffect(() => {
    if (revealed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRevealed(true);
          setTimeout(() => onAnswer(false, 0, 0), 1100);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [question, revealed]);

  function handleSelect(idx: number) {
    if (revealed) return;
    clearInterval(timerRef.current!);
    timeAtAnswerRef.current = timeLeft;
    setChosen(idx); setRevealed(true);
    const correct = idx === question.correct_index;
    const base    = difficulty === 'Hard' ? 300 : difficulty === 'Medium' ? 200 : 100;
    const pts     = correct ? base + Math.round(base * (timeLeft / TIMER_TOTAL) * 0.5) : 0;
    setTimeout(() => onAnswer(correct, pts, timeLeft), 950);
  }

  function tileState(idx: number): 'idle' | 'selected' | 'correct' | 'wrong' {
    if (!revealed) return chosen === idx ? 'selected' : 'idle';
    if (idx === question.correct_index) return 'correct';
    if (idx === chosen && idx !== question.correct_index) return 'wrong';
    return 'idle';
  }

  return (
    <View style={{ flex: 1, backgroundColor: dark ? EC.tealDeep : EC.cream }}>
      {/* Top bar */}
      <View style={{ paddingTop: 54, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={onExit} hitSlop={12}>
              <Text style={{ fontFamily: F.serif, fontSize: 20, color: dark ? EC.onTealSoft : EC.inkSoft }}>←</Text>
            </Pressable>
            <ECHair vertical length={14} color={dark ? EC.tealLine : EC.creamLine} />
            <ECSmallCaps color={dark ? EC.onTealSoft : EC.inkSoft} size={10}>
              {personal ? 'A personal question' : difficulty}
            </ECSmallCaps>
          </View>
          <TimerArc remaining={timeLeft} dark={dark} />
        </View>
        <View style={{ height: 1, backgroundColor: dark ? EC.tealLine : EC.creamLine, marginTop: 14 }} />
      </View>

      {/* Progress + score */}
      <View style={{ paddingHorizontal: 28, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ECSmallCaps color={dark ? EC.onTealFaint : EC.inkFaint} size={10}>
          Question {String(qIndex + 1).padStart(2, '0')} / {totalQs}
        </ECSmallCaps>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <ECSmallCaps color={dark ? EC.onTealFaint : EC.inkFaint} size={10}>Score</ECSmallCaps>
            <ECMono color={dark ? EC.cream : EC.ink} size={13}>{String(score).padStart(4, '0')}</ECMono>
          </View>
          {opponentScore !== undefined && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <ECHair vertical length={12} color={dark ? EC.tealLine : EC.creamLine} />
              <ECSmallCaps color={dark ? EC.onTealFaint : EC.inkFaint} size={9}>Opp.</ECSmallCaps>
              <ECMono color={dark ? EC.onTealSoft : EC.inkSoft} size={12}>{String(opponentScore).padStart(4, '0')}</ECMono>
            </View>
          )}
        </View>
      </View>

      {/* Personal indicator */}
      {personal && (
        <View style={{ paddingHorizontal: 28, paddingTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: EC.cream, opacity: 0.7, fontFamily: F.serif, fontSize: 14 }}>♥</Text>
          <ECSmallCaps color={EC.onTealSoft} size={9}>For Claude — from Eau</ECSmallCaps>
        </View>
      )}

      {/* Question text */}
      <View style={{ paddingHorizontal: 28, paddingTop: 18, paddingBottom: 14 }}>
        <Text style={{ fontFamily: F.serif, fontSize: personal ? 22 : 24, lineHeight: personal ? 28 : 30,
          color: dark ? EC.cream : EC.ink, letterSpacing: -0.1 }}>
          {question.question}
        </Text>
      </View>

      {/* Answer tiles */}
      <View style={{ flex: 1, paddingHorizontal: 24, gap: 9 }}>
        {question.answers.map((ans, i) => (
          <AnswerTile key={i} letter={LETTERS[i]} text={ans} state={tileState(i)} dark={dark}
            onPress={revealed ? undefined : () => handleSelect(i)} />
        ))}
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ECSmallCaps color={dark ? EC.onTealFaint : EC.inkFaint} size={9}>
          {personal ? 'Personal · Sparingly served' : 'Streak'}
        </ECSmallCaps>
        {!personal && (
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={{ width: 6, height: 6, borderRadius: 3,
                backgroundColor: i < qIndex ? EC.teal : EC.creamLine }} />
            ))}
          </View>
        )}
        {personal && <ECSmallCaps color={EC.onTealFaint} size={9}>+200 if correct</ECSmallCaps>}
      </View>
    </View>
  );
}
