import React from 'react';
import { EmojiType, TEAM_COLORS } from '../types';
import { motion } from 'motion/react';

interface MomentumBarProps {
  counts: Record<EmojiType, number>;
}

const MomentumBar: React.FC<MomentumBarProps> = ({ counts }) => {
  const total = counts.rock + counts.paper + counts.scissors;
  if (total === 0) return null;

  const pct = (t: EmojiType) => (counts[t] / total) * 100;
  const types: EmojiType[] = ['rock', 'paper', 'scissors'];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 6,
      display: 'flex',
      overflow: 'hidden',
      zIndex: 20,
    }}>
      {types.map(t => (
        <motion.div
          key={t}
          animate={{ width: `${pct(t)}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          style={{
            height: '100%',
            background: TEAM_COLORS[t].primary,
            boxShadow: `0 0 8px ${TEAM_COLORS[t].glow}`,
          }}
        />
      ))}
    </div>
  );
};

export default MomentumBar;
