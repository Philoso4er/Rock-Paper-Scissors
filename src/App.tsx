import React, { useState, useEffect, useCallback, useRef } from 'react';
import Simulation from './components/Simulation';
import UI from './components/UI';
import HUD from './components/HUD';
import MomentumBar from './components/MomentumBar';
import ResultCard from './components/ResultCard';
import InfoModal from './components/InfoModal';
import { GameSettings, EmojiType, TEAM_COLORS } from './types';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_SETTINGS: GameSettings = {
  rockCount: 30,
  paperCount: 30,
  scissorsCount: 30,
  mode: 'last-man-standing',
  timeLimit: 60,
  speed: 'heated',
  background: null,
  chosenAlliance: null,
};

interface Particle { id: number; x: number; y: number; type: EmojiType; }

export default function App() {
  const [settings, setSettings]             = useState<GameSettings>(DEFAULT_SETTINGS);
  const [counts, setCounts]                 = useState<Record<EmojiType, number>>({ rock: 0, paper: 0, scissors: 0 });
  const [initialCounts, setInitialCounts]   = useState<Record<EmojiType, number>>({ rock: 30, paper: 30, scissors: 30 });
  const [lowestCounts, setLowestCounts]     = useState<Record<EmojiType, number>>({ rock: 30, paper: 30, scissors: 30 });
  const [totalConversions, setTotalConversions] = useState(0);
  const [isPaused, setIsPaused]             = useState(false);
  const [isGameStarted, setIsGameStarted]   = useState(false);
  const [isGameOver, setIsGameOver]         = useState(false);
  const [winner, setWinner]                 = useState<EmojiType | 'draw' | null>(null);
  const [timeRemaining, setTimeRemaining]   = useState(settings.timeLimit);
  const [particles, setParticles]           = useState<Particle[]>([]);
  const [screenShake, setScreenShake]       = useState(false);
  const [tintType, setTintType]             = useState<EmojiType | null>(null);
  const [matchDuration, setMatchDuration]   = useState(0);

  const timerRef          = useRef<number | null>(null);
  const startTimeRef      = useRef<number>(0);
  const particleIdRef     = useRef(0);
  const prevDominantRef   = useRef<EmojiType | null>(null);
  const lowestCountsRef   = useRef<Record<EmojiType, number>>({ rock: 30, paper: 30, scissors: 30 });
  const conversionsRef    = useRef(0);

  const handleUpdateSettings = (s: Partial<GameSettings>) =>
    setSettings(prev => ({ ...prev, ...s }));

  const handleStart = () => {
    const init = {
      rock:     settings.rockCount,
      paper:    settings.paperCount,
      scissors: settings.scissorsCount,
    };
    setInitialCounts(init);
    setLowestCounts({ ...init });
    lowestCountsRef.current  = { ...init };
    conversionsRef.current   = 0;
    setTotalConversions(0);
    setIsGameStarted(true);
    setIsGameOver(false);
    setIsPaused(false);
    setWinner(null);
    setTimeRemaining(settings.timeLimit);
    startTimeRef.current = Date.now();
  };

  const handleReset = () => {
    setIsGameStarted(false);
    setIsGameOver(false);
    setIsPaused(false);
    setWinner(null);
    setTintType(null);
    setParticles([]);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleGameOver = useCallback((winnerType: EmojiType | 'draw') => {
    setIsGameOver(true);
    setWinner(winnerType);
    setMatchDuration((Date.now() - startTimeRef.current) / 1000);
    setLowestCounts({ ...lowestCountsRef.current });
    setTotalConversions(conversionsRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleUpdateCounts = useCallback((newCounts: Record<EmojiType, number>) => {
    setCounts(newCounts);

    // Track lowest point each team ever reached (ignore zeros — that means eliminated)
    const types: EmojiType[] = ['rock', 'paper', 'scissors'];
    types.forEach(t => {
      if (newCounts[t] > 0 && newCounts[t] < lowestCountsRef.current[t]) {
        lowestCountsRef.current[t] = newCounts[t];
      }
    });

    // Dominant tint
    const total = newCounts.rock + newCounts.paper + newCounts.scissors;
    if (total > 0) {
      const dominant = (Object.entries(newCounts) as [EmojiType, number][])
        .find(([, n]) => n / total > 0.5);
      const dom = dominant ? dominant[0] as EmojiType : null;
      if (dom !== prevDominantRef.current) {
        prevDominantRef.current = dom;
        setTintType(dom);
      }
    }
  }, []);

  const handleConversion = useCallback((x: number, y: number, newType: EmojiType) => {
    conversionsRef.current++;

    const id = particleIdRef.current++;
    setParticles(p => [...p.slice(-24), { id, x, y, type: newType }]);
    setTimeout(() => setParticles(p => p.filter(pt => pt.id !== id)), 900);

    // Shake when any team is near elimination
    setCounts(c => {
      const total   = c.rock + c.paper + c.scissors;
      const weakest = Math.min(
        c.rock    > 0 ? c.rock    : Infinity,
        c.paper   > 0 ? c.paper   : Infinity,
        c.scissors > 0 ? c.scissors : Infinity,
      );
      if (total > 0 && weakest !== Infinity && weakest / total < 0.07) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 380);
      }
      return c;
    });
  }, []);

  // Timed mode countdown
  useEffect(() => {
    if (isGameStarted && !isPaused && !isGameOver && settings.mode === 'timed') {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            const sorted = (Object.entries(counts) as [EmojiType, number][])
              .sort((a, b) => b[1] - a[1]);
            handleGameOver(
              sorted[0][1] === sorted[1][1] ? 'draw' : sorted[0][0] as EmojiType
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isGameStarted, isPaused, isGameOver, settings.mode, counts, handleGameOver]);

  const tintColor = tintType ? TEAM_COLORS[tintType].primary : null;

  return (
    <motion.div
      className="relative w-full h-screen overflow-hidden bg-slate-950"
      animate={screenShake ? {
        x: [0, -7, 7, -5, 5, -2, 2, 0],
        y: [0,  3, -3,  2, -2,  1, -1, 0],
      } : { x: 0, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
      </div>

      {/* Team colour tint */}
      <AnimatePresence>
        {tintColor && isGameStarted && !isGameOver && (
          <motion.div
            key={tintColor}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at center, ${tintColor}1a 0%, transparent 70%)`,
              pointerEvents: 'none', zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      {/* Momentum bar */}
      {isGameStarted && !isGameOver && <MomentumBar counts={counts} />}

      {/* Canvas */}
      {isGameStarted && (
        <Simulation
          settings={settings}
          onUpdateCounts={handleUpdateCounts}
          onGameOver={handleGameOver}
          onConversion={handleConversion}
          isPaused={isPaused}
        />
      )}

      {/* HUD top-left */}
      {isGameStarted && !isGameOver && (
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 30, pointerEvents: 'none' }}>
          <HUD
            counts={counts}
            initialCounts={initialCounts}
            chosenAlliance={settings.chosenAlliance}
          />
        </div>
      )}

      {/* Top-right controls + info */}
      {isGameStarted && !isGameOver && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          display: 'flex', gap: 8, zIndex: 30, pointerEvents: 'auto',
          alignItems: 'center',
        }}>
          <InfoModal />
          {settings.mode === 'timed' && (
            <div style={{
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '8px 14px',
              color: '#fff', fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ⏱ {Math.floor(timeRemaining/60)}:{(timeRemaining%60).toString().padStart(2,'0')}
            </div>
          )}
          <button onClick={() => setIsPaused(p => !p)} style={{
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '10px 14px', color: '#fff', cursor: 'pointer',
          }}>
            {isPaused ? '▶' : '⏸'}
          </button>
          <button onClick={handleReset} style={{
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '10px 14px', color: '#fff', cursor: 'pointer',
          }}>
            ↺
          </button>
        </div>
      )}

      {/* Conversion particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 25 }}>
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -44, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: p.x - 10, top: p.y - 10,
                fontSize: 13, fontWeight: 700,
                color: TEAM_COLORS[p.type].glow,
                fontFamily: 'Georgia, serif',
                textShadow: `0 0 8px ${TEAM_COLORS[p.type].primary}`,
                userSelect: 'none',
              }}
            >
              +1
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pre-game settings */}
      <UI
        settings={settings}
        counts={counts}
        timeRemaining={timeRemaining}
        isPaused={isPaused}
        isGameOver={isGameOver}
        isGameStarted={isGameStarted}
        onUpdateSettings={handleUpdateSettings}
        onTogglePause={() => setIsPaused(!isPaused)}
        onReset={handleReset}
        onStart={handleStart}
      />

      {/* Result card */}
      <AnimatePresence>
        {isGameOver && winner && (
          <ResultCard
            winner={winner}
            duration={matchDuration}
            finalCounts={counts}
            initialCounts={initialCounts}
            lowestCounts={lowestCounts}
            totalConversions={totalConversions}
            chosenAlliance={settings.chosenAlliance}
            onPlayAgain={handleReset}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
