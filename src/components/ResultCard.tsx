import React, { useRef, useEffect, useState } from 'react';
import { EmojiType, TEAM_COLORS, EMOJI_MAP } from '../types';
import MoodFace from './MoodFace';
import { motion } from 'motion/react';

interface ResultCardProps {
  winner: EmojiType | 'draw';
  duration: number;
  finalCounts: Record<EmojiType, number>;
  initialCounts: Record<EmojiType, number>;
  lowestCounts: Record<EmojiType, number>; // lowest point each team hit during match
  chosenAlliance: EmojiType | null;
  onPlayAgain: () => void;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

// Build a dynamic narrative based on what actually happened
function buildCommentary(
  winner: EmojiType | 'draw',
  duration: number,
  finalCounts: Record<EmojiType, number>,
  initialCounts: Record<EmojiType, number>,
  lowestCounts: Record<EmojiType, number>,
): { headline: string; story: string; tag: string } {

  if (winner === 'draw') {
    return {
      headline: "NOBODY WINS. EVERYBODY LOSES.",
      story: `After ${fmt(duration)} of pure chaos, the battlefield ended in a stalemate. No side could finish the job.`,
      tag: "🤝 STALEMATE",
    };
  }

  const winnerInitial  = initialCounts[winner];
  const winnerFinal    = finalCounts[winner];
  const winnerLowest   = lowestCounts[winner];
  const totalInitial   = initialCounts.rock + initialCounts.paper + initialCounts.scissors;
  const lowestRatio    = winnerLowest / winnerInitial;
  const dominanceRatio = winnerFinal / (finalCounts.rock + finalCounts.paper + finalCounts.scissors);
  const fast           = duration < 45;
  const slow           = duration > 180;
  const isComeback     = lowestRatio < 0.25;
  const isSweep        = dominanceRatio > 0.95 && duration < 60;
  const isNailbiter    = !isComeback && !isSweep && lowestRatio < 0.45;

  const winName = winner.toUpperCase();
  const emoji   = EMOJI_MAP[winner];

  if (isSweep) {
    return {
      headline: `${emoji} ${winName} NEVER BROKE A SWEAT.`,
      story: `Total domination. ${winName} swept the entire field in just ${fmt(duration)}, converting ${totalInitial - winnerInitial} enemies without ever looking back. A flawless conquest.`,
      tag: "⚡ DOMINANT VICTORY",
    };
  }

  if (isComeback) {
    const lowestPct = Math.round(lowestRatio * 100);
    return {
      headline: `${emoji} THE GREATEST COMEBACK YOU'LL EVER SEE.`,
      story: `${winName} hit rock bottom — down to just ${winnerLowest} units (${lowestPct}% of their army) — and somehow clawed back to claim the entire field in ${fmt(duration)}. This match will be talked about.`,
      tag: "🔥 INSANE COMEBACK",
    };
  }

  if (isNailbiter) {
    return {
      headline: `${emoji} ${winName} HELD ON FOR DEAR LIFE.`,
      story: `It could've gone either way. ${winName} struggled, dropped to ${winnerLowest} units at their lowest, but found a way to convert the field in ${fmt(duration)}. Not pretty — but a win's a win.`,
      tag: "😤 HARD FOUGHT",
    };
  }

  if (fast) {
    return {
      headline: `${emoji} ${winName} MADE IT LOOK EASY.`,
      story: `${fmt(duration)}. That's all it took. ${winName} dismantled the competition with ruthless efficiency, barely giving the other teams time to react.`,
      tag: "🚀 LIGHTNING WIN",
    };
  }

  if (slow) {
    return {
      headline: `${emoji} ${winName} OUTLASTED THEM ALL.`,
      story: `A long, grinding war lasting ${fmt(duration)}. The field was balanced for most of it — but ${winName} showed patience, picking off enemies one conversion at a time until nothing was left.`,
      tag: "🧱 WAR OF ATTRITION",
    };
  }

  return {
    headline: `${emoji} ${winName} TAKES THE BATTLEFIELD.`,
    story: `A solid, hard-fought victory in ${fmt(duration)}. ${winName} converted ${totalInitial - winnerInitial} enemies and emerged the last force standing.`,
    tag: "🏆 VICTORY",
  };
}

// Canvas-based image download
async function downloadAsImage(
  cardEl: HTMLDivElement,
  winner: EmojiType | 'draw',
  headline: string,
  story: string,
  tag: string,
  duration: number,
  finalCounts: Record<EmojiType, number>,
  initialCounts: Record<EmojiType, number>,
  chosenAlliance: EmojiType | null,
) {
  const W = 800;
  const H = 480;
  const canvas = document.createElement('canvas');
  canvas.width  = W * 2; // 2x for retina
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  const col = winner !== 'draw' ? TEAM_COLORS[winner] : { primary: '#6b7280', glow: '#9ca3af', text: '#f3f4f6' };

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#0a0a1a');
  bgGrad.addColorStop(1, '#0f0f2e');
  ctx.fillStyle = bgGrad;
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // Glow
  const glow = ctx.createRadialGradient(W/2, H*0.35, 0, W/2, H*0.35, 260);
  glow.addColorStop(0, col.primary + '44');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Top border accent
  ctx.fillStyle = col.primary;
  ctx.fillRect(0, 0, W, 4);

  // Tag pill
  ctx.fillStyle = col.primary + '33';
  ctx.strokeStyle = col.primary + '88';
  ctx.lineWidth = 1;
  const tagW = ctx.measureText(tag).width + 32;
  ctx.beginPath();
  ctx.roundRect(W/2 - tagW/2, 28, tagW, 28, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = col.glow;
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(tag, W/2, 47);

  // Winner emoji big
  ctx.font = '72px serif';
  ctx.textAlign = 'center';
  ctx.fillText(winner !== 'draw' ? EMOJI_MAP[winner] : '🤝', W/2, 145);

  // Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui';
  ctx.textAlign = 'center';
  // Word wrap headline
  const words = headline.split(' ');
  let line = '';
  let lineY = 185;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > W - 80 && line !== '') {
      ctx.fillText(line.trim(), W/2, lineY);
      line = word + ' ';
      lineY += 28;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), W/2, lineY);
  lineY += 20;

  // Story text
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '13px system-ui';
  const storyWords = story.split(' ');
  let sLine = '';
  lineY += 8;
  for (const word of storyWords) {
    const test = sLine + word + ' ';
    if (ctx.measureText(test).width > W - 100 && sLine !== '') {
      ctx.fillText(sLine.trim(), W/2, lineY);
      sLine = word + ' ';
      lineY += 20;
    } else {
      sLine = test;
    }
  }
  ctx.fillText(sLine.trim(), W/2, lineY);
  lineY += 36;

  // Stats row
  const stats = [
    { label: 'DURATION', value: fmt(duration) },
    { label: 'TOTAL UNITS', value: `${initialCounts.rock + initialCounts.paper + initialCounts.scissors}` },
    { label: winner !== 'draw' ? 'SURVIVORS' : 'RESULT', value: winner !== 'draw' ? `${finalCounts[winner]}` : 'DRAW' },
    { label: 'YOUR PICK', value: chosenAlliance ? `${EMOJI_MAP[chosenAlliance]} ${chosenAlliance === winner ? 'WON' : 'LOST'}` : 'None' },
  ];

  const statW = (W - 80) / stats.length;
  const statX0 = 40;
  stats.forEach((s, i) => {
    const sx = statX0 + i * statW + statW / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(statX0 + i * statW, lineY, statW - 8, 56, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(s.label, sx, lineY + 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui';
    ctx.fillText(s.value, sx, lineY + 40);
  });

  lineY += 72;

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('rock · paper · scissors — battle simulation', W/2, lineY);

  // Download
  const link = document.createElement('a');
  link.download = `rps-battle-${winner}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

const ResultCard: React.FC<ResultCardProps> = ({
  winner, duration, finalCounts, initialCounts, lowestCounts, chosenAlliance, onPlayAgain,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const { headline, story, tag } = buildCommentary(
    winner, duration, finalCounts, initialCounts, lowestCounts
  );

  const isWinner = winner !== 'draw' && chosenAlliance === winner;
  const isLoser  = winner !== 'draw' && chosenAlliance !== null && chosenAlliance !== winner;
  const col      = winner !== 'draw' ? TEAM_COLORS[winner] : { primary: '#6b7280', glow: '#9ca3af', text: '#f3f4f6' };
  const totalInitial = initialCounts.rock + initialCounts.paper + initialCounts.scissors;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAsImage(
        cardRef.current!,
        winner, headline, story, tag,
        duration, finalCounts, initialCounts, chosenAlliance
      );
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handleShare = async () => {
    const text = `${headline}\n\n${story}\n\n#RockPaperScissors #BattleSim`;
    if (navigator.share) {
      try { await navigator.share({ text, title: 'RPS Battle Result' }); } catch (_) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
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
        ref={cardRef}
        initial={{ scale: 0.82, y: 32, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 210, damping: 22 }}
        style={{
          background: `linear-gradient(145deg, #0a0a1a, ${col.primary}22)`,
          border: `1.5px solid ${col.glow}44`,
          boxShadow: `0 0 80px ${col.glow}22`,
          borderRadius: 20,
          padding: '32px 28px 24px',
          maxWidth: 440,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top colour accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: col.primary,
          boxShadow: `0 0 16px ${col.glow}`,
        }}/>

        {/* Tag */}
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
          color: col.glow,
          background: col.primary + '28',
          border: `1px solid ${col.primary}55`,
          padding: '4px 14px', borderRadius: 20,
          textTransform: 'uppercase',
        }}>
          {tag}
        </div>

        {/* Winner face */}
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

        {/* Headline */}
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 18,
          fontWeight: 700,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: '0.02em',
        }}>
          {headline}
        </div>

        {/* Story */}
        <div style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
          lineHeight: 1.65,
          fontStyle: 'italic',
          maxWidth: 360,
        }}>
          {story}
        </div>

        {/* Alliance result badge */}
        {chosenAlliance && (
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isWinner ? '#4ade80' : isLoser ? '#f87171' : 'rgba(255,255,255,0.4)',
            background: isWinner ? '#4ade8020' : isLoser ? '#f8717120' : 'transparent',
            border: isWinner ? '1px solid #4ade8055' : isLoser ? '1px solid #f8717155' : 'none',
            padding: '4px 14px', borderRadius: 20,
          }}>
            {isWinner ? `🏆 Your alliance won!` : isLoser ? `💀 Your alliance fell` : ''}
          </div>
        )}

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          width: '100%',
          marginTop: 2,
        }}>
          {[
            { label: 'Duration',     value: fmt(duration) },
            { label: 'Total Units',  value: `${totalInitial}` },
            { label: winner !== 'draw' ? 'Survivors' : 'Outcome',
              value: winner !== 'draw' ? `${finalCounts[winner]}` : 'Draw' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Per-team breakdown */}
        <div style={{
          display: 'flex', gap: 6, width: '100%',
        }}>
          {(['rock', 'paper', 'scissors'] as EmojiType[]).map(t => {
            const survived = finalCounts[t];
            const started  = initialCounts[t];
            const lowest   = lowestCounts[t];
            const isW      = t === winner;
            return (
              <div key={t} style={{
                flex: 1, textAlign: 'center',
                background: isW ? `${TEAM_COLORS[t].primary}22` : 'rgba(255,255,255,0.03)',
                border: isW ? `1px solid ${TEAM_COLORS[t].primary}55` : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '8px 4px',
              }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{EMOJI_MAP[t]}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: isW ? TEAM_COLORS[t].glow : 'rgba(255,255,255,0.5)' }}>
                  {survived} left
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>
                  Low: {lowest}
                </div>
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              flex: 1, padding: '11px 0',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, color: '#fff',
              fontSize: 12, fontWeight: 600,
              cursor: downloading ? 'wait' : 'pointer',
              letterSpacing: '0.05em',
              transition: 'opacity 0.2s',
              opacity: downloading ? 0.6 : 1,
            }}
          >
            {downloading ? '⏳ Saving…' : '📥 Download'}
          </button>
          <button
            onClick={handleShare}
            style={{
              flex: 1, padding: '11px 0',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, color: '#fff',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.05em',
            }}
          >
            📤 Share
          </button>
          <button
            onClick={onPlayAgain}
            style={{
              flex: 2, padding: '11px 0',
              background: col.primary,
              border: 'none', borderRadius: 10, color: '#fff',
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: `0 0 20px ${col.primary}66`,
            }}
          >
            Play Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultCard;
