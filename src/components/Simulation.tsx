import React, { useEffect, useRef, useState } from 'react';
import { Entity, EmojiType, GameSettings, STRENGTH_MAP, EMOJI_MAP } from '../types';

interface SimulationProps {
  settings: GameSettings;
  onUpdateCounts: (counts: Record<EmojiType, number>) => void;
  onGameOver: (winner: EmojiType | 'draw') => void;
  isPaused: boolean;
}

const Simulation: React.FC<SimulationProps> = ({ settings, onUpdateCounts, onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entitiesRef = useRef<Entity[]>([]);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize entities
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const entities: Entity[] = [];
    const padding = 60;

    const createEntities = (type: EmojiType, count: number, corner: 'tl' | 'tr' | 'bl' | 'br') => {
      let startX = 0;
      let startY = 0;

      switch (corner) {
        case 'tl': startX = padding; startY = padding; break;
        case 'tr': startX = width - padding; startY = padding; break;
        case 'bl': startX = padding; startY = height - padding; break;
        case 'br': startX = width - padding; startY = height - padding; break;
      }

      for (let i = 0; i < count; i++) {
        entities.push({
          id: `${type}-${i}-${Math.random()}`,
          x: startX + (Math.random() - 0.5) * 40,
          y: startY + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          type,
          radius: 15,
        });
      }
    };

    createEntities('rock', settings.rockCount, 'tl');
    createEntities('paper', settings.paperCount, 'tr');
    createEntities('scissors', settings.scissorsCount, 'bl');

    entitiesRef.current = entities;
  }, [settings.rockCount, settings.paperCount, settings.scissorsCount, settings.speed]);

  // Sound effect function
  const playTransformSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220 + Math.random() * 110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  };

  const animate = (time: number) => {
    if (isPaused) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const entities = entitiesRef.current;
    const counts: Record<EmojiType, number> = { rock: 0, paper: 0, scissors: 0 };

    const FRICTION = 0.96; // Slightly more friction for even calmer movement
    const ATTRACTION_FORCE = 0.0015 * settings.speed; // Even more gentle attraction
    const BOUNCE_FACTOR = 0.2; // Very soft boundary bounces
    
    // Track transformations to apply at the end of the frame
    const transformations: { index: number; newType: EmojiType }[] = [];

    // Update and draw entities
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      counts[entity.type]++;

      // 1. Find target (the one this entity is stronger than)
      const targetType = STRENGTH_MAP[entity.type];
      let nearestTarget: Entity | null = null;
      let minDistSq = Infinity;

      for (let j = 0; j < entities.length; j++) {
        if (entities[j].type === targetType) {
          const dx = entities[j].x - entity.x;
          const dy = entities[j].y - entity.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            nearestTarget = entities[j];
          }
        }
      }

      // 2. Attraction logic (Individual slow gravitation)
      if (nearestTarget) {
        const dx = nearestTarget.x - entity.x;
        const dy = nearestTarget.y - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          // Add a tiny bit of unique drift to each entity's attraction for individuality
          const individualDrift = (Math.sin(time * 0.001 + i) * 0.05);
          const nx = dx / dist;
          const ny = dy / dist;
          
          // Rotate the attraction vector slightly based on individual drift
          const cos = Math.cos(individualDrift);
          const sin = Math.sin(individualDrift);
          const adx = nx * cos - ny * sin;
          const ady = nx * sin + ny * cos;

          entity.vx += adx * ATTRACTION_FORCE;
          entity.vy += ady * ATTRACTION_FORCE;
        }
      } else {
        // Very subtle random drift when no target
        entity.vx += (Math.random() - 0.5) * 0.002;
        entity.vy += (Math.random() - 0.5) * 0.002;
      }

      // 3. Apply Friction
      entity.vx *= FRICTION;
      entity.vy *= FRICTION;

      // 4. Speed limit (Strictly capped for calm pace)
      const currentSpeed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
      const maxSpeed = settings.speed * 0.4; // Very slow base speed
      if (currentSpeed > maxSpeed) {
        entity.vx = (entity.vx / currentSpeed) * maxSpeed;
        entity.vy = (entity.vy / currentSpeed) * maxSpeed;
      }

      // 5. Update position
      entity.x += entity.vx;
      entity.y += entity.vy;

      // 6. Boundary check with soft bounce
      if (entity.x < entity.radius) {
        entity.x = entity.radius;
        entity.vx *= -BOUNCE_FACTOR;
      } else if (entity.x > width - entity.radius) {
        entity.x = width - entity.radius;
        entity.vx *= -BOUNCE_FACTOR;
      }

      if (entity.y < entity.radius) {
        entity.y = entity.radius;
        entity.vy *= -BOUNCE_FACTOR;
      } else if (entity.y > height - entity.radius) {
        entity.y = height - entity.radius;
        entity.vy *= -BOUNCE_FACTOR;
      }

      // 7. Collision check (transformation + soft physics)
      for (let j = 0; j < entities.length; j++) {
        if (i === j) continue;
        const other = entities[j];
        const dx = other.x - entity.x;
        const dy = other.y - entity.y;
        const distSq = dx * dx + dy * dy;
        const minDist = entity.radius + other.radius;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          
          // Transformation logic (Predator transforms Prey)
          // Only transform if they are actually colliding
          if (STRENGTH_MAP[entity.type] === other.type) {
            if (other.type !== entity.type) {
              transformations.push({ index: j, newType: entity.type });
            }
          }

          // Soft Physics Bounce (Repulsion to prevent clumping)
          if (dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const rvx = other.vx - entity.vx;
            const rvy = other.vy - entity.vy;
            const velAlongNormal = rvx * nx + rvy * ny;
            
            if (velAlongNormal < 0) {
              const restitution = 0.3; // Slightly more bouncy to keep them separate
              let j_impulse = -(1 + restitution) * velAlongNormal;
              j_impulse /= 2;

              entity.vx -= j_impulse * nx;
              entity.vy -= j_impulse * ny;
              other.vx += j_impulse * nx;
              other.vy += j_impulse * ny;
            }

            // Positional correction (Stronger push-out to prevent clumping)
            const overlap = minDist - dist;
            const correction = (overlap / 2) * 0.15;
            entity.x -= nx * correction;
            entity.y -= ny * correction;
            other.x += nx * correction;
            other.y += ny * correction;
          }
        }
      }

      // 8. Draw
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.8; // Softer appearance
      ctx.fillText(EMOJI_MAP[entity.type], entity.x, entity.y);
      ctx.globalAlpha = 1.0;
    }

    // Apply transformations at the end of the frame
    // This ensures that an emoji transformed in this frame doesn't 
    // immediately transform another in the same frame (prevents chain reactions)
    transformations.forEach(t => {
      if (entities[t.index].type !== t.newType) {
        entities[t.index].type = t.newType;
        playTransformSound();
      }
    });

    onUpdateCounts(counts);

    // Check game over
    const typesPresent = Object.entries(counts).filter(([_, count]) => count > 0);
    if (settings.mode === 'last-man-standing' && typesPresent.length === 1) {
      onGameOver(typesPresent[0][0] as EmojiType);
      return;
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPaused, settings.speed]);

  // Handle canvas resizing
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement?.clientWidth || 800;
        canvasRef.current.height = canvasRef.current.parentElement?.clientHeight || 600;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
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
