'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSoundController } from '@/lib/sound';

/**
 * CAR RACE APP
 * Retro 2D top-down racing game with green/black terminal theme.
 * Dodge traffic, collect fuel, survive as long as possible!
 */

const GAME_WIDTH = 300;
const GAME_HEIGHT = 400;
const ROAD_WIDTH = 200;
const LANE_COUNT = 3;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
const ROAD_LEFT = (GAME_WIDTH - ROAD_WIDTH) / 2;
const CAR_WIDTH = 30;
const CAR_HEIGHT = 50;

// Green terminal colors
const COLOR_BG = '#0a0a0a';
const COLOR_GREEN = '#00ff00';
const COLOR_GREEN_DIM = '#00aa00';
const COLOR_GREEN_DARK = '#006600';

interface PlayerCar {
  lane: number;
  x: number;
  y: number;
}

interface EnemyCar {
  y: number;
  lane: number;
  speed: number;
}

interface FuelPickup {
  y: number;
  lane: number;
}

interface RoadLine {
  y: number;
}

export default function CarRaceApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [fuel, setFuel] = useState(100);

  const gameLoopRef = useRef<number | undefined>(undefined);
  const playerRef = useRef<PlayerCar>({ 
    lane: 1, 
    x: ROAD_LEFT + LANE_WIDTH * 1.5 - CAR_WIDTH / 2,
    y: GAME_HEIGHT - CAR_HEIGHT - 20 
  });
  const enemyCarsRef = useRef<EnemyCar[]>([]);
  const fuelPickupsRef = useRef<FuelPickup[]>([]);
  const roadLinesRef = useRef<RoadLine[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const fuelRef = useRef(100);
  const speedRef = useRef(4);
  const spawnTimerRef = useRef(0);

  const getLaneX = (lane: number) => {
    return ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2 - CAR_WIDTH / 2;
  };

  const resetGame = useCallback(() => {
    playerRef.current = { 
      lane: 1, 
      x: getLaneX(1),
      y: GAME_HEIGHT - CAR_HEIGHT - 20 
    };
    enemyCarsRef.current = [];
    fuelPickupsRef.current = [];
    roadLinesRef.current = [];
    
    // Initialize road lines
    for (let i = 0; i < 12; i++) {
      roadLinesRef.current.push({ y: i * 40 - 20 });
    }
    
    frameCountRef.current = 0;
    scoreRef.current = 0;
    fuelRef.current = 100;
    speedRef.current = 4;
    spawnTimerRef.current = 0;
    setScore(0);
    setFuel(100);
  }, []);

  const spawnEnemyCar = useCallback(() => {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    enemyCarsRef.current.push({
      y: -CAR_HEIGHT - 10,
      lane,
      speed: speedRef.current * (0.3 + Math.random() * 0.4),
    });
  }, []);

  const spawnFuel = useCallback(() => {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    fuelPickupsRef.current.push({
      y: -30,
      lane,
    });
  }, []);

  // Draw 2D top-down car (wireframe style)
  const drawCar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, isPlayer: boolean) => {
    const w = CAR_WIDTH;
    const h = CAR_HEIGHT;
    
    ctx.strokeStyle = COLOR_GREEN;
    ctx.lineWidth = isPlayer ? 2 : 1.5;
    
    // Main body outline
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.stroke();
    
    // Cabin (windshield area)
    if (isPlayer) {
      // Player car - windshield at top (front)
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 12);
      ctx.lineTo(x + 4, y + 25);
      ctx.lineTo(x + w - 4, y + 25);
      ctx.lineTo(x + w - 4, y + 12);
      ctx.closePath();
      ctx.stroke();
      
      // Hood lines
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 4);
      ctx.lineTo(x + w - 6, y + 4);
      ctx.stroke();
      
      // Headlights
      ctx.fillStyle = COLOR_GREEN;
      ctx.fillRect(x + 3, y - 2, 6, 3);
      ctx.fillRect(x + w - 9, y - 2, 6, 3);
    } else {
      // Enemy car - we see rear (windshield at bottom for us)
      ctx.beginPath();
      ctx.moveTo(x + 4, y + h - 25);
      ctx.lineTo(x + 4, y + h - 12);
      ctx.lineTo(x + w - 4, y + h - 12);
      ctx.lineTo(x + w - 4, y + h - 25);
      ctx.closePath();
      ctx.stroke();
      
      // Trunk line
      ctx.beginPath();
      ctx.moveTo(x + 6, y + h - 6);
      ctx.lineTo(x + w - 6, y + h - 6);
      ctx.stroke();
      
      // Taillights
      ctx.fillStyle = COLOR_GREEN;
      ctx.fillRect(x + 3, y + h - 2, 6, 3);
      ctx.fillRect(x + w - 9, y + h - 2, 6, 3);
    }
    
    // Wheels
    ctx.fillStyle = COLOR_GREEN_DIM;
    // Left wheels
    ctx.fillRect(x - 4, y + 6, 5, 12);
    ctx.fillRect(x - 4, y + h - 18, 5, 12);
    // Right wheels
    ctx.fillRect(x + w - 1, y + 6, 5, 12);
    ctx.fillRect(x + w - 1, y + h - 18, 5, 12);
    
    // Center line detail
    ctx.strokeStyle = COLOR_GREEN_DARK;
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + 8);
    ctx.lineTo(x + w/2, y + h - 8);
    ctx.stroke();
  }, []);

  // Draw fuel pickup
  const drawFuel = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) => {
    const pulse = Math.sin(frame * 0.15) * 2;
    
    ctx.strokeStyle = COLOR_GREEN;
    ctx.lineWidth = 2;
    
    // Fuel can outline
    ctx.beginPath();
    ctx.rect(x, y, 20, 25);
    ctx.stroke();
    
    // Handle
    ctx.beginPath();
    ctx.rect(x + 14, y - 5, 8, 8);
    ctx.stroke();
    
    // F label
    ctx.fillStyle = COLOR_GREEN;
    ctx.font = 'bold 14px monospace';
    ctx.fillText('F', x + 5, y + 18);
    
    // Glow effect
    ctx.strokeStyle = `rgba(0, 255, 0, ${0.3 + Math.sin(frame * 0.15) * 0.2})`;
    ctx.lineWidth = 2 + pulse;
    ctx.strokeRect(x - 2, y - 2, 24, 29);
  }, []);

  const checkCollision = useCallback((x1: number, y1: number, w1: number, h1: number,
                                       x2: number, y2: number, w2: number, h2: number) => {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = playerRef.current;
    const enemyCars = enemyCarsRef.current;
    const fuelPickups = fuelPickupsRef.current;
    const roadLines = roadLinesRef.current;
    const keys = keysRef.current;
    const frame = frameCountRef.current;

    // Handle input
    if (keys.has('ArrowLeft') || keys.has('KeyA')) {
      if (player.lane > 0) {
        player.lane--;
        player.x = getLaneX(player.lane);
        keys.delete('ArrowLeft');
        keys.delete('KeyA');
      }
    }
    if (keys.has('ArrowRight') || keys.has('KeyD')) {
      if (player.lane < LANE_COUNT - 1) {
        player.lane++;
        player.x = getLaneX(player.lane);
        keys.delete('ArrowRight');
        keys.delete('KeyD');
      }
    }

    // Decrease fuel over time
    fuelRef.current -= 0.05;
    setFuel(Math.max(0, Math.floor(fuelRef.current)));

    if (fuelRef.current <= 0) {
      setGameState('gameover');
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
      }
      const sound = getSoundController();
      sound.playError();
      return;
    }

    // Increase speed over time
    if (frame % 500 === 0 && frame > 0) {
      speedRef.current = Math.min(speedRef.current + 0.5, 12);
    }

    // Clear canvas
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw road background
    ctx.fillStyle = '#111';
    ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, GAME_HEIGHT);

    // Draw road edges
    ctx.strokeStyle = COLOR_GREEN;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ROAD_LEFT, 0);
    ctx.lineTo(ROAD_LEFT, GAME_HEIGHT);
    ctx.moveTo(ROAD_LEFT + ROAD_WIDTH, 0);
    ctx.lineTo(ROAD_LEFT + ROAD_WIDTH, GAME_HEIGHT);
    ctx.stroke();

    // Draw and update road lines (dashed center lines)
    ctx.strokeStyle = COLOR_GREEN_DARK;
    ctx.lineWidth = 2;
    
    for (const line of roadLines) {
      line.y += speedRef.current;
      if (line.y > GAME_HEIGHT + 20) {
        line.y = -40;
      }
      
      // Draw lane dividers
      for (let i = 1; i < LANE_COUNT; i++) {
        const laneX = ROAD_LEFT + i * LANE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(laneX, line.y);
        ctx.lineTo(laneX, line.y + 25);
        ctx.stroke();
      }
    }

    // Spawn enemies
    spawnTimerRef.current++;
    const spawnRate = Math.max(30, 60 - speedRef.current * 3);
    if (spawnTimerRef.current > spawnRate) {
      spawnEnemyCar();
      spawnTimerRef.current = 0;
      
      // Occasionally spawn fuel
      if (Math.random() < 0.2) {
        spawnFuel();
      }
    }

    // Update and draw enemy cars
    for (let i = enemyCars.length - 1; i >= 0; i--) {
      const enemy = enemyCars[i];
      enemy.y += speedRef.current - enemy.speed;

      if (enemy.y > GAME_HEIGHT + 50) {
        enemyCars.splice(i, 1);
        scoreRef.current += 10;
        setScore(scoreRef.current);
        continue;
      }

      const enemyX = getLaneX(enemy.lane);
      
      // Check collision with player
      if (checkCollision(
        player.x, player.y, CAR_WIDTH, CAR_HEIGHT,
        enemyX, enemy.y, CAR_WIDTH, CAR_HEIGHT
      )) {
        setGameState('gameover');
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
        }
        const sound = getSoundController();
        sound.playError();
        return;
      }

      drawCar(ctx, enemyX, enemy.y, false);
    }

    // Update and draw fuel pickups
    for (let i = fuelPickups.length - 1; i >= 0; i--) {
      const fuelItem = fuelPickups[i];
      fuelItem.y += speedRef.current;

      if (fuelItem.y > GAME_HEIGHT + 50) {
        fuelPickups.splice(i, 1);
        continue;
      }

      const fuelX = getLaneX(fuelItem.lane) + CAR_WIDTH / 2 - 10;
      
      // Check collision with player
      if (checkCollision(
        player.x, player.y, CAR_WIDTH, CAR_HEIGHT,
        fuelX, fuelItem.y, 20, 25
      )) {
        fuelPickups.splice(i, 1);
        fuelRef.current = Math.min(fuelRef.current + 25, 100);
        setFuel(Math.floor(fuelRef.current));
        scoreRef.current += 50;
        setScore(scoreRef.current);
        const sound = getSoundController();
        sound.playClick();
        continue;
      }

      drawFuel(ctx, fuelX, fuelItem.y, frame);
    }

    // Draw player car
    drawCar(ctx, player.x, player.y, true);

    // Draw scanline effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let i = 0; i < GAME_HEIGHT; i += 3) {
      ctx.fillRect(0, i, GAME_WIDTH, 1);
    }

    // Draw UI
    ctx.fillStyle = COLOR_GREEN;
    ctx.font = '12px monospace';
    ctx.fillText(`SCORE: ${scoreRef.current}`, 8, 20);
    ctx.fillText(`SPEED: ${Math.floor(speedRef.current * 15)} KPH`, 8, 36);

    // Fuel gauge
    ctx.fillText('FUEL:', GAME_WIDTH - 95, 20);
    ctx.strokeStyle = COLOR_GREEN;
    ctx.strokeRect(GAME_WIDTH - 95, 25, 85, 12);
    
    const fuelPct = fuelRef.current / 100;
    const fuelColor = fuelRef.current > 30 ? COLOR_GREEN : fuelRef.current > 15 ? COLOR_GREEN_DIM : COLOR_GREEN_DARK;
    ctx.fillStyle = fuelColor;
    ctx.fillRect(GAME_WIDTH - 93, 27, fuelPct * 81, 8);

    // Score over time
    if (frame % 10 === 0) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }

    frameCountRef.current++;
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [checkCollision, drawCar, drawFuel, highScore, spawnEnemyCar, spawnFuel]);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
    const sound = getSoundController();
    sound.playClick();
  }, [resetGame]);

  // Game loop control
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        keysRef.current.add(e.code);
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      } else if (gameState === 'menu' || gameState === 'gameover') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          startGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      height: '100%',
      backgroundColor: COLOR_BG,
    }}>
      <div style={{
        color: COLOR_GREEN,
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '0 0 10px #00ff00',
      }}>
        ▓▓ RETRO RACER ▓▓
      </div>

      <div style={{
        border: `2px solid ${COLOR_GREEN}`,
        boxShadow: `0 0 15px ${COLOR_GREEN_DARK}`,
        position: 'relative',
      }}>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{
            display: 'block',
          }}
        />

        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: COLOR_GREEN,
          }}>
            <div style={{ fontSize: '20px', marginBottom: '10px', textShadow: '0 0 10px #00ff00' }}>
              ╔═══════════════╗
            </div>
            <div style={{ fontSize: '18px', marginBottom: '10px', textShadow: '0 0 10px #00ff00' }}>
              RETRO RACER
            </div>
            <div style={{ fontSize: '20px', marginBottom: '15px', textShadow: '0 0 10px #00ff00' }}>
              ╚═══════════════╝
            </div>
            <div style={{ fontSize: '11px', marginBottom: '10px', color: COLOR_GREEN_DIM }}>
              HIGH SCORE: {highScore}
            </div>
            <div style={{ fontSize: '12px', marginBottom: '6px' }}>
              [◄] [►] CHANGE LANES
            </div>
            <div style={{ fontSize: '11px', marginBottom: '6px', color: COLOR_GREEN_DIM }}>
              ► AVOID TRAFFIC
            </div>
            <div style={{ fontSize: '11px', marginBottom: '20px', color: COLOR_GREEN_DIM }}>
              ► COLLECT FUEL [F]
            </div>
            <button
              onClick={startGame}
              style={{
                padding: '8px 25px',
                backgroundColor: 'transparent',
                border: `2px solid ${COLOR_GREEN}`,
                color: COLOR_GREEN,
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textShadow: '0 0 5px #00ff00',
                boxShadow: `0 0 10px ${COLOR_GREEN_DARK}`,
              }}
            >
              [ START RACE ]
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: COLOR_GREEN,
          }}>
            <div style={{ fontSize: '18px', marginBottom: '15px', textShadow: '0 0 10px #00ff00' }}>
              {fuel <= 0 ? '>>> OUT OF FUEL <<<' : '>>> CRASH! <<<'}
            </div>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>
              SCORE: {score}
            </div>
            <div style={{ fontSize: '12px', color: COLOR_GREEN_DIM, marginBottom: '20px' }}>
              HIGH SCORE: {highScore}
            </div>
            <button
              onClick={startGame}
              style={{
                padding: '8px 25px',
                backgroundColor: 'transparent',
                border: `2px solid ${COLOR_GREEN}`,
                color: COLOR_GREEN,
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textShadow: '0 0 5px #00ff00',
                boxShadow: `0 0 10px ${COLOR_GREEN_DARK}`,
              }}
            >
              [ RACE AGAIN ]
            </button>
          </div>
        )}
      </div>

      <div style={{
        color: COLOR_GREEN_DIM,
        fontSize: '10px',
        textAlign: 'center',
      }}>
        ═══ SURVIVE THE HIGHWAY ═══
      </div>
    </div>
  );
}
