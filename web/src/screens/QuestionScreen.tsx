import { useState, useEffect, useRef } from 'react';
import { EC, ecSerif, LETTERS, type Question } from '../constants';
import { ECSmallCaps, ECMono, ECHair } from '../components/atoms';
import { TimerArc } from '../components/TimerArc';
import { AnswerTile } from '../components/AnswerTile';

interface Props {
  question: Question;
  qIndex: number;
  totalQs: number;
  score: number;
  difficulty: string;
  timerTotal: number;
  onAnswer: (isCorrect: boolean, pts: number, timeAtAnswer: number) => void;
  onExit: () => void;
  opponentScore?: number;
}

export function QuestionScreen({ question, qIndex, totalQs, score, difficulty, timerTotal, onAnswer, onExit, opponentScore }: Props) {
  const [timeLeft, setTimeLeft] = useState(timerTotal);
  const [chosen,   setChosen]   = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const personal = !!question.personal;
  const dark     = personal;

  useEffect(() => {
    setTimeLeft(timerTotal);
    setChosen(null);
    setRevealed(false);
  }, [question, timerTotal]);

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
    const tl = timeLeft;
    setChosen(idx); setRevealed(true);
    const correct = idx === question.correct_index;
    const base    = difficulty === 'Hard' ? 300 : difficulty === 'Medium' ? 200 : 100;
    const pts     = correct ? base + Math.round(base * (tl / timerTotal) * 0.5) : 0;
    setTimeout(() => onAnswer(correct, pts, tl), 950);
  }

  function tileState(idx: number): 'idle' | 'selected' | 'correct' | 'wrong' {
    if (!revealed) return chosen === idx ? 'selected' : 'idle';
    if (idx === question.correct_index) return 'correct';
    if (idx === chosen && idx !== question.correct_index) return 'wrong';
    return 'idle';
  }

  return (
    <div style={{ width: '100%', height: '100%', background: dark ? EC.tealDeep : EC.cream,
      display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '54px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span onClick={onExit} style={{ fontFamily: ecSerif, fontSize: 20,
              color: dark ? EC.onTealSoft : EC.inkSoft, cursor: 'pointer' }}>←</span>
            <ECHair vertical length={14} color={dark ? EC.tealLine : EC.creamLine} />
            <ECSmallCaps color={dark ? EC.onTealSoft : EC.inkSoft} size={10}>
              {personal ? 'A personal question' : difficulty}
            </ECSmallCaps>
          </div>
          <TimerArc remaining={timeLeft} timerTotal={timerTotal} dark={dark} />
        </div>
        <div style={{ height: 1, background: dark ? EC.tealLine : EC.creamLine, marginTop: 14 }} />
      </div>

      <div style={{ padding: '14px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ECSmallCaps color={dark ? EC.onTealFaint : EC.inkFaint} size={10}>
          Question {String(qIndex + 1).padStart(2, '0')} / {totalQs}
        </ECSmallCaps>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <ECSmallCaps color={dark ? EC.onTealFaint : EC.inkFaint} size={10}>Score</ECSmallCaps>
            <ECMono color={dark ? EC.cream : EC.ink} size={13}>{String(score).padStart(4, '0')}</ECMono>
          </div>
          {opponentScore !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <ECHair vertical length={12} color={dark ? EC.tealLine : EC.creamLine} />
              <ECSmallCaps color={dark ? EC.onTealFaint : EC.inkFaint} size={9}>Opp.</ECSmallCaps>
              <ECMono color={dark ? EC.onTealSoft : EC.inkSoft} size={12}>{String(opponentScore).padStart(4, '0')}</ECMono>
            </div>
          )}
        </div>
      </div>

      {personal && (
        <div style={{ padding: '16px 28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: EC.cream, opacity: 0.7, fontFamily: ecSerif, fontSize: 14 }}>♥</span>
          <ECSmallCaps color={EC.onTealSoft} size={9}>For Claude — from Eau</ECSmallCaps>
        </div>
      )}

      <div style={{ padding: '20px 28px 18px' }}>
        <div style={{ fontFamily: ecSerif, fontWeight: 400, fontSize: personal ? 23 : 26,
          lineHeight: 1.22, color: dark ? EC.cream : EC.ink, letterSpacing: '-0.005em' }}>
          {question.question}
        </div>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        {question.answers.map((ans, i) => (
          <AnswerTile key={i} letter={LETTERS[i]} text={ans} state={tileState(i)} dark={dark}
            onClick={revealed ? undefined : () => handleSelect(i)} />
        ))}
      </div>

      <div style={{ padding: '12px 28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ECSmallCaps color={dark ? EC.onTealFaint : EC.inkFaint} size={9}>
          {personal ? 'Personal · Sparingly served' : 'Progress'}
        </ECSmallCaps>
        {!personal && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 180 }}>
            {Array.from({ length: totalQs }).map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: 6,
                background: i < qIndex ? EC.teal : EC.creamLine }} />
            ))}
          </div>
        )}
        {personal && <ECSmallCaps color={EC.onTealFaint} size={9}>+200 if correct</ECSmallCaps>}
      </div>
    </div>
  );
}
