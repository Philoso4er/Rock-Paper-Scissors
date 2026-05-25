import React from 'react';
import { EmojiType, MoodState } from '../types';

interface MoodFaceProps {
  type: EmojiType;
  mood: MoodState;
  size?: number;
  className?: string;
}

// Each face is drawn as an SVG with expressive eyes/mouth per mood
const Face: React.FC<{ mood: MoodState; size: number; color: string; accent: string }> = ({ mood, size, color, accent }) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r  = s * 0.42;

  // Eye configs per mood
  const eyes = {
    dominant:  { lx: cx - r*0.32, rx: cx + r*0.32, y: cy - r*0.1,  ry: r*0.09, squint: true,  angry: true  },
    confident: { lx: cx - r*0.32, rx: cx + r*0.32, y: cy - r*0.08, ry: r*0.11, squint: false, angry: false },
    neutral:   { lx: cx - r*0.32, rx: cx + r*0.32, y: cy - r*0.08, ry: r*0.13, squint: false, angry: false },
    worried:   { lx: cx - r*0.32, rx: cx + r*0.32, y: cy - r*0.05, ry: r*0.14, squint: false, angry: false },
    desperate: { lx: cx - r*0.32, rx: cx + r*0.32, y: cy - r*0.02, ry: r*0.15, squint: false, angry: false },
  }[mood];

  // Mouth path per mood
  const mouthY = cy + r * 0.28;
  const mouthW = r * 0.52;
  const mouths: Record<MoodState, React.ReactNode> = {
    dominant:  <path d={`M ${cx-mouthW} ${mouthY} Q ${cx} ${mouthY + r*0.28} ${cx+mouthW} ${mouthY}`} stroke={accent} strokeWidth={s*0.04} fill="none" strokeLinecap="round"/>,
    confident: <path d={`M ${cx-mouthW*0.8} ${mouthY} Q ${cx} ${mouthY + r*0.2} ${cx+mouthW*0.8} ${mouthY}`} stroke={accent} strokeWidth={s*0.035} fill="none" strokeLinecap="round"/>,
    neutral:   <line x1={cx-mouthW*0.7} y1={mouthY+r*0.04} x2={cx+mouthW*0.7} y2={mouthY+r*0.04} stroke={accent} strokeWidth={s*0.032} strokeLinecap="round"/>,
    worried:   <path d={`M ${cx-mouthW*0.8} ${mouthY+r*0.18} Q ${cx} ${mouthY-r*0.08} ${cx+mouthW*0.8} ${mouthY+r*0.18}`} stroke={accent} strokeWidth={s*0.035} fill="none" strokeLinecap="round"/>,
    desperate: <path d={`M ${cx-mouthW} ${mouthY+r*0.26} Q ${cx} ${mouthY-r*0.12} ${cx+mouthW} ${mouthY+r*0.26}`} stroke={accent} strokeWidth={s*0.04} fill="none" strokeLinecap="round"/>,
  };

  // Eyebrow angle per mood
  const browOffset = {
    dominant:  { l: -r*0.14, r: r*0.14 },
    confident: { l: -r*0.06, r: r*0.06 },
    neutral:   { l: 0,        r: 0       },
    worried:   { l: r*0.1,   r: -r*0.1  },
    desperate: { l: r*0.18,  r: -r*0.18 },
  }[mood];

  const browY = eyes.y - eyes.ry - r*0.1;
  const browW = r * 0.28;

  // Sweat drop for desperate
  const sweat = mood === 'desperate' && (
    <ellipse cx={cx + r*0.55} cy={cy - r*0.2} rx={r*0.06} ry={r*0.1} fill="#60a5fa" opacity={0.85}/>
  );

  // Stars for dominant
  const stars = mood === 'dominant' && (
    <>
      <text x={cx - r*0.68} y={cy - r*0.55} fontSize={s*0.14} fill="#fbbf24">★</text>
      <text x={cx + r*0.52} y={cy - r*0.55} fontSize={s*0.14} fill="#fbbf24">★</text>
    </>
  );

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      {/* Face circle */}
      <circle cx={cx} cy={cy} r={r} fill={color} stroke={accent} strokeWidth={s*0.03}/>

      {/* Eyebrows */}
      <line
        x1={eyes.lx - browW} y1={browY + browOffset.l}
        x2={eyes.lx + browW} y2={browY - browOffset.l}
        stroke={accent} strokeWidth={s*0.04} strokeLinecap="round"
      />
      <line
        x1={eyes.rx - browW} y1={browY - browOffset.r}
        x2={eyes.rx + browW} y2={browY + browOffset.r}
        stroke={accent} strokeWidth={s*0.04} strokeLinecap="round"
      />

      {/* Eyes */}
      {eyes.squint ? (
        <>
          <line x1={eyes.lx - r*0.14} y1={eyes.y} x2={eyes.lx + r*0.14} y2={eyes.y} stroke={accent} strokeWidth={s*0.045} strokeLinecap="round"/>
          <line x1={eyes.rx - r*0.14} y1={eyes.y} x2={eyes.rx + r*0.14} y2={eyes.y} stroke={accent} strokeWidth={s*0.045} strokeLinecap="round"/>
        </>
      ) : (
        <>
          <ellipse cx={eyes.lx} cy={eyes.y} rx={r*0.13} ry={eyes.ry} fill={accent}/>
          <ellipse cx={eyes.rx} cy={eyes.y} rx={r*0.13} ry={eyes.ry} fill={accent}/>
          {/* Shine */}
          <circle cx={eyes.lx + r*0.05} cy={eyes.y - eyes.ry*0.35} r={r*0.04} fill="white"/>
          <circle cx={eyes.rx + r*0.05} cy={eyes.y - eyes.ry*0.35} r={r*0.04} fill="white"/>
        </>
      )}

      {/* Mouth */}
      {mouths[mood]}

      {/* Extras */}
      {sweat}
      {stars}
    </svg>
  );
};

const TYPE_STYLES: Record<EmojiType, { bg: string; accent: string; shape: 'circle' | 'square' | 'diamond' }> = {
  rock:     { bg: '#4b5563', accent: '#f9fafb', shape: 'circle'  },
  paper:    { bg: '#e5e7eb', accent: '#1f2937', shape: 'square'  },
  scissors: { bg: '#1f2937', accent: '#f87171', shape: 'circle'  },
};

const MoodFace: React.FC<MoodFaceProps> = ({ type, mood, size = 48, className = '' }) => {
  const { bg, accent } = TYPE_STYLES[type];
  return (
    <div className={className} style={{ width: size, height: size, display: 'inline-block' }}>
      <Face mood={mood} size={size} color={bg} accent={accent} />
    </div>
  );
};

export default MoodFace;
