'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSoundController } from '@/lib/sound';

/**
 * STICK RUN APP
 * A Mario-style platformer with a stick man character.
 * Jump on platforms, collect coins, reach the flag!
 */

const GAME_WIDTH = 480;
const GAME_HEIGHT = 360;
const TILE_SIZE = 20;
const GRAVITY = 0.4;
const ACCEL = 0.4;
const MAX_SPEED = 4;
const FRICTION = 0.15;
const JUMP_FORCE = -6;
const MAX_JUMP_TIME = 10;
const CAMERA_OFFSET = 120;

interface Platform {
  x: number;
  y: number;
  width: number;
  type: 'stone' | 'brick' | 'grass';
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  alive: boolean;
}

interface Flag {
  x: number;
  y: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isJumping: boolean;
  jumpTime: number;
  facingRight: boolean;
  width: number;
  height: number;
  isMoving: boolean;
}

// Tile-based level map - much easier to design!
// Legend: # = ground, B = brick platform, C = coin, E = enemy, F = flag, . = empty
const LEVEL_MAP = [
  "........................................................................................................................................................................................................................................",
  "........................................................................................................................................................................................................................................",
  ".......C..............C..............C..............C..............C..............C..............C..............C..............C..............C..............C.................................................................",
  ".......BB.............BB.............BB.............BB.............BB.............BB.............BB.............BB.............BB.............BB.............BB................................................................",
  "...............C..............C..............C..............C..............C..............C..............C..............C..............C..............C........................................................................",
  "...............###............###............###............###............###............###............###............###............###............###.......................................................................",
  "....................................................................................................................................................................................................................................F",
  ".....C..............C..............C..............C..............C..............C..............C..............C..............C..............C..............C..................................................................",
  "....BBB............BBB............BBB............BBB............BBB............BBB............BBB............BBB............BBB............BBB............BBB..................................................................",
  "...........................................E...........................................E...........................................E...........................................E...........................................",
  "##########.....##########.....##########.....##########.....##########.....##########.....##########.....##########.....##########.....##########.....##########.....##########.....##########.....##########.....###########",
];

const WORLD_WIDTH = LEVEL_MAP[0].length * TILE_SIZE;
const GROUND_Y = (LEVEL_MAP.length - 1) * TILE_SIZE;

// Parse level map into game objects
const createLevel = (): { platforms: Platform[]; coins: Coin[]; enemies: Enemy[]; flag: Flag } => {
  const platforms: Platform[] = [];
  const coins: Coin[] = [];
  const enemies: Enemy[] = [];
  let flag: Flag = { x: WORLD_WIDTH - 100, y: GROUND_Y - 60 };

  LEVEL_MAP.forEach((row, y) => {
    let platformStart = -1;
    let platformType: 'stone' | 'brick' | 'grass' = 'stone';

    [...row].forEach((tile, x) => {
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (tile === '#' || tile === 'B') {
        // Start or continue platform
        if (platformStart === -1) {
          platformStart = px;
          platformType = tile === 'B' ? 'brick' : 'stone';
        }
      } else {
        // End platform if we were building one
        if (platformStart !== -1) {
          platforms.push({
            x: platformStart,
            y: y * TILE_SIZE,
            width: px - platformStart,
            type: platformType,
          });
          platformStart = -1;
        }

        if (tile === 'C') {
          coins.push({ x: px, y: py, collected: false });
        } else if (tile === 'E') {
          enemies.push({
            x: px,
            y: py,
            vx: -1.5,
            width: 20,
            height: 20,
            alive: true,
          });
        } else if (tile === 'F') {
          flag = { x: px, y: py - 60 };
        }
      }
    });

    // End platform at row end
    if (platformStart !== -1) {
      platforms.push({
        x: platformStart,
        y: y * TILE_SIZE,
        width: WORLD_WIDTH - platformStart,
        type: platformType,
      });
    }
  });

  return { platforms, coins, enemies, flag };
};

export default function StickRunApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'win' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);

  const gameLoopRef = useRef<number | undefined>(undefined);
  const playerRef = useRef<Player>({
    x: 50,
    y: GROUND_Y - 30,
    vx: 0,
    vy: 0,
    isJumping: false,
    jumpTime: 0,
    facingRight: true,
    width: 16,
    height: 30,
    isMoving: false,
  });
  const platformsRef = useRef<Platform[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const flagRef = useRef<Flag>({ x: WORLD_WIDTH - 100, y: GROUND_Y - 60 });
  const cameraXRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const checkpointXRef = useRef(50);
  const livesRef = useRef(3);

  const resetGame = useCallback(() => {
    const levelData = createLevel();
    playerRef.current = {
      x: 50,
      y: GROUND_Y - 30,
      vx: 0,
      vy: 0,
      isJumping: false,
      jumpTime: 0,
      facingRight: true,
      width: 16,
      height: 30,
      isMoving: false,
    };
    platformsRef.current = levelData.platforms;
    coinsRef.current = levelData.coins.map(c => ({ ...c }));
    enemiesRef.current = levelData.enemies.map(e => ({ ...e }));
    flagRef.current = levelData.flag;
    cameraXRef.current = 0;
    frameCountRef.current = 0;
    scoreRef.current = 0;
    checkpointXRef.current = 50;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
  }, []);

  const respawnPlayer = useCallback(() => {
    playerRef.current.x = checkpointXRef.current;
    playerRef.current.y = GROUND_Y - 30;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.isJumping = false;
    playerRef.current.jumpTime = 0;
  }, []);

  const checkPlatformCollision = useCallback((player: Player, platform: Platform): boolean => {
    const playerBottom = player.y + player.height;
    const playerRight = player.x + player.width;
    const platformTop = platform.y;
    const platformRight = platform.x + platform.width;

    return (
      playerRight > platform.x &&
      player.x < platformRight &&
      playerBottom >= platformTop &&
      playerBottom <= platformTop + 15 &&
      player.vy >= 0
    );
  }, []);

  const checkCoinCollision = useCallback((player: Player, coin: Coin): boolean => {
    const coinSize = 12;
    return (
      player.x < coin.x + coinSize &&
      player.x + player.width > coin.x &&
      player.y < coin.y + coinSize &&
      player.y + player.height > coin.y
    );
  }, []);

  const checkFlagCollision = useCallback((player: Player, flag: Flag): boolean => {
    return (
      player.x + player.width > flag.x &&
      player.x < flag.x + 20 &&
      player.y + player.height > flag.y &&
      player.y < flag.y + 60
    );
  }, []);

  const checkEnemyCollision = useCallback((player: Player, enemy: Enemy): 'stomp' | 'hit' | null => {
    if (!enemy.alive) return null;

    const playerBottom = player.y + player.height;
    const playerRight = player.x + player.width;
    const enemyTop = enemy.y;
    const enemyBottom = enemy.y + enemy.height;
    const enemyRight = enemy.x + enemy.width;

    // Check if overlapping
    if (playerRight > enemy.x && player.x < enemyRight &&
        playerBottom > enemyTop && player.y < enemyBottom) {
      // Stomping - player falling onto enemy from above
      if (player.vy > 0 && playerBottom - enemyTop < 15) {
        return 'stomp';
      }
      return 'hit';
    }
    return null;
  }, []);

  const drawStickMan = useCallback((ctx: CanvasRenderingContext2D, player: Player, frame: number, cameraX: number) => {
    const screenX = player.x - cameraX;
    const { y, facingRight, isJumping, isMoving, vx } = player;
    const runCycle = Math.floor(frame / 5) % 4;
    const dir = facingRight ? 1 : -1;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const cx = screenX + 8;

    // Head (smaller)
    ctx.beginPath();
    ctx.arc(cx, y + 5, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes (direction indicator)
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(cx + dir * 2, y + 4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(cx, y + 10);
    ctx.lineTo(cx, y + 20);
    ctx.stroke();

    if (isJumping) {
      // Jumping pose - arms up, legs spread
      ctx.beginPath();
      ctx.moveTo(cx, y + 13);
      ctx.lineTo(cx - 6, y + 9);
      ctx.moveTo(cx, y + 13);
      ctx.lineTo(cx + 6, y + 9);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, y + 20);
      ctx.lineTo(cx - 5, y + 28);
      ctx.moveTo(cx, y + 20);
      ctx.lineTo(cx + 5, y + 28);
      ctx.stroke();
    } else if (isMoving && Math.abs(vx) > 0) {
      // Running animation
      const legOffset = Math.sin(runCycle * Math.PI / 2) * 6;
      const armOffset = Math.sin(runCycle * Math.PI / 2) * 4;

      // Arms
      ctx.beginPath();
      ctx.moveTo(cx, y + 13);
      ctx.lineTo(cx - armOffset * dir, y + 19);
      ctx.moveTo(cx, y + 13);
      ctx.lineTo(cx + armOffset * dir, y + 19);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(cx, y + 20);
      ctx.lineTo(cx + legOffset * dir, y + 30);
      ctx.moveTo(cx, y + 20);
      ctx.lineTo(cx - legOffset * dir, y + 30);
      ctx.stroke();
    } else {
      // Standing still
      ctx.beginPath();
      ctx.moveTo(cx, y + 13);
      ctx.lineTo(cx - 4, y + 19);
      ctx.moveTo(cx, y + 13);
      ctx.lineTo(cx + 4, y + 19);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, y + 20);
      ctx.lineTo(cx - 3, y + 30);
      ctx.moveTo(cx, y + 20);
      ctx.lineTo(cx + 3, y + 30);
      ctx.stroke();
    }
  }, []);

  const drawPlatform = useCallback((ctx: CanvasRenderingContext2D, platform: Platform, cameraX: number) => {
    const screenX = platform.x - cameraX;
    if (screenX > GAME_WIDTH + 50 || screenX + platform.width < -50) return;

    const colors = {
      stone: { fill: '#444444', stroke: '#666666' },
      brick: { fill: '#884422', stroke: '#aa6644' },
      grass: { fill: '#226622', stroke: '#44aa44' },
    };

    const color = colors[platform.type];

    // Platform body
    ctx.fillStyle = color.fill;
    ctx.strokeStyle = color.stroke;
    ctx.lineWidth = 2;
    ctx.fillRect(screenX, platform.y, platform.width, 20);
    ctx.strokeRect(screenX, platform.y, platform.width, 20);

    // Top grass/detail line
    ctx.strokeStyle = color.stroke;
    ctx.beginPath();
    ctx.moveTo(screenX, platform.y + 5);
    ctx.lineTo(screenX + platform.width, platform.y + 5);
    ctx.stroke();

    // Brick/stone pattern
    if (platform.type === 'brick' || platform.type === 'stone') {
      ctx.strokeStyle = color.stroke;
      for (let i = 10; i < platform.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(screenX + i, platform.y + 5);
        ctx.lineTo(screenX + i, platform.y + 20);
        ctx.stroke();
      }
    }
  }, []);

  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, coin: Coin, frame: number, cameraX: number) => {
    if (coin.collected) return;

    const screenX = coin.x - cameraX;
    if (screenX > GAME_WIDTH + 20 || screenX < -20) return;

    const pulse = Math.sin(frame * 0.15) * 2;

    ctx.strokeStyle = '#ffff00';
    ctx.fillStyle = '#ffaa00';
    ctx.lineWidth = 2;

    // Outer circle
    ctx.beginPath();
    ctx.arc(screenX + 6, coin.y + 6, 8 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(screenX + 6, coin.y + 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawFlag = useCallback((ctx: CanvasRenderingContext2D, flag: Flag, frame: number, cameraX: number) => {
    const screenX = flag.x - cameraX;
    if (screenX > GAME_WIDTH + 30 || screenX < -30) return;

    // Pole
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX, flag.y);
    ctx.lineTo(screenX, flag.y + 80);
    ctx.stroke();

    // Flag waving
    const wave = Math.sin(frame * 0.1) * 3;
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#00aa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, flag.y);
    ctx.lineTo(screenX + 30 + wave, flag.y + 10);
    ctx.lineTo(screenX + 25 + wave, flag.y + 20);
    ctx.lineTo(screenX, flag.y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Star on flag
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(screenX + 15 + wave / 2, flag.y + 10, 3, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy, frame: number, cameraX: number) => {
    if (!enemy.alive) return;

    const screenX = enemy.x - cameraX;
    if (screenX > GAME_WIDTH + 30 || screenX < -30) return;

    const bounce = Math.sin(frame * 0.2) * 2;

    // Enemy body (simple goomba-like blob)
    ctx.fillStyle = '#aa4444';
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth = 2;

    // Body
    ctx.beginPath();
    ctx.ellipse(screenX + 10, enemy.y + 12 + bounce, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Feet
    ctx.fillStyle = '#663333';
    const footOffset = Math.sin(frame * 0.3) * 3;
    ctx.beginPath();
    ctx.ellipse(screenX + 5 + footOffset, enemy.y + 18, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(screenX + 15 - footOffset, enemy.y + 18, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(screenX + 6, enemy.y + 10 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenX + 14, enemy.y + 10 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000000';
    const pupilDir = enemy.vx > 0 ? 1 : -1;
    ctx.beginPath();
    ctx.arc(screenX + 6 + pupilDir, enemy.y + 10 + bounce, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenX + 14 + pupilDir, enemy.y + 10 + bounce, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = playerRef.current;
    const platforms = platformsRef.current;
    const coins = coinsRef.current;
    const enemies = enemiesRef.current;
    const flag = flagRef.current;
    const keys = keysRef.current;
    const frame = frameCountRef.current;

    // Mario-style physics - acceleration based movement
    player.isMoving = false;

    if (keys.has('ArrowLeft') || keys.has('KeyA')) {
      player.vx -= ACCEL;
      player.facingRight = false;
      player.isMoving = true;
    }
    if (keys.has('ArrowRight') || keys.has('KeyD')) {
      player.vx += ACCEL;
      player.facingRight = true;
      player.isMoving = true;
    }

    // Clamp horizontal speed
    player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vx));

    // Apply friction when not pressing movement keys
    if (!keys.has('ArrowLeft') && !keys.has('KeyA') && 
        !keys.has('ArrowRight') && !keys.has('KeyD')) {
      player.vx *= (1 - FRICTION);
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    // Variable jump height - hold to jump higher!
    if ((keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW')) && player.jumpTime > 0) {
      player.vy -= 0.4;
      player.jumpTime--;
    }

    // Apply horizontal movement
    player.x += player.vx;

    // Apply gravity
    player.vy += GRAVITY;
    player.y += player.vy;

    // Platform collision
    let onGround = false;
    for (const platform of platforms) {
      if (checkPlatformCollision(player, platform)) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.isJumping = false;
        player.jumpTime = 0;
        onGround = true;
      }
    }

    // Keep player in bounds
    if (player.x < 0) {
      player.x = 0;
      player.vx = 0;
    }
    if (player.x > WORLD_WIDTH - player.width) {
      player.x = WORLD_WIDTH - player.width;
      player.vx = 0;
    }

    // Update checkpoint
    if (player.x > checkpointXRef.current + 300) {
      checkpointXRef.current = player.x - 50;
    }

    // Update camera to follow player (clamped to world bounds)
    const targetCameraX = player.x - CAMERA_OFFSET;
    cameraXRef.current = Math.max(0, Math.min(targetCameraX, WORLD_WIDTH - GAME_WIDTH));

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw background stars (parallax)
    ctx.fillStyle = '#333333';
    for (let i = 0; i < 30; i++) {
      const starX = ((i * 47 - cameraXRef.current * 0.1) % (GAME_WIDTH + 100)) - 50;
      const starY = (i * 23) % (GAME_HEIGHT - 50);
      ctx.fillRect(starX, starY, 2, 2);
    }

    // Draw platforms
    for (const platform of platforms) {
      drawPlatform(ctx, platform, cameraXRef.current);
    }

    // Update and draw enemies
    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      // Simple enemy AI - walk back and forth
      enemy.x += enemy.vx;

      // Check if enemy should turn around (hit platform edge or walked too far)
      let enemyOnPlatform = false;
      for (const platform of platforms) {
        if (enemy.x >= platform.x && enemy.x + enemy.width <= platform.x + platform.width &&
            Math.abs((enemy.y + enemy.height) - platform.y) < 5) {
          enemyOnPlatform = true;
          // Turn around at platform edges
          if (enemy.x <= platform.x + 5 || enemy.x + enemy.width >= platform.x + platform.width - 5) {
            enemy.vx *= -1;
          }
          break;
        }
      }

      // Check collision with player
      const collision = checkEnemyCollision(player, enemy);
      if (collision === 'stomp') {
        // Stomped enemy!
        enemy.alive = false;
        player.vy = -6; // Bounce off
        scoreRef.current += 200;
        setScore(scoreRef.current);
        const sound = getSoundController();
        sound.playClick();
      } else if (collision === 'hit') {
        // Player got hit!
        livesRef.current--;
        setLives(livesRef.current);
        const sound = getSoundController();
        sound.playError();
        
        if (livesRef.current <= 0) {
          setGameState('gameover');
          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
          }
          return;
        } else {
          respawnPlayer();
        }
      }

      drawEnemy(ctx, enemy, frame, cameraXRef.current);
    }

    // Draw and check coins
    for (const coin of coins) {
      if (!coin.collected && checkCoinCollision(player, coin)) {
        coin.collected = true;
        scoreRef.current += 100;
        setScore(scoreRef.current);
        const sound = getSoundController();
        sound.playClick();
      }
      drawCoin(ctx, coin, frame, cameraXRef.current);
    }

    // Draw flag
    drawFlag(ctx, flag, frame, cameraXRef.current);

    // Check win condition
    if (checkFlagCollision(player, flag)) {
      setGameState('win');
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
      }
      const sound = getSoundController();
      sound.playClick();
      return;
    }

    // Draw player
    drawStickMan(ctx, player, frame, cameraXRef.current);

    // Fall death
    if (player.y > GAME_HEIGHT + 50) {
      livesRef.current--;
      setLives(livesRef.current);
      const sound = getSoundController();
      sound.playError();

      if (livesRef.current <= 0) {
        setGameState('gameover');
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
        }
        return;
      } else {
        respawnPlayer();
      }
    }

    // Draw UI
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`SCORE: ${scoreRef.current}`, 10, 20);
    ctx.fillText(`LIVES: ${'❤️'.repeat(livesRef.current)}`, 10, 35);
    ctx.fillText(`COINS: ${coins.filter(c => c.collected).length}/${coins.length}`, GAME_WIDTH - 90, 20);

    frameCountRef.current++;
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [checkCoinCollision, checkEnemyCollision, checkFlagCollision, checkPlatformCollision, drawCoin, drawEnemy, drawFlag, drawPlatform, drawStickMan, highScore, respawnPlayer]);

  const jump = useCallback(() => {
    const player = playerRef.current;
    if (!player.isJumping) {
      player.vy = JUMP_FORCE;
      player.jumpTime = MAX_JUMP_TIME;
      player.isJumping = true;
      const sound = getSoundController();
      sound.playClick();
    }
  }, []);

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

        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          jump();
        }
      } else if (gameState === 'menu' || gameState === 'gameover' || gameState === 'win') {
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
  }, [gameState, jump, startGame]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      height: '100%',
      backgroundColor: '#0a0a0a',
    }}>
      <div style={{
        color: 'var(--terminal-green)',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center',
      }}>
        STICK RUN v2.0
      </div>

      <div style={{
        border: '2px solid var(--terminal-green)',
        position: 'relative',
      }}>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{
            display: 'block',
            imageRendering: 'pixelated',
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
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'var(--terminal-green)',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '15px' }}>
              🏃 STICK RUN 🏃
            </div>
            <div style={{ fontSize: '12px', marginBottom: '15px', color: '#ffff00' }}>
              HIGH SCORE: {highScore}
            </div>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              [←] [→] to MOVE (momentum!)
            </div>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              [SPACE] or [↑] to JUMP (hold for height!)
            </div>
            <div style={{ fontSize: '11px', marginBottom: '8px', color: '#ff6666' }}>
              Stomp enemies • Avoid getting hit!
            </div>
            <div style={{ fontSize: '11px', marginBottom: '20px', color: '#aaaaaa' }}>
              Collect coins & reach the flag!
            </div>
            <button
              onClick={startGame}
              style={{
                padding: '10px 30px',
                backgroundColor: 'transparent',
                border: '2px solid var(--terminal-green)',
                color: 'var(--terminal-green)',
                fontSize: '16px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              START GAME
            </button>
          </div>
        )}

        {/* Win Overlay */}
        {gameState === 'win' && (
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
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#00ff00',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '15px' }}>
              🎉 YOU WIN! 🎉
            </div>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>
              SCORE: {score}
            </div>
            <div style={{ fontSize: '12px', color: '#ffff00', marginBottom: '20px' }}>
              HIGH SCORE: {highScore}
            </div>
            <button
              onClick={startGame}
              style={{
                padding: '10px 30px',
                backgroundColor: 'transparent',
                border: '2px solid var(--terminal-green)',
                color: 'var(--terminal-green)',
                fontSize: '16px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              PLAY AGAIN
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
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#ff0000',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '15px' }}>
              GAME OVER
            </div>
            <div style={{ fontSize: '14px', color: 'var(--terminal-green)', marginBottom: '5px' }}>
              SCORE: {score}
            </div>
            <div style={{ fontSize: '12px', color: '#ffff00', marginBottom: '5px' }}>
              HIGH SCORE: {highScore}
            </div>
            <div style={{ fontSize: '12px', color: '#aaaaaa', marginBottom: '20px' }}>
              You have checkpoints - try again!
            </div>
            <button
              onClick={startGame}
              style={{
                padding: '10px 30px',
                backgroundColor: 'transparent',
                border: '2px solid var(--terminal-green)',
                color: 'var(--terminal-green)',
                fontSize: '16px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      <div style={{
        color: 'var(--terminal-dim)',
        fontSize: '11px',
        textAlign: 'center',
      }}>
        JUMP ON PLATFORMS • COLLECT COINS • REACH THE FLAG!
      </div>
    </div>
  );
}
