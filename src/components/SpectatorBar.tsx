import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { buildShareURL } from '../hooks/useSpectatorSync';
import { Eye, Copy, Check, Twitter } from 'lucide-react';

interface SpectatorBarProps {
  matchSeed: string;
  isGameStarted: boolean;
}

const SpectatorBar: React.FC<SpectatorBarProps> = ({ matchSeed, isGameStarted }) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareURL = buildShareURL(matchSeed);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleTweet = () => {
    const text = isGameStarted
      ? `👀 Watch this Rock Paper Scissors battle live! Who's gonna win? ${shareURL}`
      : `🎮 Challenge me on RPS Battle Simulation! ${shareURL}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      '_blank', 'noopener,noreferrer'
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '9px 12px',
          color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
      >
        <Eye size={15}/> {isGameStarted ? 'SHARE LIVE' : 'SHARE'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            style={{
              position: 'absolute', top: '110%', right: 0,
              background: 'rgba(8,8,18,0.97)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14, padding: '16px',
              width: 300, zIndex: 300,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '0.06em' }}>
              {isGameStarted ? '👁 Share this battle' : '🔗 Share match link'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.5 }}>
              {isGameStarted
                ? 'Anyone with this link can watch the same battle unfold in real time.'
                : 'Share this link so friends can jump in and watch your next match.'}
            </div>

            {/* URL box */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 10px',
              fontSize: 10, color: 'rgba(255,255,255,0.45)',
              wordBreak: 'break-all', marginBottom: 10,
              fontFamily: 'monospace',
            }}>
              {shareURL}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCopy} style={{
                flex: 1, padding: '9px 0',
                background: copied ? '#4ade8022' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${copied ? '#4ade8044' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 8, color: copied ? '#4ade80' : '#fff',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                {copied ? <Check size={13}/> : <Copy size={13}/>}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button onClick={handleTweet} style={{
                flex: 1, padding: '9px 0',
                background: 'rgba(29,161,242,0.15)',
                border: '1px solid rgba(29,161,242,0.3)',
                borderRadius: 8, color: '#1da1f2',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                <Twitter size={13}/> Tweet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 299 }}
        />
      )}
    </div>
  );
};

export default SpectatorBar;
