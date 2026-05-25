import React from 'react';
import { EmojiType, MoodState } from '../types';

interface MoodFaceProps {
  type: EmojiType;
  mood: MoodState;
  size?: number;
  className?: string;
}

// Eye & expression overlay drawn on top of the actual emoji
const ExpressionOverlay: React.FC<{
  mood: MoodState;
  size: number;
  type: EmojiType;
}> = ({ mood, size, type }) => {
  const s  = size;
  const cx = s / 2;

  // Each type has a different "face zone" — where the eyes/mouth sit
  // based on where the natural face area of the emoji would be
  const faceZone: Record<EmojiType, { eyeY: number; mouthY: number; spread: number; scale: number }> = {
    rock:     { eyeY: s * 0.38, mouthY: s * 0.62, spread: s * 0.14, scale: 1    },
    paper:    { eyeY: s * 0.40, mouthY: s * 0.62, spread: s * 0.12, scale: 0.9  },
    scissors: { eyeY: s * 0.30, mouthY: s * 0.50, spread: s * 0.11, scale: 0.85 },
  };

  const zone   = faceZone[type];
  const eyeY   = zone.eyeY;
  const mouthY = zone.mouthY;
  const spread = zone.spread;
  const er     = s * 0.052 * zone.scale; // eye radius
  const pw     = s * 0.048 * zone.scale; // pupil radius
  const mw     = spread * 0.88;           // mouth half-width
  const bw     = spread * 0.72;           // brow half-width
  const browY  = eyeY - er * 2.2;

  // Pupil offset direction per mood
  const pupilOffset: Record<MoodState, { dx: number; dy: number }> = {
    dominant:  { dx:  0,           dy: -er * 0.3 },
    confident: { dx:  er * 0.2,    dy: -er * 0.1 },
    neutral:   { dx:  0,           dy:  0         },
    worried:   { dx: -er * 0.15,   dy:  er * 0.2  },
    desperate: { dx:  0,           dy:  er * 0.35 },
  };
  const pd = pupilOffset[mood];

  // Brow inner vertical shift per mood (- = up = angry, + = down = sad)
  const browShift: Record<MoodState, { lInner: number; rInner: number }> = {
    dominant:  { lInner: -er * 1.2, rInner: -er * 1.2 }, // angry V
    confident: { lInner: -er * 0.5, rInner: -er * 0.5 }, // slight anger
    neutral:   { lInner:  0,         rInner:  0         },
    worried:   { lInner:  er * 0.9,  rInner:  er * 0.9  }, // sad /\ 
    desperate: { lInner:  er * 1.4,  rInner:  er * 1.4  }, // very sad
  };
  const bs = browShift[mood];

  // Mouth shapes
  const mouths: Record<MoodState, React.ReactNode> = {
    dominant: (
      // Big evil grin
      <path
        d={`M ${cx - mw} ${mouthY} Q ${cx} ${mouthY + mw * 0.7} ${cx + mw} ${mouthY}`}
        stroke="white" strokeWidth={s * 0.032} fill="none"
        strokeLinecap="round" filter="url(#shadow)"
      />
    ),
    confident: (
      // Smirk — one side lifted
      <path
        d={`M ${cx - mw * 0.6} ${mouthY + er * 0.4} Q ${cx + mw * 0.2} ${mouthY + mw * 0.45} ${cx + mw * 0.75} ${mouthY - er * 0.2}`}
        stroke="white" strokeWidth={s * 0.028} fill="none"
        strokeLinecap="round" filter="url(#shadow)"
      />
    ),
    neutral: (
      <line
        x1={cx - mw * 0.65} y1={mouthY} x2={cx + mw * 0.65} y2={mouthY}
        stroke="white" strokeWidth={s * 0.026} strokeLinecap="round" filter="url(#shadow)"
      />
    ),
    worried: (
      // Slight frown
      <path
        d={`M ${cx - mw * 0.75} ${mouthY - er * 0.1} Q ${cx} ${mouthY + mw * 0.38} ${cx + mw * 0.75} ${mouthY - er * 0.1}`}
        stroke="white" strokeWidth={s * 0.028} fill="none"
        strokeLinecap="round" filter="url(#shadow)"
      />
    ),
    desperate: (
      // Wide open frown
      <path
        d={`M ${cx - mw} ${mouthY + er * 0.2} Q ${cx} ${mouthY - mw * 0.55} ${cx + mw} ${mouthY + er * 0.2}`}
        stroke="white" strokeWidth={s * 0.032} fill="none"
        strokeLinecap="round" filter="url(#shadow)"
      />
    ),
  };

  const lx = cx - spread;
  const rx = cx + spread;

  return (
    <svg
      width={s} height={s}
      viewBox={`0 0 ${s} ${s}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(0,0,0,0.8)" floodOpacity="1"/>
        </filter>
      </defs>

      {/* LEFT eyebrow */}
      <line
        x1={lx - bw * 0.5} y1={browY}
        x2={lx + bw * 0.5} y2={browY + bs.lInner}
        stroke="white" strokeWidth={s * 0.038} strokeLinecap="round"
        filter="url(#shadow)"
      />
      {/* RIGHT eyebrow */}
      <line
        x1={rx - bw * 0.5} y1={browY + bs.rInner}
        x2={rx + bw * 0.5} y2={browY}
        stroke="white" strokeWidth={s * 0.038} strokeLinecap="round"
        filter="url(#shadow)"
      />

      {/* LEFT eye white */}
      <ellipse cx={lx} cy={eyeY} rx={er} ry={er * 1.15} fill="white" filter="url(#shadow)"/>
      {/* LEFT pupil */}
      <ellipse cx={lx + pd.dx} cy={eyeY + pd.dy} rx={pw * 0.6} ry={pw * 0.75} fill="#1a1a2e"/>
      {/* LEFT shine */}
      <circle cx={lx + pd.dx + er * 0.25} cy={eyeY + pd.dy - er * 0.28} r={er * 0.22} fill="white"/>

      {/* RIGHT eye white */}
      <ellipse cx={rx} cy={eyeY} rx={er} ry={er * 1.15} fill="white" filter="url(#shadow)"/>
      {/* RIGHT pupil */}
      <ellipse cx={rx + pd.dx} cy={eyeY + pd.dy} rx={pw * 0.6} ry={pw * 0.75} fill="#1a1a2e"/>
      {/* RIGHT shine */}
      <circle cx={rx + pd.dx + er * 0.25} cy={eyeY + pd.dy - er * 0.28} r={er * 0.22} fill="white"/>

      {/* Mouth */}
      {mouths[mood]}

      {/* Desperate: sweat drop */}
      {mood === 'desperate' && (
        <ellipse
          cx={rx + er * 1.5} cy={eyeY - er * 0.6}
          rx={er * 0.38} ry={er * 0.65}
          fill="#60a5fa" opacity={0.9} filter="url(#shadow)"
        />
      )}

      {/* Dominant: star sparkles */}
      {mood === 'dominant' && (
        <>
          <text x={lx - er * 2.2} y={eyeY - er * 1.6} fontSize={s * 0.14} fill="#fbbf24" filter="url(#shadow)">★</text>
          <text x={rx + er * 1.0} y={eyeY - er * 1.6} fontSize={s * 0.14} fill="#fbbf24" filter="url(#shadow)">★</text>
        </>
      )}

      {/* Worried: wavy lines on forehead */}
      {mood === 'worried' && (
        <path
          d={`M ${cx - er * 1.2} ${browY - er * 1.4} Q ${cx - er * 0.4} ${browY - er * 2} ${cx + er * 0.4} ${browY - er * 1.4} Q ${cx + er * 1.2} ${browY - er * 0.8} ${cx + er * 1.8} ${browY - er * 1.4}`}
          stroke="white" strokeWidth={s * 0.022} fill="none"
          strokeLinecap="round" opacity={0.7} filter="url(#shadow)"
        />
      )}
    </svg>
  );
};

// The actual emoji rendered large, with expression overlay on top
const MoodFace: React.FC<MoodFaceProps> = ({ type, mood, size = 48 }) => {
  const emojiMap: Record<EmojiType, string> = {
    rock:     '🪨',
    paper:    '📄',
    scissors: '✂️',
  };

  return (
    <div style={{
      width: size,
      height: size,
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {/* The real emoji */}
      <span style={{
        fontSize: size * 0.78,
        lineHeight: 1,
        userSelect: 'none',
        display: 'block',
        // Slight drop shadow so it reads on any background
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
      }}>
        {emojiMap[type]}
      </span>

      {/* Expression overlay */}
      <ExpressionOverlay mood={mood} size={size} type={type} />
    </div>
  );
};

export default MoodFace;
