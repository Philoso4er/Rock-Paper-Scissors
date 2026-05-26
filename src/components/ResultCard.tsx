import React, { useRef, useEffect, useState } from 'react';
import { EmojiType, TEAM_COLORS, EMOJI_MAP } from '../types';
import MoodFace from './MoodFace';
import { motion } from 'motion/react';

interface ResultCardProps {
  winner: EmojiType | 'draw';
  duration: number;
  finalCounts: Record<EmojiType, number>;
  initialCounts: Record<EmojiType, number>;
  lowestCounts: Record<EmojiType, number>; // lowest point each team reached
  totalConversions: number;
  chosenAlliance: EmojiType | null;
  onPlayAgain: () => void;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

// ── Commentary engine ────────────────────────────────────────────────────────
function buildCommentary(
  winner: EmojiType | 'draw',
  duration: number,
  finalCounts: Record<EmojiType, number>,
  initialCounts: Record<EmojiType, number>,
  lowestCounts: Record<EmojiType, number>,
  totalConversions: number,
  chosenAlliance: EmojiType | null,
): string {
  if (winner === 'draw') {
    return "A draw. The battlefield fell silent with no clear victor. A rare and humbling outcome.";
  }

  const winEmoji   = EMOJI_MAP[winner];
  const winName    = winner.charAt(0).toUpperCase() + winner.slice(1);
  const total      = initialCounts.rock + initialCounts.paper + initialCounts.scissors;
  const winInitial = initialCounts[winner];
  const winLowest  = lowestCounts[winner];
  const winFinal   = finalCounts[winner];
  const durationMin = duration / 60;

  // Was there a comeback?
  const comebackRatio = winLowest / winInitial;
  const wasComeback   = comebackRatio < 0.35;
  const wasDomination = winLowest / winInitial > 0.75 && winFinal / total > 0.9;
  const wasClose      = !wasDomination && !wasComeback;
  const allyWon       = chosenAlliance === winner;
  const allyLost      = chosenAlliance !== null && chosenAlliance !== winner;

  const paceWord = durationMin < 0.5 ? 'lightning-fast'
    : durationMin < 1.5 ? 'brisk'
    : durationMin < 3   ? 'hard-fought'
    : 'epic';

  const lines: string[] = [];

  if (wasComeback) {
    lines.push(
      `${winEmoji} ${winName} pulled off an INSANE comeback — down to just ${winLowest} units before storming back to claim the entire battlefield in ${fmt(duration)}.`,
      `At their lowest, ${winName} had only ${winLowest} survivors left out of ${total}. Nobody saw that coming.`,
      `From the brink of extinction to total domination. ${winName} refused to die and took everything.`,
    );
  } else if (wasDomination) {
    lines.push(
      `${winEmoji} ${winName} steamrolled the competition in ${fmt(duration)}. A dominant, clinical performance with barely any resistance.`,
      `${winName} never looked threatened — a masterclass in efficiency. The field was theirs almost immediately.`,
      `Cold. Calculated. Inevitable. ${winName} converted ${totalConversions} enemies without ever breaking a sweat.`,
    );
  } else {
    lines.push(
      `A ${paceWord} battle. ${winEmoji} ${winName} outlasted the competition in ${fmt(duration)} after ${totalConversions} total conversions across the field.`,
      `${winName} and their rivals traded blows for ${fmt(duration)} before ${winName} finally sealed it. ${totalConversions} conversions. One winner.`,
      `The field was alive for ${fmt(duration)}. When the dust settled, ${winName} was the last one standing.`,
    );
  }

  // Alliance suffix
  if (allyWon) {
    lines[0] += ' YOUR team won. You called it.';
  } else if (allyLost) {
    const lostName = chosenAlliance!.charAt(0).toUpperCase() + chosenAlliance!.slice(1);
    lines[0] += ` Your ${lostName} squad didn't make it. Better luck next round.`;
  }

  // Pick one line deterministically based on time
  return lines[Math.floor(Date.now() / 1000) % lines.length];
}

// ── Download using native Canvas (no external lib needed) ────────────────────
async function downloadResultImage(
  winner: EmojiType | 'draw',
  duration: number,
  finalCounts: Record<EmojiType, number>,
  initialCounts: Record<EmojiType, number>,
  lowestCounts: Record<EmojiType, number>,
  totalConversions: number,
  chosenAlliance: EmojiType | null,
  commentary: string,
) {
  const W = 640;
  const H = 360;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const col = winner !== 'draw' ? TEAM_COLORS[winner] : { primary: '#6b7280', glow: '#9ca3af', text: '#f3f4f6' };

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0a0a14');
  grad.addColorStop(1, winner !== 'draw' ? `${col.primary}44` : '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle glow circle
  const radial = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.55);
  radial.addColorStop(0, `${col.primary}22`);
  radial.addColorStop(1, 'transparent');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = col.primary;
  ctx.fillRect(0, 0, W, 4);

  // Winner emoji — large
  ctx.font      = '80px serif';
  ctx.textAlign = 'center';
  ctx.fillText(winner !== 'draw' ? EMOJI_MAP[winner] : '🤝', W / 2, 105);

  // Winner title
  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 32px Georgia, serif';
  ctx.textAlign    = 'center';
  ctx.letterSpacing = '2px';
  ctx.fillText(
    winner !== 'draw' ? `${winner.toUpperCase()} WINS` : "IT'S A DRAW",
    W / 2, 148
  );

  // Commentary text — word wrapped
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font      = '14px Arial, sans-serif';
  ctx.textAlign = 'center';
  const words   = commentary.split(' ');
  const maxW    = W - 80;
  let line      = '';
  let y         = 178;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, W / 2, y);
      line = word;
      y += 20;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, W / 2, y);
  y += 32;

  // Stats row
  const total      = initialCounts.rock + initialCounts.paper + initialCounts.scissors;
  const stats = [
    { label: 'Duration',    value: fmt(duration)         },
    { label: 'Conversions', value: `${totalConversions}` },
    { label: 'Total Units', value: `${total}`            },
    { label: 'Comeback',    value: winner !== 'draw' && lowestCounts[winner] / initialCounts[winner] < 0.35 ? 'YES ⚡' : 'No' },
  ];

  const boxW  = 130;
  const boxH  = 52;
  const gap   = 12;
  const startX = (W - (stats.length * boxW + (stats.length - 1) * gap)) / 2;

  stats.forEach((s, i) => {
    const bx = startX + i * (boxW + gap);
    ctx.fillStyle   = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 1;
    roundRect(ctx, bx, y, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font      = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(s.label.toUpperCase(), bx + boxW / 2, y + 16);

    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 16px Georgia, serif';
    ctx.fillText(s.value, bx + boxW / 2, y + 36);
  });

  // Branding footer
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font      = '11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('RPS Battle Simulation · rps-battle.vercel.app', W / 2, H - 14);

  // Download
  const link    = document.createElement('a');
  link.download = `rps-battle-${Date.now()}.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Component ────────────────────────────────────────────────────────────────
const ResultCard: React.FC<ResultCardProps> = ({
  winner, duration, finalCounts, initialCounts,
  lowestCounts, totalConversions, chosenAlliance, onPlayAgain,
}) => {
  const isWinner = winner !== 'draw' && chosenAlliance === winner;
  const isLoser  = winner !== 'draw' && chosenAlliance !== null && chosenAlliance !== winner;
  const col      = winner !== 'draw' ? TEAM_COLORS[winner] : { primary: '#6b7280', glow: '#9ca3af', text: '#f3f4f6' };
  const total    = initialCounts.rock + initialCounts.paper + initialCounts.scissors;

  const commentary = buildCommentary(
    winner, duration, finalCounts, initialCounts,
    lowestCounts, totalConversions, chosenAlliance
  );

  const wasComeback = winner !== 'draw' && lowestCounts[winner] / initialCounts[winner] < 0.35;

  const handleShare = async () => {
    const text = `${commentary}\n\nRPS Battle Simulation`;
    if (navigator.share) {
      try { await navigator.share({ text, title: 'RPS Battle Result' }); } catch (_) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    }
  };

  const handleDownload = () => {
    downloadResultImage(
      winner, duration, finalCounts, initialCounts,
      lowestCounts, totalConversions, chosenAlliance, commentary
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        style={{
          background: `linear-gradient(145deg, rgba(5,5,15,0.97), ${col.primary}28)`,
          border: `1.5px solid ${col.glow}44`,
          boxShadow: `0 0 70px ${col.glow}28`,
          borderRadius: 20,
          padding: '36px 30px 28px',
          maxWidth: 420,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: col.primary }}/>

        {/* Glow bg */}
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 300, height: 300,
          background: `radial-gradient(circle, ${col.primary}28 0%, transparent 68%)`,
          pointerEvents: 'none',
        }}/>

        {/* Winner icon with mood */}
        {winner !== 'draw' ? (
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            <MoodFace type={winner} mood="dominant" size={90} />
          </motion.div>
        ) : (
          <div style={{ fontSize: 60 }}>🤝</div>
        )}

        {/* Title */}
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 28, fontWeight: 700, color: '#fff',
          letterSpacing: '0.06em', textAlign: 'center',
        }}>
          {winner === 'draw' ? "IT'S A DRAW" : `${winner.toUpperCase()} WINS`}
        </div>

        {/* Alliance badge */}
        {chosenAlliance && (
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isWinner ? '#4ade80' : isLoser ? '#f87171' : 'rgba(255,255,255,0.5)',
            background: isWinner ? '#4ade8018' : isLoser ? '#f8717118' : 'transparent',
            padding: '4px 14px', borderRadius: 20,
            border: isWinner ? '1px solid #4ade8044' : isLoser ? '1px solid #f8717144' : 'none',
          }}>
            {isWinner ? '🏆 Your team won!' : isLoser ? '💀 Your team lost' : ''}
          </div>
        )}

        {/* Commentary */}
        <div style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.72)',
          textAlign: 'center',
          lineHeight: 1.7,
          fontStyle: 'italic',
          padding: '0 4px',
        }}>
          "{commentary}"
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8, width: '100%',
        }}>
          {[
            { label: 'Duration',     value: fmt(duration)                                         },
            { label: 'Conversions',  value: `${totalConversions}`                                 },
            { label: 'Total Units',  value: `${total}`                                            },
            { label: 'Lowest Point', value: winner !== 'draw' ? `${lowestCounts[winner]} units` : '—' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Comeback badge */}
        {wasComeback && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
              color: '#fbbf24', textTransform: 'uppercase',
              background: '#fbbf2418', border: '1px solid #fbbf2440',
              padding: '5px 18px', borderRadius: 20,
            }}
          >
            ⚡ COMEBACK OF THE CENTURY
          </motion.div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button onClick={handleDownload} style={{
            flex: 1, padding: '11px 0',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 10, color: '#fff',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '0.05em',
          }}>
            💾 Save Image
          </button>
          <button onClick={handleShare} style={{
            flex: 1, padding: '11px 0',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 10, color: '#fff',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '0.05em',
          }}>
            📤 Share
          </button>
          <button onClick={onPlayAgain} style={{
            flex: 2, padding: '11px 0',
            background: col.primary,
            border: 'none',
            borderRadius: 10, color: '#fff',
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: `0 0 22px ${col.primary}77`,
          }}>
            Play Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultCard;
