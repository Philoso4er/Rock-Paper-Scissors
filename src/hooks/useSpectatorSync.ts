// Spectator/share link system
// Uses BroadcastChannel for same-device tab sync (instant, free)
// and URL params to seed the match so the same "battle" can be shared

import { useEffect, useRef, useCallback } from 'react';

export interface SpectatorFrame {
  type: 'frame';
  entities: Array<{ x: number; y: number; t: number; }>; // compressed: t = type index
}

export interface SpectatorMeta {
  type: 'meta';
  seed: string;
  rockCount: number;
  paperCount: number;
  scissorsCount: number;
  speed: string;
  background: string | null;
}

// Generate a shareable match seed
export function generateMatchSeed(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// Get seed from URL if present
export function getSeedFromURL(): string | null {
  try {
    const p = new URLSearchParams(window.location.search);
    return p.get('watch');
  } catch { return null; }
}

// Build share URL
export function buildShareURL(seed: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?watch=${seed}`;
}

export function useSpectatorBroadcast(seed: string | null) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!seed) return;
    channelRef.current = new BroadcastChannel(`rps_spectate_${seed}`);
    return () => channelRef.current?.close();
  }, [seed]);

  const broadcast = useCallback((data: SpectatorMeta | SpectatorFrame) => {
    channelRef.current?.postMessage(data);
  }, []);

  const onMessage = useCallback((cb: (data: SpectatorMeta | SpectatorFrame) => void) => {
    if (!channelRef.current) return;
    channelRef.current.onmessage = (e) => cb(e.data);
  }, []);

  return { broadcast, onMessage };
}
