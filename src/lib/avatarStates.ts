/**
 * AVATAR STATE MACHINE
 * Defines pixel-art avatar expressions based on chat lifecycle.
 * All sprites are 32x32 pixel art rendered as CSS.
 */

export type AvatarState = 'idle' | 'thinking' | 'responding' | 'error';

export interface AvatarExpression {
  state: AvatarState;
  label: string;
  pixels: string; // ASCII representation for pixel rendering
}

// 8x8 simplified pixel art patterns (scaled up in CSS)
export const AVATAR_EXPRESSIONS: Record<AvatarState, AvatarExpression> = {
  idle: {
    state: 'idle',
    label: 'STANDBY',
    pixels: `
........
.######.
#......#
#.#..#.#
#......#
#.####.#
#......#
.######.
    `.trim()
  },
  thinking: {
    state: 'thinking',
    label: 'PROCESSING',
    pixels: `
........
.######.
#......#
#.#..#.#
#......#
#..##..#
#......#
.######.
    `.trim()
  },
  responding: {
    state: 'responding',
    label: 'TRANSMITTING',
    pixels: `
........
.######.
#......#
#.#..#.#
#......#
#.#..#.#
#......#
.######.
    `.trim()
  },
  error: {
    state: 'error',
    label: 'ERROR',
    pixels: `
........
.######.
#......#
#.##.#.#
#.#..#.#
#......#
#.####.#
.######.
    `.trim()
  }
};

export function getAvatarExpression(state: AvatarState): AvatarExpression {
  return AVATAR_EXPRESSIONS[state];
}
