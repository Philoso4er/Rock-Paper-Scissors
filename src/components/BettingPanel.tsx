import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmojiType, TEAM_COLORS, EMOJI_MAP } from '../types';
import MoodFace from './MoodFace';

interface BettingPanelProps {
  coins: number;
  chosenAlliance: EmojiType | null;
  onPlaceBet: (amount: number) => void;
  currentBet: number;
  isLocked: boolean; // true once match starts
}

const QUICK_BETS = [10, 25, 50, 100, 250];

const BettingPanel: React.FC<BettingPanelProps> = ({
  coins, chosenAlliance, onPlaceBet, currentBet, isLocked,
}) => {
  const [amount, setAmount] = useState(25);
  const [showPanel, setShowPanel] = useState(false);

  const col = chosenAlliance ? TEAM_COLORS[chosenAlliance] : null;
  const canBet = chosenAlliance && !isLocked && coins > 0;

  if (!chosenAlliance) return null;

  return (
    <div style={{ width: '100%' }}>
      {/* Coin balance row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>🪙</span>
          <span style={{
            fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700,
            color: '#fbbf24',
          }}>{coins.toLocaleString()}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>COINS</span>
        </div>
        {currentBet > 0 && (
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: col?.glow ?? '#fff',
            background: `${col?.primary ?? '#6b7280'}22`,
            border: `1px solid ${col?.primary ?? '#6b7280'}44`,
            padding: '3px 10px', borderRadius: 12,
            letterSpacing: '0.08em',
          }}>
            BET: {currentBet} 🪙
          </div>
        )}
      </div>

      {/* Bet controls */}
      <AnimatePresence>
        {!isLocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: `${col?.primary ?? '#6b7280'}18`,
              border: `1px solid ${col?.primary ?? '#6b7280'}33`,
              borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                Bet on {chosenAlliance.toUpperCase()} · 1.9× payout
              </div>

              {/* Quick bet buttons */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {QUICK_BETS.map(q => (
                  <button
                    key={q}
                    onClick={() => setAmount(Math.min(q, coins))}
                    disabled={q > coins}
                    style={{
                      padding: '5px 10px',
                      background: amount === q ? col?.primary ?? '#6366f1' : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${amount === q ? col?.primary ?? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 6, color: amount === q ? '#fff' : 'rgba(255,255,255,0.6)',
                      fontSize: 11, fontWeight: 700, cursor: q > coins ? 'not-allowed' : 'pointer',
                      opacity: q > coins ? 0.35 : 1,
                    }}
                  >{q}</button>
                ))}
                <button
                  onClick={() => setAmount(coins)}
                  style={{
                    padding: '5px 10px',
                    background: amount === coins ? col?.primary ?? '#6366f1' : 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6, color: 'rgba(255,255,255,0.6)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}
                >ALL IN</button>
              </div>

              {/* Custom amount slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <input
                  type="range" min="1" max={Math.max(coins, 1)} value={amount}
                  onChange={e => setAmount(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: col?.primary ?? '#6366f1' }}
                />
                <span style={{
                  fontFamily: 'Georgia, serif', fontWeight: 700,
                  color: '#fff', fontSize: 14, minWidth: 36, textAlign: 'right',
                }}>{amount}</span>
              </div>

              {/* Potential win display */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 12,
                fontSize: 11, color: 'rgba(255,255,255,0.45)',
              }}>
                <span>Potential win</span>
                <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>
                  +{Math.floor(amount * 1.9).toLocaleString()} 🪙
                </span>
              </div>

              {/* Place bet button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onPlaceBet(amount)}
                disabled={!canBet || amount > coins}
                style={{
                  width: '100%', padding: '11px 0',
                  background: canBet && amount <= coins
                    ? `linear-gradient(135deg, ${col?.primary}, ${col?.glow}88)`
                    : 'rgba(255,255,255,0.07)',
                  border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: canBet && amount <= coins ? 'pointer' : 'not-allowed',
                  opacity: canBet && amount <= coins ? 1 : 0.45,
                  boxShadow: canBet ? `0 0 20px ${col?.primary}55` : 'none',
                }}
              >
                🎲 Place Bet
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLocked && currentBet > 0 && (
        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.45)',
          textAlign: 'center', fontStyle: 'italic', marginTop: 4,
        }}>
          Bet locked in. No going back. 🎲
        </div>
      )}
    </div>
  );
};

export default BettingPanel;
