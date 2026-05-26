import React from 'react';
import { EmojiType, MoodState } from '../types';

interface MoodFaceProps {
  type: EmojiType;
  mood: MoodState;
  size?: number;
  className?: string;
}

const ExpressionOverlay: React.FC<{ mood: MoodState; size: number; type: EmojiType }> = ({ mood, size, type }) => {
  const s  = size;
  const cx = s / 2;

  // Face zones tuned per emoji — where the "face" lives on each icon
  const zone = {
    rock:     { eyeY: s * 0.40, mouthY: s * 0.63, spread: s * 0.155, scale: 1.0  },
    paper:    { eyeY: s * 0.42, mouthY: s * 0.64, spread: s * 0.130, scale: 0.95 },
    scissors: { eyeY: s * 0.32, mouthY: s * 0.52, spread: s * 0.120, scale: 0.90 },
  }[type];

  const { eyeY, mouthY, spread, scale } = zone;

  // Stroke colors — dark outline for light emojis, light for dark
  // paper is light/white so needs DARK strokes; rock & scissors are darker so use light
  const strokeColor  = type === 'paper' ? '#1a1a2e' : '#ffffff';
  const outlineColor = type === 'paper' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';

  const er  = s * 0.064 * scale;  // eye radius — bigger than before
  const pw  = s * 0.044 * scale;  // pupil
  const mw  = spread * 0.9;
  const bw  = spread * 0.68;
  const sw  = s * 0.044;          // stroke width — thicker
  const bsw = s * 0.048;          // brow stroke width
  const browY = eyeY - er * 2.4;
  const lx  = cx - spread;
  const rx  = cx + spread;

  // Pupil direction
  const pd = {
    dominant:  { dx:  0,           dy: -er * 0.25 },
    confident: { dx:  er * 0.22,   dy: -er * 0.1  },
    neutral:   { dx:  0,           dy:  0          },
    worried:   { dx: -er * 0.18,   dy:  er * 0.22  },
    desperate: { dx:  0,           dy:  er * 0.3   },
  }[mood];

  // Brow tilt — inner corner shift
  const bs = {
    dominant:  { lInner: -er * 1.3, rInner: -er * 1.3 },
    confident: { lInner: -er * 0.6, rInner: -er * 0.6 },
    neutral:   { lInner:  0,         rInner:  0         },
    worried:   { lInner:  er * 1.0,  rInner:  er * 1.0  },
    desperate: { lInner:  er * 1.5,  rInner:  er * 1.5  },
  }[mood];

  // Mouth shapes
  const mouth = {
    dominant: (
      <path d={`M ${cx-mw} ${mouthY} Q ${cx} ${mouthY + mw*0.72} ${cx+mw} ${mouthY}`}
        stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round"/>
    ),
    confident: (
      <path d={`M ${cx-mw*0.55} ${mouthY+er*0.35} Q ${cx+mw*0.18} ${mouthY+mw*0.42} ${cx+mw*0.78} ${mouthY-er*0.22}`}
        stroke={strokeColor} strokeWidth={sw*0.85} fill="none" strokeLinecap="round"/>
    ),
    neutral: (
      <line x1={cx-mw*0.68} y1={mouthY} x2={cx+mw*0.68} y2={mouthY}
        stroke={strokeColor} strokeWidth={sw*0.8} strokeLinecap="round"/>
    ),
    worried: (
      <path d={`M ${cx-mw*0.78} ${mouthY-er*0.1} Q ${cx} ${mouthY+mw*0.4} ${cx+mw*0.78} ${mouthY-er*0.1}`}
        stroke={strokeColor} strokeWidth={sw*0.85} fill="none" strokeLinecap="round"/>
    ),
    desperate: (
      <path d={`M ${cx-mw} ${mouthY+er*0.25} Q ${cx} ${mouthY-mw*0.52} ${cx+mw} ${mouthY+er*0.25}`}
        stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap="round"/>
    ),
  }[mood];

  // Eye fill: white sclera for dark emojis, dark sclera for paper
  const scleraFill = type === 'paper' ? '#1a1a2e' : '#ffffff';
  const pupilFill  = type === 'paper' ? '#ffffff' : '#0f0f1a';
  const shineFill  = type === 'paper' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)';

  return (
    <svg
      width={s} height={s}
      viewBox={`0 0 ${s} ${s}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <defs>
        {/* Double shadow for max readability on any bg */}
        <filter id={`shadow-${type}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor={outlineColor} floodOpacity="1"/>
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor={outlineColor} floodOpacity="0.8"/>
        </filter>
      </defs>

      {/* ── LEFT brow ── */}
      <line
        x1={lx - bw*0.52} y1={browY}
        x2={lx + bw*0.52} y2={browY + bs.lInner}
        stroke={strokeColor} strokeWidth={bsw} strokeLinecap="round"
        filter={`url(#shadow-${type})`}
      />
      {/* ── RIGHT brow ── */}
      <line
        x1={rx - bw*0.52} y1={browY + bs.rInner}
        x2={rx + bw*0.52} y2={browY}
        stroke={strokeColor} strokeWidth={bsw} strokeLinecap="round"
        filter={`url(#shadow-${type})`}
      />

      {/* ── LEFT eye ── */}
      <ellipse cx={lx} cy={eyeY} rx={er} ry={er*1.18}
        fill={scleraFill} filter={`url(#shadow-${type})`}/>
      <ellipse cx={lx+pd.dx} cy={eyeY+pd.dy} rx={pw*0.62} ry={pw*0.78} fill={pupilFill}/>
      <circle  cx={lx+pd.dx+er*0.26} cy={eyeY+pd.dy-er*0.3} r={er*0.22} fill={shineFill}/>

      {/* ── RIGHT eye ── */}
      <ellipse cx={rx} cy={eyeY} rx={er} ry={er*1.18}
        fill={scleraFill} filter={`url(#shadow-${type})`}/>
      <ellipse cx={rx+pd.dx} cy={eyeY+pd.dy} rx={pw*0.62} ry={pw*0.78} fill={pupilFill}/>
      <circle  cx={rx+pd.dx+er*0.26} cy={eyeY+pd.dy-er*0.3} r={er*0.22} fill={shineFill}/>

      {/* ── Mouth ── */}
      <g filter={`url(#shadow-${type})`}>{mouth}</g>

      {/* ── Desperate sweat drop ── */}
      {mood === 'desperate' && (
        <ellipse cx={rx+er*1.6} cy={eyeY-er*0.55}
          rx={er*0.4} ry={er*0.68}
          fill="#60a5fa" opacity={0.95}
          filter={`url(#shadow-${type})`}
        />
      )}

      {/* ── Dominant stars ── */}
      {mood === 'dominant' && (
        <>
          <text x={lx-er*2.4} y={eyeY-er*1.5} fontSize={s*0.15} fill="#fbbf24"
            filter={`url(#shadow-${type})`}>★</text>
          <text x={rx+er*1.1} y={eyeY-er*1.5} fontSize={s*0.15} fill="#fbbf24"
            filter={`url(#shadow-${type})`}>★</text>
        </>
      )}

      {/* ── Worried stress lines (forehead squiggles) ── */}
      {mood === 'worried' && (
        <path
          d={`M ${cx-er*1.3} ${browY-er*1.5}
              Q ${cx-er*0.5} ${browY-er*2.1} ${cx+er*0.3} ${browY-er*1.5}
              Q ${cx+er*1.1} ${browY-er*0.9} ${cx+er*1.8} ${browY-er*1.5}`}
          stroke={strokeColor} strokeWidth={s*0.026} fill="none"
          strokeLinecap="round" opacity={0.75}
          filter={`url(#shadow-${type})`}
        />
      )}
    </svg>
  );
};

const MoodFace: React.FC<MoodFaceProps> = ({ type, mood, size = 48 }) => {
  const emojiMap: Record<EmojiType, string> = {
    rock:     '🪨',
    paper:    '📄',
    scissors: '✂️',
  };

  return (
    <div style={{
      width: size, height: size,
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: size * 0.80,
        lineHeight: 1,
        userSelect: 'none',
        display: 'block',
        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.6))',
      }}>
        {emojiMap[type]}
      </span>
      <ExpressionOverlay mood={mood} size={size} type={type} />
    </div>
  );
};

export default MoodFace;
