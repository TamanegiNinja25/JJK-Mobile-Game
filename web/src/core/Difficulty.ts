// Difficulty: one setting for the whole game (not per save), changeable at any time. It scales what curses
// deal and how much they can take; Hard also pays more experience and yen.

export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTY: Record<Difficulty, { label: string; dmg: number; hp: number; reward: number; about: string }> = {
  easy: { label: 'Easy', dmg: 0.6, hp: 0.75, reward: 1, about: 'Curses hit 40% softer and have 25% less health.' },
  normal: { label: 'Normal', dmg: 1, hp: 1, reward: 1, about: 'The game as designed.' },
  hard: { label: 'Hard', dmg: 1.45, hp: 1.35, reward: 1.25, about: 'Curses hit 45% harder and have 35% more health. 25% more EXP and yen.' },
};

let current: Difficulty = 'normal';
export function setDifficulty(d: Difficulty) { current = DIFFICULTY[d] ? d : 'normal'; }
export function difficulty() { return DIFFICULTY[current]; }
export function difficultyId() { return current; }
