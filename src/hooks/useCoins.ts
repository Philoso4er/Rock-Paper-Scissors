import { useState, useEffect } from 'react';

const STORAGE_KEY = 'rps_coins';
const STARTING_COINS = 1000;

export function useCoins() {
  const [coins, setCoins] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored) : STARTING_COINS;
    } catch { return STARTING_COINS; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(coins)); } catch {}
  }, [coins]);

  const placeBet = (amount: number): boolean => {
    if (amount > coins) return false;
    setCoins(c => c - amount);
    return true;
  };

  const resolveBet = (amount: number, won: boolean, odds: number = 1.9) => {
    if (won) setCoins(c => c + Math.floor(amount * odds));
  };

  const addCoins = (amount: number) => setCoins(c => c + amount);
  const reset = () => setCoins(STARTING_COINS);

  return { coins, placeBet, resolveBet, addCoins, reset };
}
