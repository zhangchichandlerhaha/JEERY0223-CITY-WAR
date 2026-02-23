import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Rocket, Missile, Explosion, Battery, City, GameState, Point } from '../types';

interface GameEngineProps {
  gameState: GameState;
  onScoreChange: (score: number) => void;
  onGameOver: (won: boolean) => void;
  onAmmoUpdate: (batteries: Battery[]) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ gameState, onScoreChange, onGameOver, onAmmoUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  
  // Game State Refs (to avoid closure issues in loop)
  const scoreRef = useRef(0);
  const rocketsRef = useRef<Rocket[]>([]);
  const missilesRef = useRef<Missile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const batteriesRef = useRef<Battery[]>([
    { id: 'B1', x: 0.05, y: 0.9, ammo: 20, maxAmmo: 20, destroyed: false },
    { id: 'B2', x: 0.25, y: 0.9, ammo: 20, maxAmmo: 20, destroyed: false },
    { id: 'B3', x: 0.5, y: 0.9, ammo: 40, maxAmmo: 40, destroyed: false },
    { id: 'B4', x: 0.75, y: 0.9, ammo: 20, maxAmmo: 20, destroyed: false },
    { id: 'B5', x: 0.95, y: 0.9, ammo: 20, maxAmmo: 20, destroyed: false },
  ]);
  const citiesRef = useRef<City[]>([
    { id: 'c1', x: 0.15, y: 0.9, destroyed: false },
    { id: 'c2', x: 0.35, y: 0.9, destroyed: false },
    { id: 'c3', x: 0.65, y: 0.9, destroyed: false },
    { id: 'c4', x: 0.85, y: 0.9, destroyed: false },
  ]);

  const lastTimeRef = useRef(0);
  const lastSpawnTime = useRef(0);
  const spawnInterval = useRef(2000);

  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    rocketsRef.current = [];
    missilesRef.current = [];
    explosionsRef.current = [];
    lastTimeRef.current = 0;
    lastSpawnTime.current = 0;
    batteriesRef.current = [
      { id: 'B1', x: 0.05, y: 0.9, ammo: 20, maxAmmo: 20, destroyed: false },
      { id: 'B2', x: 0.25, y: 0.9, ammo: 20, maxAmmo: 20, destroyed: false },
      { id: 'B3', x: 0.5, y: 0.9, ammo: 40, maxAmmo: 40, destroyed: false },
      { id: 'B4', x: 0.75, y: 0.9, ammo: 20, maxAmmo: 20, destroyed: false },
      { id: 'B5', x: 0.95, y: 0.9, ammo: 20, maxAmmo: 20, destroyed: false },
    ];
    citiesRef.current = [
      { id: 'c1', x: 0.15, y: 0.9, destroyed: false },
      { id: 'c2', x: 0.35, y: 0.9, destroyed: false },
      { id: 'c3', x: 0.65, y: 0.9, destroyed: false },
      { id: 'c4', x: 0.85, y: 0.9, destroyed: false },
    ];
    spawnInterval.current = 2000;
    onScoreChange(0);
    onAmmoUpdate(batteriesRef.current);
  }, [onScoreChange, onAmmoUpdate]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      resetGame();
    }
  }, [gameState, resetGame]);

  const fireMissile = (targetX: number, targetY: number) => {
    if (gameState !== 'PLAYING') return;

    // Find closest battery with ammo
    let bestBattery: Battery | null = null;
    let minDist = Infinity;

    batteriesRef.current.forEach(b => {
      if (!b.destroyed && b.ammo > 0) {
        const dist = Math.abs(b.x - targetX);
        if (dist < minDist) {
          minDist = dist;
          bestBattery = b;
        }
      }
    });

    if (bestBattery) {
      bestBattery.ammo--;
      onAmmoUpdate([...batteriesRef.current]);
      
      missilesRef.current.push({
        id: Math.random().toString(),
        x: bestBattery.x,
        y: bestBattery.y,
        originX: bestBattery.x,
        originY: bestBattery.y,
        targetX,
        targetY,
        speed: 0.015,
        progress: 0
      });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    fireMissile(x, y);
  };

  const update = (time: number) => {
    if (gameState !== 'PLAYING') return;

    rocketsRef.current = rocketsRef.current.filter(r => r.progress <= 1);
    missilesRef.current = missilesRef.current.filter(m => m.progress < 1);
    explosionsRef.current = explosionsRef.current.filter(e => e.radius > 0);

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Normalize speed based on 60fps (16.6ms per frame)
    const speedMultiplier = dt / 16.6;
    
    // Spawn rockets
    if (time - lastSpawnTime.current > spawnInterval.current) {
      const targets = [...citiesRef.current.filter(c => !c.destroyed), ...batteriesRef.current.filter(b => !b.destroyed)];
      if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        rocketsRef.current.push({
          id: Math.random().toString(),
          x: Math.random(),
          y: 0,
          originX: Math.random(),
          targetX: target.x,
          speed: 0.0008 + (scoreRef.current / 10000) * 0.001,
          progress: 0
        });
        lastSpawnTime.current = time;
        spawnInterval.current = Math.max(800, 2000 - (scoreRef.current / 1000) * 1000);
      }
    }

    // Update Rockets
    rocketsRef.current.forEach(r => {
      r.progress += r.speed * speedMultiplier;
      r.x = r.originX + (r.targetX - r.originX) * r.progress;
      r.y = r.progress * 0.9; // Scale to ground level (0.9)

      // Check if hit target (at ground level 0.9)
      if (r.progress >= 1) {
        // Create an enemy impact explosion
        explosionsRef.current.push({
          id: `impact-${Math.random()}`,
          x: r.targetX,
          y: 0.9,
          radius: 0,
          maxRadius: 0.05,
          expanding: true
        });

        // Find what it hit
        citiesRef.current.forEach(c => {
          if (!c.destroyed && Math.abs(c.x - r.targetX) < 0.03) {
            c.destroyed = true;
          }
        });
        batteriesRef.current.forEach(b => {
          if (!b.destroyed && Math.abs(b.x - r.targetX) < 0.03) {
            b.destroyed = true;
            onAmmoUpdate([...batteriesRef.current]);
          }
        });
        r.progress = 2; // Mark for removal
      }
    });

    // Update Missiles
    missilesRef.current.forEach(m => {
      m.progress += m.speed * speedMultiplier;
      m.x = m.originX + (m.targetX - m.originX) * m.progress;
      m.y = m.originY + (m.targetY - m.originY) * m.progress;

      if (m.progress >= 1) {
        explosionsRef.current.push({
          id: Math.random().toString(),
          x: m.targetX,
          y: m.targetY,
          radius: 0,
          maxRadius: 0.08,
          expanding: true
        });
      }
    });

    // Update Explosions
    explosionsRef.current.forEach(e => {
      if (e.expanding) {
        e.radius += 0.002 * speedMultiplier;
        if (e.radius >= e.maxRadius) e.expanding = false;
      } else {
        e.radius = Math.max(0, e.radius - 0.002 * speedMultiplier);
      }

      // Check collision with rockets
      rocketsRef.current.forEach(r => {
        const dx = r.x - e.x;
        const dy = r.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < e.radius) {
          r.progress = 2; // Destroy
          scoreRef.current += 20;
          onScoreChange(scoreRef.current);
        }
      });
    });

    // Check Win/Loss
    if (scoreRef.current >= 1000) {
      onGameOver(true);
    }
    const destroyedBatteries = batteriesRef.current.filter(b => b.destroyed);
    if (destroyedBatteries.length >= 3) {
      onGameOver(false);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    // Draw Ground
    ctx.fillStyle = '#222';
    ctx.fillRect(0, h * 0.9, w, h * 0.1);

    // Draw Cities
    citiesRef.current.forEach(c => {
      if (!c.destroyed) {
        ctx.fillStyle = '#4a9eff';
        ctx.fillRect(c.x * w - 15, c.y * h - 15, 30, 15);
        ctx.fillStyle = '#2a7eff';
        ctx.fillRect(c.x * w - 10, c.y * h - 25, 20, 10);
      } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(c.x * w - 15, c.y * h - 5, 30, 5);
      }
    });

    // Draw Batteries
    batteriesRef.current.forEach(b => {
      if (!b.destroyed) {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(b.x * w - 20, b.y * h);
        ctx.lineTo(b.x * w + 20, b.y * h);
        ctx.lineTo(b.x * w, b.y * h - 30);
        ctx.closePath();
        ctx.fill();
        
        // Ammo text
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.ammo.toString(), b.x * w, b.y * h + 15);
      } else {
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(b.x * w, b.y * h, 10, 0, Math.PI, true);
        ctx.fill();
      }
    });

    // Draw Rockets
    rocketsRef.current.forEach(r => {
      // Draw trail
      ctx.strokeStyle = 'rgba(255, 68, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(r.originX * w, 0);
      ctx.lineTo(r.x * w, r.y * h);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Calculate angle
      const dx = (r.targetX - r.originX) * w;
      const dy = 0.9 * h;
      const angle = Math.atan2(dy, dx) - Math.PI / 2;

      ctx.save();
      ctx.translate(r.x * w, r.y * h);
      ctx.rotate(angle);
      
      // Missile Body (larger)
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.moveTo(0, 5); // Tip
      ctx.lineTo(-6, -15); // Left fin
      ctx.lineTo(0, -10); // Bottom center
      ctx.lineTo(6, -15); // Right fin
      ctx.closePath();
      ctx.fill();
      
      // Missile Core/Glow
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, -2, 3, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Fire effect at the back
      const fireSize = 5 + Math.random() * 5;
      const fireGradient = ctx.createRadialGradient(0, -12, 0, 0, -12, fireSize);
      fireGradient.addColorStop(0, '#ffff00');
      fireGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = fireGradient;
      ctx.beginPath();
      ctx.arc(0, -12, fireSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw Missiles
    ctx.strokeStyle = '#00ff00';
    missilesRef.current.forEach(m => {
      ctx.beginPath();
      ctx.moveTo(m.originX * w, m.originY * h);
      ctx.lineTo(m.x * w, m.y * h);
      ctx.stroke();
      
      // Target X
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(m.targetX * w - 5, m.targetY * h - 5);
      ctx.lineTo(m.targetX * w + 5, m.targetY * h + 5);
      ctx.moveTo(m.targetX * w + 5, m.targetY * h - 5);
      ctx.lineTo(m.targetX * w - 5, m.targetY * h + 5);
      ctx.stroke();
    });

    // Draw Explosions
    explosionsRef.current.forEach(e => {
      const radius = Math.max(0, e.radius * w);
      if (radius <= 0) return;

      const gradient = ctx.createRadialGradient(e.x * w, e.y * h, 0, e.x * w, e.y * h, radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.5, '#ff8800');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(e.x * w, e.y * h, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const loop = (time: number) => {
    update(time);
    draw();
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair touch-none"
      onClick={handleCanvasClick}
      onTouchStart={handleCanvasClick}
    />
  );
};

export default GameEngine;
