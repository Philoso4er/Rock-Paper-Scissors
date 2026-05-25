import React, { useState, useEffect, useCallback, useRef } from 'react';
import Simulation from './components/Simulation';
import UI from './components/UI';
import { GameSettings, EmojiType } from './types';

const DEFAULT_SETTINGS: GameSettings = {
  rockCount: 30,
  paperCount: 30,
  scissorsCount: 30,
  mode: 'last-man-standing',
  timeLimit: 60,
  speed: 1,
  background: null,
};

export default function App() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [counts, setCounts] = useState<Record<EmojiType, number>>({ rock: 0, paper: 0, scissors: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<EmojiType | 'draw' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(settings.timeLimit);
  const timerRef = useRef<number | null>(null);

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleStart = () => {
    setIsGameStarted(true);
    setIsGameOver(false);
    setIsPaused(false);
    setWinner(null);
    setTimeRemaining(settings.timeLimit);
  };

  const handleReset = () => {
    setIsGameStarted(false);
    setIsGameOver(false);
    setIsPaused(false);
    setWinner(null);
    setTimeRemaining(settings.timeLimit);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleGameOver = useCallback((winnerType: EmojiType | 'draw') => {
    setIsGameOver(true);
    setWinner(winnerType);
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleUpdateCounts = useCallback((newCounts: Record<EmojiType, number>) => {
    setCounts(newCounts);
  }, []);

  // Timer logic for timed mode
  useEffect(() => {
    if (isGameStarted && !isPaused && !isGameOver && settings.mode === 'timed') {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            
            // Determine winner based on counts
            const sorted = (Object.entries(counts) as [EmojiType, number][]).sort((a, b) => b[1] - a[1]);
            if (sorted[0][1] === sorted[1][1]) {
              handleGameOver('draw');
            } else {
              handleGameOver(sorted[0][0] as EmojiType);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameStarted, isPaused, isGameOver, settings.mode, counts, handleGameOver]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      {/* Background Layer */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
      </div>

      {/* Simulation Layer */}
      {isGameStarted && (
        <Simulation
          settings={settings}
          onUpdateCounts={handleUpdateCounts}
          onGameOver={handleGameOver}
          isPaused={isPaused}
        />
      )}

      {/* UI Layer */}
      <UI
        settings={settings}
        counts={counts}
        timeRemaining={timeRemaining}
        isPaused={isPaused}
        isGameOver={isGameOver}
        winner={winner}
        isGameStarted={isGameStarted}
        onUpdateSettings={handleUpdateSettings}
        onTogglePause={() => setIsPaused(!isPaused)}
        onReset={handleReset}
        onStart={handleStart}
      />
    </div>
  );
}
