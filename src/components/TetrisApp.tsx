'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSoundController } from '@/lib/sound';

/**
 * TETRIS APP
 * Classic Tetris game with retro terminal styling.
 */

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TICK_SPEED = 500;

// Tetromino shapes
const TETROMINOES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#00ffff',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#ffff00',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: '#ff00ff',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: '#00ff00',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: '#ff0000',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: '#0000ff',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: '#ff8800',
  },
};

type TetrominoType = keyof typeof TETROMINOES;

interface Piece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

function createEmptyBoard(): (string | null)[][] {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null));
}

function getRandomTetromino(): TetrominoType {
  const types = Object.keys(TETROMINOES) as TetrominoType[];
  return types[Math.floor(Math.random() * types.length)];
}

function createPiece(type: TetrominoType): Piece {
  const tetromino = TETROMINOES[type];
  return {
    type,
    shape: tetromino.shape.map((row) => [...row]),
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
    y: 0,
    color: tetromino.color,
  };
}

function rotateMatrix(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = [];
  for (let i = 0; i < cols; i++) {
    rotated[i] = [];
    for (let j = rows - 1; j >= 0; j--) {
      rotated[i].push(matrix[j][i]);
    }
  }
  return rotated;
}

export default function TetrisApp() {
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType>(getRandomTetromino);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const gameRef = useRef<HTMLDivElement>(null);

  const checkCollision = useCallback(
    (piece: Piece, boardState: (string | null)[][]): boolean => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = piece.x + x;
            const newY = piece.y + y;
            if (
              newX < 0 ||
              newX >= BOARD_WIDTH ||
              newY >= BOARD_HEIGHT ||
              (newY >= 0 && boardState[newY][newX])
            ) {
              return true;
            }
          }
        }
      }
      return false;
    },
    []
  );

  const mergePiece = useCallback(
    (piece: Piece, boardState: (string | null)[][]): (string | null)[][] => {
      const newBoard = boardState.map((row) => [...row]);
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x] && piece.y + y >= 0) {
            newBoard[piece.y + y][piece.x + x] = piece.color;
          }
        }
      }
      return newBoard;
    },
    []
  );

  const clearLines = useCallback(
    (boardState: (string | null)[][]): { newBoard: (string | null)[][]; cleared: number } => {
      const newBoard = boardState.filter((row) => row.some((cell) => !cell));
      const cleared = BOARD_HEIGHT - newBoard.length;
      while (newBoard.length < BOARD_HEIGHT) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
      }
      return { newBoard, cleared };
    },
    []
  );

  const startGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPiece(createPiece(getRandomTetromino()));
    setNextPiece(getRandomTetromino());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setIsStarted(true);
    getSoundController().playStartup();
    gameRef.current?.focus();
  }, []);

  const movePiece = useCallback(
    (dx: number, dy: number) => {
      if (!currentPiece || gameOver || isPaused) return;

      const newPiece = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy };

      if (!checkCollision(newPiece, board)) {
        setCurrentPiece(newPiece);
        return true;
      }
      return false;
    },
    [currentPiece, board, checkCollision, gameOver, isPaused]
  );

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    const rotatedShape = rotateMatrix(currentPiece.shape);
    const newPiece = { ...currentPiece, shape: rotatedShape };

    // Try rotation, then wall kicks
    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece);
      getSoundController().playUserKeyClick();
    } else {
      // Wall kick attempts
      for (const offset of [-1, 1, -2, 2]) {
        const kickedPiece = { ...newPiece, x: newPiece.x + offset };
        if (!checkCollision(kickedPiece, board)) {
          setCurrentPiece(kickedPiece);
          getSoundController().playUserKeyClick();
          return;
        }
      }
    }
  }, [currentPiece, board, checkCollision, gameOver, isPaused]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    let newPiece = { ...currentPiece };
    while (!checkCollision({ ...newPiece, y: newPiece.y + 1 }, board)) {
      newPiece.y++;
    }
    setCurrentPiece(newPiece);
    getSoundController().playAIKeyClick();
  }, [currentPiece, board, checkCollision, gameOver, isPaused]);

  // Game tick
  useEffect(() => {
    if (!isStarted || gameOver || isPaused || !currentPiece) return;

    const speed = Math.max(100, TICK_SPEED - (level - 1) * 50);

    const tick = setInterval(() => {
      const newPiece = { ...currentPiece, y: currentPiece.y + 1 };

      if (!checkCollision(newPiece, board)) {
        setCurrentPiece(newPiece);
      } else {
        // Lock piece
        const mergedBoard = mergePiece(currentPiece, board);
        const { newBoard, cleared } = clearLines(mergedBoard);

        if (cleared > 0) {
          getSoundController().playStartup();
          const points = [0, 100, 300, 500, 800][cleared] * level;
          setScore((s) => s + points);
          setLines((l) => {
            const newLines = l + cleared;
            setLevel(Math.floor(newLines / 10) + 1);
            return newLines;
          });
        }

        setBoard(newBoard);

        // Spawn new piece
        const newType = nextPiece;
        const spawned = createPiece(newType);

        if (checkCollision(spawned, newBoard)) {
          setGameOver(true);
          getSoundController().playError();
        } else {
          setCurrentPiece(spawned);
          setNextPiece(getRandomTetromino());
        }
      }
    }, speed);

    return () => clearInterval(tick);
  }, [isStarted, gameOver, isPaused, currentPiece, board, level, nextPiece, checkCollision, mergePiece, clearLines]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStarted) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPaused((p) => !p);
          break;
        case 'Escape':
          e.preventDefault();
          setIsPaused((p) => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, movePiece, rotatePiece, hardDrop]);

  // Render the board with current piece
  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row]);

    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  // Render next piece preview
  const renderNextPiece = () => {
    const shape = TETROMINOES[nextPiece].shape;
    const color = TETROMINOES[nextPiece].color;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {shape.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {row.map((cell, x) => (
              <div
                key={x}
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: cell ? color : 'transparent',
                  border: cell ? '1px solid rgba(255,255,255,0.3)' : 'none',
                  boxShadow: cell ? `0 0 4px ${color}` : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={gameRef}
      tabIndex={0}
      style={{
        height: '100%',
        display: 'flex',
        backgroundColor: '#0a0a0a',
        outline: 'none',
        padding: '12px',
        gap: '12px',
      }}
    >
      {/* GAME BOARD */}
      <div
        className="pixel-border"
        style={{
          padding: '4px',
          backgroundColor: '#000000',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, 16px)`,
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, 16px)`,
            gap: '1px',
            backgroundColor: '#111111',
          }}
        >
          {renderBoard().map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: cell || '#0a0a0a',
                  border: cell ? '1px solid rgba(255,255,255,0.2)' : '1px solid #1a1a1a',
                  boxShadow: cell ? `inset 0 0 4px rgba(255,255,255,0.3), 0 0 2px ${cell}` : 'none',
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* SIDE PANEL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '120px' }}>
        {/* NEXT PIECE */}
        <div
          className="pixel-border"
          style={{
            padding: '8px',
            backgroundColor: '#0d0d0d',
          }}
        >
          <div style={{ color: '#666666', fontSize: '10px', marginBottom: '8px' }}>NEXT</div>
          <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isStarted && renderNextPiece()}
          </div>
        </div>

        {/* SCORE */}
        <div
          className="pixel-border"
          style={{
            padding: '8px',
            backgroundColor: '#0d0d0d',
          }}
        >
          <div style={{ color: '#666666', fontSize: '10px' }}>SCORE</div>
          <div style={{ color: 'var(--terminal-green)', fontSize: '16px' }}>{score}</div>
        </div>

        {/* LINES */}
        <div
          className="pixel-border"
          style={{
            padding: '8px',
            backgroundColor: '#0d0d0d',
          }}
        >
          <div style={{ color: '#666666', fontSize: '10px' }}>LINES</div>
          <div style={{ color: 'var(--terminal-amber)', fontSize: '16px' }}>{lines}</div>
        </div>

        {/* LEVEL */}
        <div
          className="pixel-border"
          style={{
            padding: '8px',
            backgroundColor: '#0d0d0d',
          }}
        >
          <div style={{ color: '#666666', fontSize: '10px' }}>LEVEL</div>
          <div style={{ color: '#ff6666', fontSize: '16px' }}>{level}</div>
        </div>

        {/* CONTROLS */}
        <div
          className="pixel-border"
          style={{
            padding: '8px',
            backgroundColor: '#0d0d0d',
            fontSize: '9px',
          }}
        >
          <div style={{ color: '#666666', marginBottom: '4px' }}>CONTROLS</div>
          <div>←→ MOVE</div>
          <div>↑ ROTATE</div>
          <div>↓ SOFT DROP</div>
          <div>SPACE HARD</div>
          <div>P PAUSE</div>
        </div>

        {/* START/RESTART BUTTON */}
        <button
          onClick={startGame}
          className="pixel-border"
          style={{
            padding: '8px',
            backgroundColor: gameOver ? '#3a1a1a' : '#1a3a1a',
            color: gameOver ? '#ff6666' : 'var(--terminal-green)',
            cursor: 'pointer',
            fontSize: '12px',
            border: `2px solid ${gameOver ? '#ff3333' : 'var(--terminal-green)'}`,
          }}
        >
          {!isStarted ? '[ START ]' : gameOver ? '[ RETRY ]' : '[ RESET ]'}
        </button>
      </div>

      {/* OVERLAYS */}
      {gameOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '24px',
            border: '2px solid #ff3333',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div style={{ color: '#ff3333', fontSize: '20px', marginBottom: '8px' }}>GAME OVER</div>
          <div style={{ color: 'var(--terminal-green)' }}>SCORE: {score}</div>
          <div style={{ color: '#666666', fontSize: '12px', marginTop: '8px' }}>PRESS START TO RETRY</div>
        </div>
      )}

      {isPaused && !gameOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '24px',
            border: '2px solid var(--terminal-amber)',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div style={{ color: 'var(--terminal-amber)', fontSize: '20px' }}>PAUSED</div>
          <div style={{ color: '#666666', fontSize: '12px', marginTop: '8px' }}>PRESS P TO RESUME</div>
        </div>
      )}

      {!isStarted && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '24px',
            border: '2px solid var(--terminal-green)',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div style={{ color: 'var(--terminal-green)', fontSize: '20px', marginBottom: '8px' }}>TETRIS</div>
          <div style={{ color: '#666666', fontSize: '12px' }}>NIKATA-OS v1.0</div>
          <div style={{ color: 'var(--terminal-amber)', fontSize: '14px', marginTop: '12px' }}>
            PRESS START
          </div>
        </div>
      )}
    </div>
  );
}
