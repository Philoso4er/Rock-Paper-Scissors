import React, { useEffect, useRef } from 'react';
import { Entity, EmojiType, GameSettings, STRENGTH_MAP, EMOJI_MAP } from '../types';

// Extended entity with behaviour fields
interface LiveEntity extends Entity {
  wanderAngle: number;       // personal drift angle for individuality
  convertCooldown: number;   // frames before this entity can convert again
  pulseTimer: number;        // frames of post-conversion size pulse
}

interface SimulationProps {
  settings: GameSettings;
  onUpdateCounts: (counts: Record<EmojiType, number>) => void;
  onGameOver: (winner: EmojiType | 'draw') => void;
  isPaused: boolean;
}

const Simulation: React.FC<SimulationProps> = ({ settings, onUpdateCounts, onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entitiesRef = useRef<LiveEntity[]>([]);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // ── Spawn entities ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.width  || canvas.parentElement?.clientWidth  || 800;
    const H = canvas.height || canvas.parentElement?.clientHeight || 600;
    const pad = 40;
    const entities: LiveEntity[] = [];

    const spawn = (type: EmojiType, count: number) => {
      for (let i = 0; i < count; i++) {
        // Scatter randomly across the whole canvas with padding
        entities.push({
          id: `${type}-${i}-${Math.random()}`,
          x: pad + Math.random() * (W - pad * 2),
          y: pad + Math.random() * (H - pad * 2),
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          type,
          radius: 16,
          wanderAngle: Math.random() * Math.PI * 2,
          convertCooldown: 0,
          pulseTimer: 0,
        });
      }
    };

    spawn('rock',     settings.rockCount);
    spawn('paper',    settings.paperCount);
    spawn('scissors', settings.scissorsCount);

    entitiesRef.current = entities;
  }, [settings.rockCount, settings.paperCount, settings.scissorsCount]);

  // ── Sound ───────────────────────────────────────────────────────────────────
  const playConvertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (_) { /* ignore audio errors */ }
  };

  // ── Animation loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Physics constants — tuned for a watchable, dramatic pace
    const BASE_SPEED      = 0.9;   // px/frame baseline (sweet spot)
    const MAX_SPEED       = () => BASE_SPEED * Math.max(0.5, settings.speed);
    const ATTRACT_FORCE   = 0.018; // how strongly entities steer toward prey
    const WANDER_FORCE    = 0.006; // random drift so paths feel organic
    const SEPARATE_RADIUS = 36;    // personal space from same-type neighbours
    const SEPARATE_FORCE  = 0.012;
    const FRICTION        = 0.92;
    const CONVERT_COOLDOWN_FRAMES = 18; // ~0.3 s at 60 fps — one conversion at a time

    const animate = (time: number) => {
      if (isPausedRef.current) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      lastTimeRef.current = time;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const entities = entitiesRef.current;
      const counts: Record<EmojiType, number> = { rock: 0, paper: 0, scissors: 0 };

      // ── Per-entity update ─────────────────────────────────────────────────
      for (let i = 0; i < entities.length; i++) {
        const e = entities[i];
        counts[e.type]++;

        // Tick cooldowns
        if (e.convertCooldown > 0) e.convertCooldown--;
        if (e.pulseTimer > 0) e.pulseTimer--;

        // 1. Find nearest prey
        const preyType = STRENGTH_MAP[e.type];
        let nearestPrey: LiveEntity | null = null;
        let minDistSq = Infinity;
        for (let j = 0; j < entities.length; j++) {
          if (i === j) continue;
          if (entities[j].type !== preyType) continue;
          const dx = entities[j].x - e.x;
          const dy = entities[j].y - e.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < minDistSq) { minDistSq = d2; nearestPrey = entities[j]; }
        }

        // 2. Steering toward prey
        if (nearestPrey) {
          const dx = nearestPrey.x - e.x;
          const dy = nearestPrey.y - e.y;
          const dist = Math.sqrt(minDistSq) || 1;
          e.vx += (dx / dist) * ATTRACT_FORCE * settings.speed;
          e.vy += (dy / dist) * ATTRACT_FORCE * settings.speed;
        }

        // 3. Wander (individual drift — each entity's angle evolves uniquely)
        e.wanderAngle += (Math.random() - 0.5) * 0.25;
        e.vx += Math.cos(e.wanderAngle) * WANDER_FORCE;
        e.vy += Math.sin(e.wanderAngle) * WANDER_FORCE;

        // 4. Separation from own kind (prevents blob clumping)
        for (let j = 0; j < entities.length; j++) {
          if (i === j || entities[j].type !== e.type) continue;
          const dx = e.x - entities[j].x;
          const dy = e.y - entities[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < SEPARATE_RADIUS * SEPARATE_RADIUS && d2 > 0) {
            const dist = Math.sqrt(d2);
            e.vx += (dx / dist) * SEPARATE_FORCE;
            e.vy += (dy / dist) * SEPARATE_FORCE;
          }
        }

        // 5. Friction + speed cap
        e.vx *= FRICTION;
        e.vy *= FRICTION;
        const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
        const cap = MAX_SPEED();
        if (spd > cap) {
          e.vx = (e.vx / spd) * cap;
          e.vy = (e.vy / spd) * cap;
        }

        // 6. Move
        e.x += e.vx;
        e.y += e.vy;

        // 7. Soft boundary — bounce gently off walls
        if (e.x < e.radius)     { e.x = e.radius;     e.vx =  Math.abs(e.vx) * 0.5; }
        if (e.x > W - e.radius) { e.x = W - e.radius; e.vx = -Math.abs(e.vx) * 0.5; }
        if (e.y < e.radius)     { e.y = e.radius;      e.vy =  Math.abs(e.vy) * 0.5; }
        if (e.y > H - e.radius) { e.y = H - e.radius;  e.vy = -Math.abs(e.vy) * 0.5; }

        // 8. Collision response + conversion
        for (let j = i + 1; j < entities.length; j++) {
          const o = entities[j];
          const dx = o.x - e.x;
          const dy = o.y - e.y;
          const d2 = dx * dx + dy * dy;
          const minD = e.radius + o.radius;

          if (d2 >= minD * minD) continue;
          const dist = Math.sqrt(d2) || 0.01;

          // Physical separation
          const overlap = (minD - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          e.x -= nx * overlap * 0.5;
          e.y -= ny * overlap * 0.5;
          o.x += nx * overlap * 0.5;
          o.y += ny * overlap * 0.5;

          // Velocity exchange (elastic-ish)
          const dvx = o.vx - e.vx;
          const dvy = o.vy - e.vy;
          const dot = dvx * nx + dvy * ny;
          if (dot < 0) {
            const impulse = dot * 0.4;
            e.vx += impulse * nx;
            e.vy += impulse * ny;
            o.vx -= impulse * nx;
            o.vy -= impulse * ny;
          }

          // Conversion — one at a time per entity, with cooldown
          if (STRENGTH_MAP[e.type] === o.type && e.convertCooldown === 0) {
            // e beats o
            o.type = e.type;
            o.wanderAngle = Math.random() * Math.PI * 2;
            o.pulseTimer = 20;
            e.convertCooldown = CONVERT_COOLDOWN_FRAMES;
            playConvertSound();
          } else if (STRENGTH_MAP[o.type] === e.type && o.convertCooldown === 0) {
            // o beats e
            e.type = o.type;
            e.wanderAngle = Math.random() * Math.PI * 2;
            e.pulseTimer = 20;
            o.convertCooldown = CONVERT_COOLDOWN_FRAMES;
            playConvertSound();
          }
        }

        // 9. Draw emoji
        const pulse = e.pulseTimer > 0 ? 1 + (e.pulseTimer / 20) * 0.35 : 1;
        const fontSize = Math.round(26 * pulse);
        ctx.font = `${fontSize}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Subtle shadow for depth
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.fillText(EMOJI_MAP[e.type], e.x, e.y);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }

      // ── Push counts up ───────────────────────────────────────────────────
      onUpdateCounts({ ...counts });

      // ── Game over check ─────────────────────────────────────────────────
      const alive = (Object.entries(counts) as [EmojiType, number][]).filter(([, n]) => n > 0);
      if (settings.mode === 'last-man-standing' && alive.length === 1) {
        onGameOver(alive[0][0]);
        return;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  // Re-run when speed changes (loop captures settings.speed via closure refresh)
  }, [settings.speed, settings.mode, onUpdateCounts, onGameOver]);

  // ── Canvas resize ───────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width  = c.parentElement?.clientWidth  || 800;
      c.height = c.parentElement?.clientHeight || 600;
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{
        backgroundImage: settings.background ? `url(${settings.background})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  );
};

export default Simulation;
