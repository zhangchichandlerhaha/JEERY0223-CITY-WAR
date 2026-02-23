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
  const levelRef = useRef(1);
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
    levelRef.current = 1;
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

    // Difficulty Lowering: Check if clicked near any rocket's trajectory
    rocketsRef.current.forEach(r => {
      const x1 = r.originX;
      const y1 = 0;
      const x2 = r.targetX;
      const y2 = 0.9;
      
      const A = x - x1;
      const B = y - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;
      if (param < 0) {
        xx = x1; yy = y1;
      } else if (param > 1) {
        xx = x2; yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      const dx = x - xx;
      const dy = y - yy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // If click is close to trajectory, destroy the rocket and trigger explosion
      if (dist < 0.05) { // Increased detection range
        r.progress = 2; // Destroy rocket
        scoreRef.current += 20;
        onScoreChange(scoreRef.current);
        
        // Spawn a large explosion at the click point
        playExplosionSound();
        explosionsRef.current.push({
          id: `smart-${Math.random()}`,
          x: xx,
          y: yy,
          radius: 0,
          maxRadius: 0.15,
          expanding: true
        });
      }
    });

    fireMissile(x, y);
  };

  const playExplosionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const update = (time: number) => {
    if (gameState !== 'PLAYING') return;

    rocketsRef.current = rocketsRef.current.filter(r => r.progress <= 1);
    missilesRef.current = missilesRef.current.filter(m => m.progress < 1);
    explosionsRef.current = explosionsRef.current.filter(e => e.radius > 0);

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const speedMultiplier = dt / 16.6;
    
    // Level Logic
    if (scoreRef.current < 300) levelRef.current = 1;
    else if (scoreRef.current < 600) levelRef.current = 2;
    else levelRef.current = 3;

    const levelSpeedMultiplier = levelRef.current === 1 ? 1.0 : (levelRef.current === 2 ? 1.5 : 2.0);

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
          speed: (0.0008 + (scoreRef.current / 15000) * 0.001) * levelSpeedMultiplier,
          progress: 0
        });
        lastSpawnTime.current = time;
        spawnInterval.current = Math.max(800, 2500 - (scoreRef.current / 1000) * 1000) / levelSpeedMultiplier;
      }
    }

    rocketsRef.current.forEach(r => {
      r.progress += r.speed * speedMultiplier;
      r.x = r.originX + (r.targetX - r.originX) * r.progress;
      r.y = r.progress * 0.9;

      if (r.progress >= 1) {
        playExplosionSound();
        explosionsRef.current.push({
          id: `impact-${Math.random()}`,
          x: r.targetX,
          y: 0.9,
          radius: 0,
          maxRadius: 0.06,
          expanding: true
        });

        citiesRef.current.forEach(c => {
          if (!c.destroyed && Math.abs(c.x - r.targetX) < 0.04) {
            c.destroyed = true;
          }
        });
        batteriesRef.current.forEach(b => {
          if (!b.destroyed && Math.abs(b.x - r.targetX) < 0.04) {
            b.destroyed = true;
            onAmmoUpdate([...batteriesRef.current]);
          }
        });
        r.progress = 2;
      }
    });

    missilesRef.current.forEach(m => {
      m.progress += m.speed * speedMultiplier;
      m.x = m.originX + (m.targetX - m.originX) * m.progress;
      m.y = m.originY + (m.targetY - m.originY) * m.progress;

      if (m.progress >= 1) {
        playExplosionSound();
        explosionsRef.current.push({
          id: Math.random().toString(),
          x: m.targetX,
          y: m.targetY,
          radius: 0,
          maxRadius: 0.12, // Larger explosions
          expanding: true
        });
      }
    });

    explosionsRef.current.forEach(e => {
      if (e.expanding) {
        e.radius += 0.003 * speedMultiplier;
        if (e.radius >= e.maxRadius) e.expanding = false;
      } else {
        e.radius = Math.max(0, e.radius - 0.002 * speedMultiplier);
      }

      rocketsRef.current.forEach(r => {
        const dx = r.x - e.x;
        const dy = r.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < e.radius) {
          r.progress = 2;
          scoreRef.current += 20;
          onScoreChange(scoreRef.current);
        }
      });
    });

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

    // Draw Battlefield Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);
    
    // Level Indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.font = 'bold 120px italic tracking-tighter';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${levelRef.current}`, w/2, h/2);

    // Subtle grid/tech background
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<w; i+=50) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    }
    for(let i=0; i<h; i+=50) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }

    // Draw Ground (Battlefield style)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, h * 0.9, w, h * 0.1);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, h * 0.9, w, h * 0.1);

    // Draw Cities (Real city look)
    citiesRef.current.forEach(c => {
      if (!c.destroyed) {
        ctx.fillStyle = '#2c3e50';
        // Main building
        ctx.fillRect(c.x * w - 20, c.y * h - 40, 15, 40);
        ctx.fillRect(c.x * w - 5, c.y * h - 60, 15, 60);
        ctx.fillRect(c.x * w + 10, c.y * h - 30, 10, 30);
        // Windows
        ctx.fillStyle = '#f1c40f';
        for(let i=0; i<3; i++) {
           ctx.fillRect(c.x * w - 17, c.y * h - 35 + i*10, 3, 3);
           ctx.fillRect(c.x * w + 2, c.y * h - 55 + i*10, 3, 3);
        }
      } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(c.x * w - 20, c.y * h - 5, 40, 5);
      }
    });

    // Draw Batteries (Cannon/Tank look)
    batteriesRef.current.forEach(b => {
      if (!b.destroyed) {
        ctx.save();
        ctx.translate(b.x * w, b.y * h);
        
        // Tank treads
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(-30, -10, 60, 10);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        for(let i=-25; i<=25; i+=10) {
          ctx.strokeRect(i, -10, 5, 10);
        }

        // Tank body
        ctx.fillStyle = '#2f3640';
        ctx.beginPath();
        ctx.moveTo(-25, -10);
        ctx.lineTo(25, -10);
        ctx.lineTo(20, -25);
        ctx.lineTo(-20, -25);
        ctx.closePath();
        ctx.fill();

        // Turret
        ctx.fillStyle = '#353b48';
        ctx.beginPath();
        ctx.arc(0, -25, 15, Math.PI, 0);
        ctx.fill();
        
        // Cannon barrel with muzzle brake
        ctx.strokeStyle = '#2f3640';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, -60);
        ctx.stroke();
        
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(-8, -65, 16, 8); // Muzzle brake
        
        ctx.restore();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.ammo.toString(), b.x * w, b.y * h + 20);
      } else {
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(b.x * w, b.y * h, 15, 0, Math.PI, true);
        ctx.fill();
      }
    });

    // Draw Rockets (Larger)
    rocketsRef.current.forEach(r => {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.originX * w, 0);
      ctx.lineTo(r.x * w, r.y * h);
      ctx.stroke();
      
      const dx = (r.targetX - r.originX) * w;
      const dy = 0.9 * h;
      const angle = Math.atan2(dy, dx) - Math.PI / 2;

      ctx.save();
      ctx.translate(r.x * w, r.y * h);
      ctx.rotate(angle);
      
      // Larger Missile Body
      ctx.fillStyle = '#d63031';
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-10, -25);
      ctx.lineTo(0, -18);
      ctx.lineTo(10, -25);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, -5, 5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      
      const fireSize = 8 + Math.random() * 8;
      const fireGradient = ctx.createRadialGradient(0, -20, 0, 0, -20, fireSize);
      fireGradient.addColorStop(0, '#fdcb6e');
      fireGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = fireGradient;
      ctx.beginPath();
      ctx.arc(0, -20, fireSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw Player Missiles (Larger)
    missilesRef.current.forEach(m => {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.originX * w, m.originY * h);
      ctx.lineTo(m.x * w, m.y * h);
      ctx.stroke();
      
      ctx.fillStyle = '#00b894';
      ctx.beginPath();
      ctx.arc(m.x * w, m.y * h, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.targetX * w - 8, m.targetY * h - 8);
      ctx.lineTo(m.targetX * w + 8, m.targetY * h + 8);
      ctx.moveTo(m.targetX * w + 8, m.targetY * h - 8);
      ctx.lineTo(m.targetX * w - 8, m.targetY * h + 8);
      ctx.stroke();
    });

    // Draw Explosions
    explosionsRef.current.forEach(e => {
      const radius = Math.max(0, e.radius * w);
      if (radius <= 0) return;

      const gradient = ctx.createRadialGradient(e.x * w, e.y * h, 0, e.x * w, e.y * h, radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.3, '#fab1a0');
      gradient.addColorStop(0.6, '#e17055');
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
