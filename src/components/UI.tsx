import React from 'react';
import { Play, Image as ImageIcon, Timer, Users } from 'lucide-react';
import { EmojiType, GameSettings, EMOJI_MAP } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import AllianceSelect from './AllianceSelect';
import BettingPanel from './BettingPanel';
import InfoModal from './InfoModal';

interface UIProps {
  settings: GameSettings;
  counts: Record<EmojiType, number>;
  timeRemaining: number;
  isPaused: boolean;
  isGameOver: boolean;
  isGameStarted: boolean;
  coins: number;
  currentBet: number;
  onUpdateSettings: (s: Partial<GameSettings>) => void;
  onTogglePause: () => void;
  onReset: () => void;
  onStart: () => void;
  onPlaceBet: (amount: number) => void;
}

const SPEED_OPTIONS: { value: GameSettings['speed']; label: string; sub: string }[] = [
  { value: 'chill',   label: 'Chill',   sub: 'Slow & dramatic' },
  { value: 'heated',  label: 'Heated',  sub: 'Standard pace'   },
  { value: 'chaotic', label: 'Chaotic', sub: 'Pure madness'    },
];

const defaultBackgrounds = [
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000',
];

const UI: React.FC<UIProps> = ({
  settings, counts, timeRemaining, isPaused,
  isGameOver, isGameStarted, coins, currentBet,
  onUpdateSettings, onTogglePause, onReset, onStart, onPlaceBet,
}) => {
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onUpdateSettings({ background: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col">
      <AnimatePresence>
        {!isGameStarted && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20, pointerEvents: 'auto', zIndex: 40, overflowY: 'auto',
            }}
          >
            <div style={{
              background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
              padding: '28px 28px 32px', width: '100%', maxWidth: 600,
              display: 'flex', flexDirection: 'column', gap: 22,
            }}>

              {/* ── Title row with info icon ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700,
                    color: '#fff', letterSpacing: '0.06em', marginBottom: 4,
                  }}>
                    ROCK · PAPER · SCISSORS
                  </div>
                  <div style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                  }}>
                    Battle Simulation
                  </div>
                </div>

                {/* Info icon — top-right of the title block */}
                <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
                  <InfoModal />
                </div>
              </div>

              {/* Alliance select */}
              <AllianceSelect
                counts={counts}
                chosen={settings.chosenAlliance}
                onSelect={alliance => onUpdateSettings({ chosenAlliance: alliance })}
              />

              {/* Betting panel */}
              <BettingPanel
                coins={coins}
                chosenAlliance={settings.chosenAlliance}
                onPlaceBet={onPlaceBet}
                currentBet={currentBet}
                isLocked={false}
              />

              {/* Starting numbers */}
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={12}/> Starting Numbers
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => onUpdateSettings({ rockCount: 20, paperCount: 20, scissorsCount: 20 })}
                    style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                    Even
                  </button>
                  <button onClick={() => onUpdateSettings({
                    rockCount:     Math.floor(Math.random() * 40) + 10,
                    paperCount:    Math.floor(Math.random() * 40) + 10,
                    scissorsCount: Math.floor(Math.random() * 40) + 10,
                  })} style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                    Random
                  </button>
                </div>
                {(['rock', 'paper', 'scissors'] as EmojiType[]).map(type => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 20, width: 28 }}>{EMOJI_MAP[type]}</span>
                    <input type="range" min="1" max="100"
                      value={settings[`${type}Count` as keyof GameSettings] as number}
                      onChange={e => onUpdateSettings({ [`${type}Count`]: parseInt(e.target.value) })}
                      style={{ flex: 1, accentColor: '#6366f1' }}
                    />
                    <span style={{ fontFamily: 'Georgia, serif', color: '#fff', fontWeight: 700, width: 28, textAlign: 'right', fontSize: 14 }}>
                      {settings[`${type}Count` as keyof GameSettings] as number}
                    </span>
                  </div>
                ))}
              </div>

              {/* Battle Pace */}
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Battle Pace
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {SPEED_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => onUpdateSettings({ speed: opt.value })}
                      style={{
                        padding: '10px 8px',
                        background: settings.speed === opt.value ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                        border: settings.speed === opt.value ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, color: '#fff', cursor: 'pointer', textAlign: 'center',
                      }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{opt.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Mode */}
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Match Mode
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['last-man-standing', 'timed'] as const).map(mode => (
                    <button key={mode} onClick={() => onUpdateSettings({ mode })}
                      style={{
                        padding: '10px 8px',
                        background: settings.mode === mode ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                        border: settings.mode === mode ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}>
                      {mode === 'last-man-standing' ? '⚔️ Last Standing' : '⏱ Timed Match'}
                    </button>
                  ))}
                </div>
                {settings.mode === 'timed' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <Timer size={14} color="rgba(255,255,255,0.45)"/>
                    <input type="range" min="10" max="300" step="10"
                      value={settings.timeLimit}
                      onChange={e => onUpdateSettings({ timeLimit: parseInt(e.target.value) })}
                      style={{ flex: 1, accentColor: '#6366f1' }}
                    />
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, width: 36 }}>{settings.timeLimit}s</span>
                  </div>
                )}
              </div>

              {/* Background */}
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ImageIcon size={12}/> Background
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  <label style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 8, border: '1.5px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgUpload}/>
                    <ImageIcon size={18} color="rgba(255,255,255,0.4)"/>
                  </label>
                  <button onClick={() => onUpdateSettings({ background: null })}
                    style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 8, background: '#111', border: !settings.background ? '1.5px solid #6366f1' : '1.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}/>
                  {defaultBackgrounds.map((bg, i) => (
                    <button key={i} onClick={() => onUpdateSettings({ background: bg })}
                      style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 8, overflow: 'hidden', border: settings.background === bg ? '1.5px solid #6366f1' : '1.5px solid transparent', cursor: 'pointer', padding: 0 }}>
                      <img src={bg} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer"/>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onStart}
                style={{
                  width: '100%', padding: '16px 0',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', borderRadius: 12, color: '#fff',
                  fontSize: 16, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(99,102,241,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Play size={18} fill="#fff"/>
                {currentBet > 0 ? `START · ${currentBet} 🪙 BET` : 'START BATTLE'}
              </motion.button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UI;
