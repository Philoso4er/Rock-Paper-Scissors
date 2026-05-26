import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchRecord } from '../hooks/useMatchHistory';
import { EmojiType, EMOJI_MAP, TEAM_COLORS } from '../types';
import { X, History } from 'lucide-react';

interface MatchHistoryProps {
  history: MatchRecord[];
  stats: {
    totalMatches: number;
    totalWins: number;
    totalLosses: number;
    biggestComeback: number;
    fastestWin: number;
    netCoins: number;
    mostConversions: number;
  };
  onClear: () => void;
}

function fmt(s: number): string {
  if (!isFinite(s)) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ history, stats, onClear }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
        <History size={15}/> HISTORY
        {history.length > 0 && (
          <span style={{
            background: '#6366f1', color: '#fff',
            fontSize: 9, fontWeight: 700, padding: '1px 5px',
            borderRadius: 8, marginLeft: 2,
          }}>{history.length}</span>
        )}
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
              background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)',
              zIndex: 200, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'rgba(8,8,18,0.97)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '28px 24px',
                maxWidth: 500, width: '100%',
                maxHeight: '85vh', overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                    Battle History
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
                    {stats.totalMatches} matches played
                  </div>
                </div>
                <button onClick={() => setOpen(false)} style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                  display: 'flex',
                }}>
                  <X size={16}/>
                </button>
              </div>

              {/* Career stats */}
              {stats.totalMatches > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8, marginBottom: 20,
                }}>
                  {[
                    { label: 'Wins',       value: stats.totalWins,       color: '#4ade80' },
                    { label: 'Losses',     value: stats.totalLosses,     color: '#f87171' },
                    { label: 'Comebacks',  value: stats.biggestComeback, color: '#fbbf24' },
                    { label: 'Net Coins',  value: stats.netCoins > 0 ? `+${stats.netCoins}` : stats.netCoins, color: stats.netCoins >= 0 ? '#4ade80' : '#f87171' },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Match list */}
              {history.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '40px 0',
                  color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic',
                }}>
                  No battles yet. Start one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.map((m, i) => {
                    const winCol = m.winner !== 'draw' ? TEAM_COLORS[m.winner as EmojiType] : { primary: '#6b7280', glow: '#9ca3af' };
                    const allyCol = m.chosenAlliance ? TEAM_COLORS[m.chosenAlliance] : null;
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderLeft: `3px solid ${winCol.primary}`,
                          borderRadius: 10, padding: '10px 14px',
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}
                      >
                        {/* Winner emoji */}
                        <div style={{ fontSize: 24, flexShrink: 0 }}>
                          {m.winner !== 'draw' ? EMOJI_MAP[m.winner as EmojiType] : '🤝'}
                        </div>

                        {/* Main info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: winCol.glow, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {m.winner === 'draw' ? 'Draw' : `${m.winner} wins`}
                            </span>
                            {m.wasComeback && (
                              <span style={{ fontSize: 9, color: '#fbbf24', background: '#fbbf2418', border: '1px solid #fbbf2433', padding: '1px 6px', borderRadius: 8 }}>
                                ⚡ COMEBACK
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                            {fmt(m.duration)} · {m.totalConversions} conversions · {timeAgo(m.timestamp)}
                          </div>
                        </div>

                        {/* Bet result */}
                        {m.coinsBet > 0 && (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{
                              fontSize: 12, fontWeight: 700,
                              color: m.allyWon ? '#4ade80' : '#f87171',
                            }}>
                              {m.allyWon ? `+${m.coinsWon}` : `-${m.coinsBet}`} 🪙
                            </div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                              {m.chosenAlliance ? EMOJI_MAP[m.chosenAlliance as EmojiType] : ''} bet
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {history.length > 0 && (
                <button
                  onClick={() => { onClear(); setOpen(false); }}
                  style={{
                    marginTop: 16, width: '100%', padding: '10px 0',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: 'rgba(255,255,255,0.3)',
                    fontSize: 11, cursor: 'pointer', letterSpacing: '0.08em',
                  }}
                >
                  Clear History
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MatchHistory;
