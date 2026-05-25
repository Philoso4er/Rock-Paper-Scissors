import React, { useState } from 'react';
import { EmojiType, MoodState, TEAM_COLORS } from '../types';
import MoodFace from './MoodFace';
import { motion } from 'motion/react';

interface AllianceSelectProps {
  counts: Record<EmojiType, number>;
  onSelect: (type: EmojiType | null) => void;
  chosen: EmojiType | null;
}

const TYPE_MOODS: Record<EmojiType, MoodState> = {
  rock:     'dominant',
  paper:    'worried',
  scissors: 'confident',
};

const TAUNTS: Record<EmojiType, string[]> = {
  rock: [
    "Solid. Unstoppable. Ancient.",
    "Paper fears what it cannot hold.",
    "We don't run. We don't hide.",
  ],
  paper: [
    "Brains over brawn. Always.",
    "We cover everything in the end.",
    "Patient. Strategic. Inevitable.",
  ],
  scissors: [
    "Sharp minds. Sharper blades.",
    "We cut through the noise.",
    "Fast, precise, relentless.",
  ],
};

const Card: React.FC<{
  type: EmojiType;
  chosen: EmojiType | null;
  onSelect: (t: EmojiType) => void;
}> = ({ type, chosen, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const col    = TEAM_COLORS[type];
  const mood   = hovered ? 'dominant' : TYPE_MOODS[type];
  const taunts = TAUNTS[type];
  const taunt  = taunts[Math.floor(Date.now() / 1000) % taunts.length];
  const isChosen = chosen === type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: type === 'rock' ? 0 : type === 'paper' ? 0.1 : 0.2, type: 'spring', stiffness: 200 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(type)}
      style={{
        border: isChosen
          ? `2px solid ${col.glow}`
          : hovered
            ? `2px solid ${col.primary}`
            : '2px solid rgba(255,255,255,0.12)',
        boxShadow: isChosen
          ? `0 0 32px ${col.glow}55, inset 0 0 20px ${col.primary}22`
          : hovered
            ? `0 0 18px ${col.primary}44`
            : 'none',
        background: isChosen
          ? `linear-gradient(135deg, ${col.primary}33, rgba(0,0,0,0.6))`
          : 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(16px)',
        borderRadius: 16,
        padding: '28px 20px 24px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        minWidth: 0,
        transition: 'all 0.25s ease',
        userSelect: 'none',
      }}
    >
      {/* Face */}
      <motion.div
        animate={hovered ? { scale: 1.08, rotate: [-2, 2, -1, 0] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <MoodFace type={type} mood={mood} size={96} />
      </motion.div>

      {/* Team name */}
      <div style={{
        color: col.glow,
        fontFamily: 'Georgia, serif',
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        {type === 'rock' ? 'Team Rock' : type === 'paper' ? 'Team Paper' : 'Team Scissors'}
      </div>

      {/* Taunt */}
      <div style={{
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 1.5,
        minHeight: 36,
      }}>
        "{taunt}"
      </div>

      {/* Select button */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        style={{
          marginTop: 4,
          padding: '9px 0',
          width: '100%',
          background: isChosen ? col.primary : 'transparent',
          border: `1.5px solid ${isChosen ? col.primary : 'rgba(255,255,255,0.25)'}`,
          borderRadius: 8,
          color: isChosen ? '#fff' : 'rgba(255,255,255,0.75)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textAlign: 'center',
          transition: 'all 0.2s',
        }}
      >
        {isChosen ? '✓ ALLIED' : `JOIN ${type.toUpperCase()}`}
      </motion.div>
    </motion.div>
  );
};

const AllianceSelect: React.FC<AllianceSelectProps> = ({ onSelect, chosen }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        width: '100%',
        padding: '0 0 8px',
      }}
    >
      <div style={{
        color: 'rgba(255,255,255,0.9)',
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        Choose Your Alliance
      </div>

      <div style={{ display: 'flex', gap: 12, width: '100%' }}>
        {(['rock', 'paper', 'scissors'] as EmojiType[]).map(t => (
          <Card key={t} type={t} chosen={chosen} onSelect={onSelect} />
        ))}
      </div>

      {chosen && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelect(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.35)',
            fontSize: 11,
            cursor: 'pointer',
            letterSpacing: '0.08em',
            textDecoration: 'underline',
          }}
        >
          Watch without alliance
        </motion.button>
      )}
    </motion.div>
  );
};

export default AllianceSelect;
