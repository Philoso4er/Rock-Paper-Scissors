import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info } from 'lucide-react';

const SECTIONS = [
  {
    icon: '⚔️',
    title: 'The Battlefield',
    body: 'Hundreds of Rock, Paper and Scissors icons roam the arena as independent creatures. Each one hunts its natural prey — Rock crushes Scissors, Scissors cuts Paper, Paper covers Rock.',
  },
  {
    icon: '🔄',
    title: 'Conversion',
    body: 'When a predator catches its prey, the prey transforms into the predator\'s type and joins their side. One at a time — no chain reactions. Watch the momentum shift in real time.',
  },
  {
    icon: '😤',
    title: 'Expressions',
    body: 'The icons on the HUD show live emotion based on how their team is doing. Dominant when leading, smug when ahead, worried when fading, and full panic when near elimination.',
  },
  {
    icon: '🏳️',
    title: 'Choose an Alliance',
    body: 'Pick a side before the match starts. Your chosen team gets highlighted on the HUD. No stat advantages — it\'s purely random chaos, which makes comebacks all the more insane.',
  },
  {
    icon: '📊',
    title: 'Momentum Bar',
    body: 'The coloured strip at the very top of the screen shows the live balance of power between all three teams. Watch it shift as conversions happen across the field.',
  },
  {
    icon: '⚡',
    title: 'Pace Modes',
    body: 'Chill is slow and dramatic — every conversion feels like an event. Heated is the standard balanced pace. Chaotic is full madness where matches end in seconds.',
  },
];

const InfoModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          padding: '9px 12px',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.06em',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
      >
        <Info size={15} /> HOW TO PLAY
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(10px)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'rgba(10,10,20,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: '32px 28px 28px',
                maxWidth: 520,
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
                    How It Works
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 3 }}>
                    Rock · Paper · Scissors · Battle Simulation
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: 8,
                    color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <X size={16}/>
                </button>
              </div>

              {/* Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {SECTIONS.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.055 }}
                    style={{
                      display: 'flex',
                      gap: 14,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12,
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ fontSize: 24, flexShrink: 0, marginTop: 1 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5, letterSpacing: '0.04em' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>
                        {s.body}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer nudge */}
              <div style={{
                marginTop: 20,
                padding: '12px 16px',
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 10,
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                Last team standing wins. No rules. No mercy. Pure chaos. 🎲
              </div>

              <button
                onClick={() => setOpen(false)}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '12px 0',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Got It — Let's Battle
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InfoModal;
