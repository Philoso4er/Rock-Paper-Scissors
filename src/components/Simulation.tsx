import React, { useEffect, useRef, useCallback } from 'react';
import { EmojiType, GameSettings, STRENGTH_MAP, EMOJI_MAP, SPEED_MAP, TEAM_COLORS } from '../types';

interface LiveEntity {
  id: string;
  x: number; y: number;
  vx: number; vy: number;
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
  onConversion: (x: number, y: number, newType: EmojiType) => void;
  isPaused: boolean;
}

const EMOJI_SIZE  = 22;
const RADIUS      = 16;
const COOLDOWN    = 40;

const Simulation: React.FC<SimulationProps> = ({
  settings, onUpdateCounts, onGameOver, onConversion, isPaused
}) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const entitiesRef  = useRef<LiveEntity[]>([]);
  const rafRef       = useRef<number | null>(null);
  const isPausedRef  = useRef(isPaused);
  const gameOverRef  = useRef(false);
  const audioCtxRef  = useRef<AudioContext | null>(null);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const syncSize = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return { w: 0, h: 0 };
    const p = c.parentElement;
    const w = p ? p.clientWidth  : window.innerWidth;
    const h = p ? p.clientHeight : window.innerHeight;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return { w, h };
  }, []);

  const spawn = useCallback(() => {
    const { w, h } = syncSize();
    if (w === 0 || h === 0) return;
    const pad  = 50;
    const list: LiveEntity[] = [];
    const add = (type: EmojiType, count: number) => {
      for (let i = 0; i < count; i++) {
        list.push({
          id: `${type}-${i}-${Math.random()}`,
          x: pad + Math.random() * (w - pad * 2),
          y: pad + Math.random() * (h - pad * 2),
          vx: (Math.random() - 0.5),
          vy: (Math.random() - 0.5),
          type, radius: RADIUS,
          wanderAngle: Math.random() * Math.PI * 2,
          convertCooldown: 0,
          pulseTimer: 0,
        });
      }
    };
    add('rock',     settings.rockCount);
    add('paper',    settings.paperCount);
    add('scissors', settings.scissorsCount);
    entitiesRef.current = list;
    gameOverRef.current = false;
  }, [settings.rockCount, settings.paperCount, settings.scissorsCount, syncSize]);

  const playSound = useCallback(() => {
    try {
      if (!audioCtxRef.current)
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx  = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280 + Math.random() * 120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch (_) {}
  }, []);

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const speedVal    = SPEED_MAP[settings.speed];
    const MAX_SPEED   = speedVal * 1.7;
    const ATTRACT     = 0.022 * speedVal;
    const WANDER      = 0.007;
    const SEP_R       = 38;
    const SEP_F       = 0.014;
    const FRICTION    = 0.90;

    const loop = () => {
      if (gameOverRef.current) return;
      rafRef.current = requestAnimationFrame(loop);
      if (isPausedRef.current) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      if (W === 0 || H === 0) return;

      ctx.clearRect(0, 0, W, H);
      const ents = entitiesRef.current;
      const counts: Record<EmojiType, number> = { rock: 0, paper: 0, scissors: 0 };

      for (let i = 0; i < ents.length; i++) {
        const e = ents[i];
        counts[e.type]++;
        if (e.convertCooldown > 0) e.convertCooldown--;
        if (e.pulseTimer > 0)      e.pulseTimer--;

        // Seek nearest prey
        const preyType = STRENGTH_MAP[e.type];
        let nearestPrey: LiveEntity | null = null;
        let minD2 = Infinity;
        for (let j = 0; j < ents.length; j++) {
          if (i === j || ents[j].type !== preyType) continue;
          const dx = ents[j].x - e.x, dy = ents[j].y - e.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < minD2) { minD2 = d2; nearestPrey = ents[j]; }
        }
        if (nearestPrey) {
          const dist = Math.sqrt(minD2) || 1;
          e.vx += ((nearestPrey.x - e.x) / dist) * ATTRACT;
          e.vy += ((nearestPrey.y - e.y) / dist) * ATTRACT;
        }

        // Wander
        e.wanderAngle += (Math.random() - 0.5) * 0.3;
        e.vx += Math.cos(e.wanderAngle) * WANDER;
        e.vy += Math.sin(e.wanderAngle) * WANDER;

        // Separation
        for (let j = 0; j < ents.length; j++) {
          if (i === j || ents[j].type !== e.type) continue;
          const dx = e.x - ents[j].x, dy = e.y - ents[j].y;
          const d2 = dx*dx + dy*dy;
          if (d2 < SEP_R*SEP_R && d2 > 0) {
            const d = Math.sqrt(d2);
            e.vx += (dx/d)*SEP_F; e.vy += (dy/d)*SEP_F;
          }
        }

        // Friction + cap
        e.vx *= FRICTION; e.vy *= FRICTION;
        const spd = Math.sqrt(e.vx*e.vx + e.vy*e.vy);
        if (spd > MAX_SPEED) { e.vx=(e.vx/spd)*MAX_SPEED; e.vy=(e.vy/spd)*MAX_SPEED; }

        // Move
        e.x += e.vx; e.y += e.vy;

        // Walls
        const r = e.radius;
        if (e.x < r)     { e.x = r;     e.vx =  Math.abs(e.vx)*0.6; }
        if (e.x > W - r) { e.x = W - r; e.vx = -Math.abs(e.vx)*0.6; }
        if (e.y < r)     { e.y = r;     e.vy =  Math.abs(e.vy)*0.6; }
        if (e.y > H - r) { e.y = H - r; e.vy = -Math.abs(e.vy)*0.6; }

        // Collisions + conversion
        for (let j = i + 1; j < ents.length; j++) {
          const o = ents[j];
          const dx = o.x - e.x, dy = o.y - e.y;
          const d2 = dx*dx + dy*dy;
          const minD = r + o.radius;
          if (d2 >= minD*minD) continue;
          const dist = Math.sqrt(d2) || 0.01;
          const nx = dx/dist, ny = dy/dist;
          const overlap = (minD - dist) * 0.5;
          e.x -= nx*overlap; e.y -= ny*overlap;
          o.x += nx*overlap; o.y += ny*overlap;
          const dvx = o.vx-e.vx, dvy = o.vy-e.vy;
          const dot = dvx*nx + dvy*ny;
          if (dot < 0) {
            const imp = dot * 0.35;
            e.vx += imp*nx; e.vy += imp*ny;
            o.vx -= imp*nx; o.vy -= imp*ny;
          }
          if (STRENGTH_MAP[e.type] === o.type && e.convertCooldown === 0) {
            o.type = e.type;
            o.wanderAngle = Math.random() * Math.PI * 2;
            o.pulseTimer  = 25;
            e.convertCooldown = COOLDOWN;
            playSound();
            onConversion(o.x, o.y, e.type);
          } else if (STRENGTH_MAP[o.type] === e.type && o.convertCooldown === 0) {
            e.type = o.type;
            e.wanderAngle = Math.random() * Math.PI * 2;
            e.pulseTimer  = 25;
            o.convertCooldown = COOLDOWN;
            playSound();
            onConversion(e.x, e.y, o.type);
          }
        }

        // Draw
        const scale = e.pulseTimer > 0 ? 1 + (e.pulseTimer / 25) * 0.4 : 1;
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.scale(scale, scale);
        ctx.font = `${EMOJI_SIZE}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor   = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur    = 5;
        ctx.shadowOffsetY = 2;
        ctx.fillText(EMOJI_MAP[e.type], 0, 0);
        ctx.restore();
      }

      onUpdateCounts({ ...counts });

      const alive = (Object.entries(counts) as [EmojiType, number][]).filter(([,n]) => n > 0);
      if (settings.mode === 'last-man-standing' && alive.length === 1) {
        gameOverRef.current = true;
        onGameOver(alive[0][0] as EmojiType);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [settings.speed, settings.mode, onUpdateCounts, onGameOver, onConversion, playSound]);

  useEffect(() => {
    const t = setTimeout(() => { syncSize(); spawn(); }, 50);
    return () => clearTimeout(t);
  }, [spawn, syncSize]);

  useEffect(() => {
    const onResize = () => syncSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncSize]);

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
