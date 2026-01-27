/**
 * TYPEWRITER ENGINE
 * Character-by-character text rendering with configurable speed.
 * Emulates old terminal output behavior.
 */

export interface TypewriterConfig {
  baseDelay: number;      // Base delay between characters (ms)
  variance: number;       // Random variance for natural feel (ms)
  punctuationDelay: number; // Extra delay after punctuation
}

export const DEFAULT_CONFIG: TypewriterConfig = {
  baseDelay: 30,
  variance: 15,
  punctuationDelay: 100,
};

const PUNCTUATION = ['.', ',', '!', '?', ':', ';', '-'];

export function getCharacterDelay(char: string, config: TypewriterConfig): number {
  const variance = Math.random() * config.variance * 2 - config.variance;
  let delay = config.baseDelay + variance;

  if (PUNCTUATION.includes(char)) {
    delay += config.punctuationDelay;
  }

  return Math.max(10, delay);
}

export type TypewriterCallback = (
  currentText: string,
  isComplete: boolean,
  charIndex: number
) => void;

export class TypewriterEngine {
  private config: TypewriterConfig;
  private isRunning: boolean = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<TypewriterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async type(
    text: string,
    onUpdate: TypewriterCallback,
    onCharacter?: (char: string) => void
  ): Promise<void> {
    this.stop();
    this.isRunning = true;

    for (let i = 0; i <= text.length; i++) {
      if (!this.isRunning) break;

      const currentText = text.substring(0, i);
      const isComplete = i === text.length;

      onUpdate(currentText, isComplete, i);

      if (i < text.length && onCharacter) {
        onCharacter(text[i]);
      }

      if (!isComplete) {
        const delay = getCharacterDelay(text[i], this.config);
        await this.wait(delay);
      }
    }

    this.isRunning = false;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.timeoutId = setTimeout(resolve, ms);
    });
  }

  stop(): void {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isTyping(): boolean {
    return this.isRunning;
  }
}
