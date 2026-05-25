import React, { useEffect, useRef, useCallback } from 'react';
import { EmojiType, GameSettings, STRENGTH_MAP, EMOJI_MAP } from '../types';

interface LiveEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: EmojiType;
  radius: number;
  wanderAngle: number;
  convertCooldown: number;
  pulseTimer: number;
}

interface SimulationProps {
  settings: GameSettings;
  onUpdateCounts: (counts: Record<EmojiType, number>) => void;
  onGameOver: (winner: EmojiType | 'draw') => void;
  isPaused: boolean;
}

const EMOJI_FONT_SIZE = 22;
const ENTITY_RADIUS = 16;
const CONVERT_COOLDOWN = 40; // frames of immunity after converting someone

const Simulation: React.FC<SimulationProps> = ({ settings, onUpdateCounts, onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entitiesRef = useRef<LiveEntity[]>([]);
  const rafRef = useRef<number | null>(null);
  const isPausedRef = useRef(isPaused);
  const gameOverRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Keep isPaused in sync without restarting the loop
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // ── Resize canvas to fill parent ─────────────────────────────────────────
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { w: 0, h: 0 };
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth  : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
    return { w, h };
  }, []);

  // ── Spawn ────────────────────────────────────────────────────────────────
  const spawnEntities = useCallback(() => {
    // Make absolutely sure the canvas is sized first
    const { w, h } = syncCanvasSize();
    if (w === 0 || h === 0) return;

    const pad = 50;
    const list: LiveEntity[] = [];

    const spawn = (type: EmojiType, count: number) => {
      for (let i = 0; i < count; i++) {
        list.push({
          id: `${type}-${i}-${Math.random()}`,
          x: pad + Math.random() * (w - pad * 2),
          y: pad + Math.random() * (h - pad * 2),
          vx: (Math.random() - 0.5) * 1.0,
          vy: (Math.random() - 0.5) * 1.0,
          type,
          radius: ENTITY_RADIUS,
          wanderAngle: Math.random() * Math.PI * 2,
          convertCooldown: 0,
          pulseTimer: 0,
        });
      }
    };

    spawn('rock',     settings.rockCount);
    spawn('paper',    settings.paperCount);
    spawn('scissors', settings.scissorsCount);

    entitiesRef.current = list;
    gameOverRef.current = false;
  }, [settings.rockCount, settings.paperCount, settings.scissorsCount, syncCanvasSize]);

  // ── Sound ────────────────────────────────────────────────────────────────
  const playSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280 + Math.random() * 120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (_) { /* silently ignore */ }
  }, []);

  // ── Main game loop ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Physics knobs
    const SPEED_SCALE    = Math.max(0.4, settings.speed) * 0.55; // gentle default pace
    const MAX_SPEED      = SPEED_SCALE * 1.8;
    const ATTRACT        = 0.022 * SPEED_SCALE;
    const WANDER         = 0.007;
    const SEP_RADIUS     = 38;
    const SEP_FORCE      = 0.014;
    const FRICTION       = 0.90;

    const loop = () => {
      if (gameOverRef.current) return;
      rafRef.current = requestAnimationFrame(loop);

      if (isPausedRef.current) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;

      // Safety: if canvas somehow has no size yet, skip this frame
      if (W === 0 || H === 0) return;

      ctx.clearRect(0, 0, W, H);

      const ents = entitiesRef.current;
      const counts: Record<EmojiType, number> = { rock: 0, paper: 0, scissors: 0 };

      for (let i = 0; i < ents.length; i++) {
        const e = ents[i];
        counts[e.type]++;

        if (e.convertCooldown > 0) e.convertCooldown--;
        if (e.pulseTimer     > 0) e.pulseTimer--;

        // --- Steer toward nearest prey ---
        const preyType = STRENGTH_MAP[e.type];
        let nearestPrey: LiveEntity | null = null;
        let minD2 = Infinity;

        for (let j = 0; j < ents.length; j++) {
          if (i === j || ents[j].type !== preyType) continue;
          const dx = ents[j].x - e.x;
          const dy = ents[j].y - e.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < minD2) { minD2 = d2; nearestPrey = ents[j]; }
        }

        if (nearestPrey) {
          const dist = Math.sqrt(minD2) || 1;
          e.vx += ((nearestPrey.x - e.x) / dist) * ATTRACT;
          e.vy += ((nearestPrey.y - e.y) / dist) * ATTRACT;
        }

        // --- Wander (unique per entity) ---
        e.wanderAngle += (Math.random() - 0.5) * 0.3;
        e.vx += Math.cos(e.wanderAngle) * WANDER;
        e.vy += Math.sin(e.wanderAngle) * WANDER;

        // --- Separation from own kind ---
        for (let j = 0; j < ents.length; j++) {
          if (i === j || ents[j].type !== e.type) continue;
          const dx = e.x - ents[j].x;
          const dy = e.y - ents[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < SEP_RADIUS * SEP_RADIUS && d2 > 0) {
            const d = Math.sqrt(d2);
            e.vx += (dx / d) * SEP_FORCE;
            e.vy += (dy / d) * SEP_FORCE;
          }
        }

        // --- Friction + speed cap ---
        e.vx *= FRICTION;
        e.vy *= FRICTION;
        const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
        if (spd > MAX_SPEED) {
          e.vx = (e.vx / spd) * MAX_SPEED;
          e.vy = (e.vy / spd) * MAX_SPEED;
        }

        // --- Move ---
        e.x += e.vx;
        e.y += e.vy;

        // --- Soft wall bounce ---
        const r = e.radius;
        if (e.x < r)     { e.x = r;     e.vx =  Math.abs(e.vx) * 0.6; }
        if (e.x > W - r) { e.x = W - r; e.vx = -Math.abs(e.vx) * 0.6; }
        if (e.y < r)     { e.y = r;     e.vy =  Math.abs(e.vy) * 0.6; }
        if (e.y > H - r) { e.y = H - r; e.vy = -Math.abs(e.vy) * 0.6; }

        // --- Collision + conversion (check each pair once) ---
        for (let j = i + 1; j < ents.length; j++) {
          const o = ents[j];
          const dx = o.x - e.x;
          const dy = o.y - e.y;
          const d2 = dx * dx + dy * dy;
          const minDist = r + o.radius;

          if (d2 >= minDist * minDist) continue;

          const dist = Math.sqrt(d2) || 0.01;
          const nx = dx / dist;
          const ny = dy / dist;

          // Push apart
          const overlap = (minDist - dist) * 0.5;
          e.x -= nx * overlap;
          e.y -= ny * overlap;
          o.x += nx * overlap;
          o.y += ny * overlap;

          // Elastic bounce
          const dvx = o.vx - e.vx;
          const dvy = o.vy - e.vy;
          const dot = dvx * nx + dvy * ny;
          if (dot < 0) {
            const imp = dot * 0.35;
            e.vx += imp * nx; e.vy += imp * ny;
            o.vx -= imp * nx; o.vy -= imp * ny;
          }

          // Conversion (one-at-a-time with cooldown)
          if (STRENGTH_MAP[e.type] === o.type && e.convertCooldown === 0) {
            o.type           = e.type;
            o.wanderAngle    = Math.random() * Math.PI * 2;
            o.pulseTimer     = 25;
            e.convertCooldown = CONVERT_COOLDOWN;
            playSound();
          } else if (STRENGTH_MAP[o.type] === e.type && o.convertCooldown === 0) {
            e.type           = o.type;
            e.wanderAngle    = Math.random() * Math.PI * 2;
            e.pulseTimer     = 25;
            o.convertCooldown = CONVERT_COOLDOWN;
            playSound();
          }
        }

        // --- Draw ---
        const scale = e.pulseTimer > 0 ? 1 + (e.pulseTimer / 25) * 0.4 : 1;
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.scale(scale, scale);
        ctx.font = `${EMOJI_FONT_SIZE}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor   = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur    = 5;
        ctx.shadowOffsetY = 2;
        ctx.fillText(EMOJI_MAP[e.type], 0, 0);
        ctx.restore();
      }

      onUpdateCounts({ ...counts });

      // Game over check
      const alive = (Object.entries(counts) as [EmojiType, number][]).filter(([, n]) => n > 0);
      if (settings.mode === 'last-man-standing' && alive.length === 1) {
        gameOverRef.current = true;
        onGameOver(alive[0][0] as EmojiType);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [settings.speed, settings.mode, onUpdateCounts, onGameOver, playSound]);

  // ── Spawn on mount + canvas ready ───────────────────────────────────────
  useEffect(() => {
    // Small delay so the DOM has painted and clientWidth/Height are real
    const t = setTimeout(() => {
      syncCanvasSize();
      spawnEntities();
    }, 50);
    return () => clearTimeout(t);
  }, [spawnEntities, syncCanvasSize]);

  // ── Resize handler ───────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => syncCanvasSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncCanvasSize]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{
        backgroundImage:    settings.background ? `url(${settings.background})` : 'none',
        backgroundSize:     'cover',
        backgroundPosition: 'center',
      }}
    />
  );
};

export default Simulation;
