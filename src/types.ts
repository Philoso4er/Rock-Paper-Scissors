export type EmojiType = 'rock' | 'paper' | 'scissors';

export interface Entity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: EmojiType;
  radius: number;
}

export interface GameSettings {
  rockCount: number;
  paperCount: number;
  scissorsCount: number;
  mode: 'last-man-standing' | 'timed';
  timeLimit: number; // in seconds
  speed: number;
  background: string | null;
}

export const EMOJI_MAP: Record<EmojiType, string> = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️',
};

export const STRENGTH_MAP: Record<EmojiType, EmojiType> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};
