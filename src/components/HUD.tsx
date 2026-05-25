import React from 'react';
import { EmojiType, MoodState, TEAM_COLORS } from '../types';
import MoodFace from './MoodFace';
import { motion, AnimatePresence } from 'motion/react';

interface HUDProps {
  counts: Record<EmojiType, number>;
  initialCounts: Record<EmojiType, number>;
  chosenAlliance: EmojiType | null;
}

function getMood(current: number, initial: number, total: number): MoodState {
  if (total === 0) return 'neutral';
  const share = current / total;
  const ratio = initial > 0 ? current / initial : 0;

  if (share > 0.55)       return 'dominant';
  if (share > 0.38)       return 'confident';
  if (ratio < 0.18)       return 'desperate';
  if (share < 0.22)       return 'worried';
  return 'neutral';
}

const MOOD_QUIPS: Record<MoodState, string[]> = {
  dominant:  ['DOMINATING', 'UNSTOPPABLE', 'RULING'],
  confident: ['LEADING',    'PUSHING',     'AHEAD'],
  neutral:   ['EVEN',       'STEADY',      'BALANCED'],
  worried:   ['STRUGGLING', 'UNDER FIRE',  'FADING'],
  desperate: ['DYING',      'LAST STAND',  'CRITICAL'],
};

function quip(mood: MoodState, seed: number): string {
  const arr = MOOD_QUIPS[mood];
  return arr[seed % arr.length];
}

const CountCard: React.FC<{
  type: EmojiType;
  count: number;
  initial: number;
  total: number;
  isAllied: boolean;
  seed: number;
}> = ({ type, count, initial, total, isAllied, seed }) => {
  const mood = getMood(count, initial, total);
  const col  = TEAM_COLORS[type];
  const pct  = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      padding: '8px 12px',
      background: isAllied
        ? `linear-gradient(135deg, ${col.primary}44, rgba(0,0,0,0.55))`
        : 'rgba(0,0,0,0.5)',
      border: isAllied
        ? `1.5px solid ${col.glow}88`
        : '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      backdropFilter: 'blur(12px)',
      minWidth: 70,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Progress fill */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: `${pct}%`,
        background: `${col.primary}18`,
        transition: 'height 0.6s ease',
        pointerEvents: 'none',
      }}/>

      <MoodFace type={type} mood={mood} size={40} />

      <motion.div
        key={count}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 20,
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1,
        }}
      >
        {count}
      </motion.div>

      <div style={{
        fontSize: 8,
        letterSpacing: '0.1em',
        color: MOOD_QUIPS[mood] ? col.glow : 'rgba(255,255,255,0.4)',
        fontWeight: 600,
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        {quip(mood, seed)}
      </div>

      {isAllied && (
        <div style={{
          position: 'absolute', top: 4, right: 5,
          fontSize: 8, color: col.glow, fontWeight: 700,
          letterSpacing: '0.05em',
        }}>
          ALLY
        </div>
      )}
    </div>
  );
};

const HUD: React.FC<HUDProps> = ({ counts, initialCounts, chosenAlliance }) => {
  const total = counts.rock + counts.paper + counts.scissors;
  const seed  = Math.floor(Date.now() / 3000); // changes every 3s for variety

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {(['rock', 'paper', 'scissors'] as EmojiType[]).map(t => (
        <CountCard
          key={t}
          type={t}
          count={counts[t]}
          initial={initialCounts[t]}
          total={total}
          isAllied={chosenAlliance === t}
          seed={seed}
        />
      ))}
    </div>
  );
};

export default HUD;
