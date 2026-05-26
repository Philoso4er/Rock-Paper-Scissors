import { useState, useEffect } from 'react';
import { EmojiType } from '../types';

export interface MatchRecord {
  id: string;
  winner: EmojiType | 'draw';
  duration: number;
  totalConversions: number;
  lowestWinnerCount: number;
  initialTotal: number;
  wasComeback: boolean;
  chosenAlliance: EmojiType | null;
  allyWon: boolean | null;
  coinsBet: number;
  coinsWon: number;
  timestamp: number;
}

const STORAGE_KEY = 'rps_match_history';
const MAX_HISTORY = 20;

export function useMatchHistory() {
  const [history, setHistory] = useState<MatchRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {}
  }, [history]);

  const addMatch = (record: Omit<MatchRecord, 'id' | 'timestamp'>) => {
    const full: MatchRecord = {
      ...record,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };
    setHistory(h => [full, ...h].slice(0, MAX_HISTORY));
    return full;
  };

  const clearHistory = () => setHistory([]);

  // Derived stats
  const stats = {
    totalMatches:    history.length,
    totalWins:       history.filter(m => m.allyWon).length,
    totalLosses:     history.filter(m => m.allyWon === false).length,
    biggestComeback: history.filter(m => m.wasComeback).length,
    fastestWin:      history.reduce((min, m) => m.duration < min ? m.duration : min, Infinity),
    netCoins:        history.reduce((sum, m) => sum + m.coinsWon - m.coinsBet, 0),
    mostConversions: history.reduce((max, m) => m.totalConversions > max ? m.totalConversions : max, 0),
  };

  return { history, addMatch, clearHistory, stats };
}
