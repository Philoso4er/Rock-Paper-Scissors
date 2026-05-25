import React, { useState, useEffect, useCallback, useRef } from 'react';
import Simulation from './components/Simulation';
import UI from './components/UI';
import HUD from './components/HUD';
import MomentumBar from './components/MomentumBar';
import ResultCard from './components/ResultCard';
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

// Floating '+1 converted' particle
interface Particle { id: number; x: number; y: number; type: EmojiType; }

export default function App() {
  const [settings, setSettings]           = useState<GameSettings>(DEFAULT_SETTINGS);
  const [counts, setCounts]               = useState<Record<EmojiType, number>>({ rock: 0, paper: 0, scissors: 0 });
  const [initialCounts, setInitialCounts] = useState<Record<EmojiType, number>>({ rock: 30, paper: 30, scissors: 30 });
  const [isPaused, setIsPaused]           = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver]       = useState(false);
  const [winner, setWinner]               = useState<EmojiType | 'draw' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(settings.timeLimit);
  const [particles, setParticles]         = useState<Particle[]>([]);
  const [screenShake, setScreenShake]     = useState(false);
  const [tintType, setTintType]           = useState<EmojiType | null>(null);
  const [matchDuration, setMatchDuration] = useState(0);
  const timerRef    = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const particleIdRef = useRef(0);
  const prevDominantRef = useRef<EmojiType | null>(null);

  const handleUpdateSettings = (s: Partial<GameSettings>) => setSettings(prev => ({ ...prev, ...s }));

  const handleStart = () => {
    setInitialCounts({ rock: settings.rockCount, paper: settings.paperCount, scissors: settings.scissorsCount });
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
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleUpdateCounts = useCallback((newCounts: Record<EmojiType, number>) => {
    setCounts(newCounts);

    // Screen tint logic — when one type dominates >50%
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

  // Conversion particle + shake
  const handleConversion = useCallback((x: number, y: number, newType: EmojiType) => {
    const id = particleIdRef.current++;
    setParticles(p => [...p.slice(-20), { id, x, y, type: newType }]);
    setTimeout(() => setParticles(p => p.filter(pt => pt.id !== id)), 900);

    // Screen shake only when a team is near death (under 10% of field)
    setCounts(c => {
      const total = c.rock + c.paper + c.scissors;
      const weakest = Math.min(c.rock, c.paper, c.scissors);
      if (total > 0 && weakest / total < 0.08) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 400);
      }
      return c;
    });
  }, []);

  // Timed mode timer
  useEffect(() => {
    if (isGameStarted && !isPaused && !isGameOver && settings.mode === 'timed') {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            const sorted = (Object.entries(counts) as [EmojiType, number][]).sort((a,b) => b[1]-a[1]);
            handleGameOver(sorted[0][1] === sorted[1][1] ? 'draw' : sorted[0][0] as EmojiType);
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
        x: [0, -6, 6, -4, 4, -2, 2, 0],
        y: [0, 3, -3, 2, -2, 1, -1, 0],
      } : { x: 0, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
      </div>

      {/* Team colour tint overlay */}
      <AnimatePresence>
        {tintColor && isGameStarted && !isGameOver && (
          <motion.div
            key={tintColor}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at center, ${tintColor}18 0%, transparent 70%)`,
              pointerEvents: 'none', zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      {/* Momentum bar */}
      {isGameStarted && !isGameOver && (
        <MomentumBar counts={counts} />
      )}

      {/* Simulation canvas */}
      {isGameStarted && (
        <Simulation
          settings={settings}
          onUpdateCounts={handleUpdateCounts}
          onGameOver={handleGameOver}
          onConversion={handleConversion}
          isPaused={isPaused}
        />
      )}

      {/* HUD — top left */}
      {isGameStarted && !isGameOver && (
        <div style={{
          position: 'absolute', top: 16, left: 16,
          zIndex: 30, pointerEvents: 'none',
        }}>
          <HUD
            counts={counts}
            initialCounts={initialCounts}
            chosenAlliance={settings.chosenAlliance}
          />
        </div>
      )}

      {/* Conversion particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 25 }}>
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -40, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: p.x - 10,
                top: p.y - 10,
                fontSize: 14,
                fontWeight: 700,
                color: TEAM_COLORS[p.type].glow,
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.05em',
                textShadow: `0 0 8px ${TEAM_COLORS[p.type].primary}`,
                userSelect: 'none',
              }}
            >
              +1
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Settings / pre-game UI */}
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
            chosenAlliance={settings.chosenAlliance}
            onPlayAgain={handleReset}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
