export type EmojiType = 'rock' | 'paper' | 'scissors';
export type MoodState = 'dominant' | 'confident' | 'neutral' | 'worried' | 'desperate';

export interface Entity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: EmojiType;
  radius: number;
  wanderAngle: number;
  convertCooldown: number;
  pulseTimer: number;
}

export interface GameSettings {
  rockCount: number;
  paperCount: number;
  scissorsCount: number;
  mode: 'last-man-standing' | 'timed';
  timeLimit: number;
  speed: 'chill' | 'heated' | 'chaotic';
  background: string | null;
  chosenAlliance: EmojiType | null;
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

export const SPEED_MAP: Record<GameSettings['speed'], number> = {
  chill: 0.6,
  heated: 1.2,
  chaotic: 2.4,
};

// Mood face SVG paths — inline drawn faces per mood per type
export const MOOD_LABEL: Record<MoodState, string> = {
  dominant: 'DOMINANT',
  confident: 'CONFIDENT',
  neutral: 'NEUTRAL',
  worried: 'WORRIED',
  desperate: 'DESPERATE',
};

export const TEAM_NAMES: Record<EmojiType, string> = {
  rock: 'Team Rock',
  paper: 'Team Paper',
  scissors: 'Team Scissors',
};

export const TEAM_COLORS: Record<EmojiType, { primary: string; glow: string; text: string }> = {
  rock:     { primary: '#6b7280', glow: '#9ca3af', text: '#f3f4f6' },
  paper:    { primary: '#3b82f6', glow: '#93c5fd', text: '#eff6ff' },
  scissors: { primary: '#ef4444', glow: '#fca5a5', text: '#fef2f2' },
};
