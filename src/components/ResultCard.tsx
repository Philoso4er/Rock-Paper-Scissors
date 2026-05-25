import React, { useRef } from 'react';
import { EmojiType, TEAM_COLORS, EMOJI_MAP } from '../types';
import MoodFace from './MoodFace';
import { motion } from 'motion/react';

interface ResultCardProps {
  winner: EmojiType | 'draw';
  duration: number; // seconds
  finalCounts: Record<EmojiType, number>;
  initialCounts: Record<EmojiType, number>;
  chosenAlliance: EmojiType | null;
  onPlayAgain: () => void;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

const ResultCard: React.FC<ResultCardProps> = ({
  winner, duration, finalCounts, initialCounts, chosenAlliance, onPlayAgain
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isWinner = winner !== 'draw' && chosenAlliance === winner;
  const isLoser  = winner !== 'draw' && chosenAlliance !== null && chosenAlliance !== winner;
  const col      = winner !== 'draw' ? TEAM_COLORS[winner] : { primary: '#6b7280', glow: '#9ca3af', text: '#f3f4f6' };

  // Find comeback stat — whichever team won, how low did they get?
  let comebackText = '';
  if (winner !== 'draw') {
    const lowestPossible = Math.min(initialCounts[winner], 5);
    if (finalCounts[winner] < initialCounts[winner] * 0.3) {
      comebackText = `Comeback from ${finalCounts[winner]} units!`;
    }
  }

  const handleShare = async () => {
    const text = winner === 'draw'
      ? `🎮 Rock Paper Scissors Battle — It's a DRAW after ${fmt(duration)}! Wild match.`
      : `🎮 ${EMOJI_MAP[winner]} ${winner.toUpperCase()} WON the Rock Paper Scissors Battle in ${fmt(duration)}!${comebackText ? ` ${comebackText}` : ''} Can you call the next one?`;

    if (navigator.share) {
      try { await navigator.share({ text, title: 'RPS Battle Result' }); } catch (_) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
        padding: 20,
      }}
    >
      <motion.div
        ref={cardRef}
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        style={{
          background: `linear-gradient(145deg, rgba(0,0,0,0.88), ${col.primary}22)`,
          border: `1.5px solid ${col.glow}55`,
          boxShadow: `0 0 60px ${col.glow}33`,
          borderRadius: 20,
          padding: '36px 32px 28px',
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow bg */}
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 260, height: 260,
          background: `radial-gradient(circle, ${col.primary}33 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}/>

        {/* Winner face */}
        {winner !== 'draw' ? (
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          >
            <MoodFace type={winner} mood="dominant" size={100} />
          </motion.div>
        ) : (
          <div style={{ fontSize: 64 }}>🤝</div>
        )}

        {/* Title */}
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 28,
          fontWeight: 700,
          color: '#fff',
          textAlign: 'center',
          letterSpacing: '0.04em',
        }}>
          {winner === 'draw'
            ? "IT'S A DRAW"
            : `${winner.toUpperCase()} WINS`}
        </div>

        {/* Alliance result */}
        {chosenAlliance && (
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isWinner ? '#4ade80' : isLoser ? '#f87171' : 'rgba(255,255,255,0.5)',
            background: isWinner ? '#4ade8022' : isLoser ? '#f8717122' : 'transparent',
            padding: '5px 14px',
            borderRadius: 20,
            border: isWinner ? '1px solid #4ade8055' : isLoser ? '1px solid #f8717155' : 'none',
          }}>
            {isWinner ? '🏆 Your team won!' : isLoser ? '💀 Your team lost' : 'No alliance'}
          </div>
        )}

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          width: '100%',
          marginTop: 4,
        }}>
          {[
            { label: 'Duration', value: fmt(duration) },
            { label: 'Survivors', value: winner !== 'draw' ? `${finalCounts[winner]}` : '—' },
            { label: 'Total Units', value: `${Object.values(initialCounts).reduce((a,b)=>a+b,0)}` },
            { label: 'Match', value: comebackText ? 'COMEBACK!' : 'Decisive' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '10px 12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {comebackText && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
              color: '#fbbf24', textTransform: 'uppercase',
              background: '#fbbf2422', border: '1px solid #fbbf2444',
              padding: '5px 16px', borderRadius: 20,
            }}
          >
            ⚡ {comebackText}
          </motion.div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
          <button
            onClick={handleShare}
            style={{
              flex: 1, padding: '12px 0',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 10, color: '#fff',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            📤 Share
          </button>
          <button
            onClick={onPlayAgain}
            style={{
              flex: 2, padding: '12px 0',
              background: col.primary,
              border: 'none',
              borderRadius: 10, color: '#fff',
              fontSize: 13, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: `0 0 20px ${col.primary}88`,
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
