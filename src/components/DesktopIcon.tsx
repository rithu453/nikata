'use client';

import { useMemo } from 'react';
import { getSoundController } from '@/lib/sound';

export type AppType = 'files' | 'ether' | 'nikata' | 'tetris' | 'tasks' | 'notes' | 'clock' | 'calc' | 'sticky' | 'cmd';

interface DesktopIconProps {
  app: AppType;
  label: string;
  onDoubleClick: () => void;
  isSelected: boolean;
  onSelect: () => void;
}

// 16x16 pixel art icons represented as strings
const ICONS: Record<AppType, string> = {
  files: `
................
..############..
..#..........#..
..#..####....#..
..#..........#..
..#..####....#..
..#..........#..
..#..####....#..
..#..........#..
..#..........#..
..############..
................
................
................
................
................
  `.trim(),
  ether: `
................
.....####.......
....#....#......
...#......#.....
..#..####..#....
..#.#....#.#....
..#.#....#.#....
..#..####..#....
...#......#.....
....#....#......
.....####.......
......##........
.......##.......
........##......
................
................
  `.trim(),
  nikata: `
................
....########....
...#........#...
..#..#....#..#..
..#..........#..
..#..######..#..
..#..........#..
..#..........#..
...#........#...
....########....
.......##.......
......####......
.....######.....
....##....##....
...##......##...
................
  `.trim(),
  tetris: `
................
..##..####..##..
..##..####..##..
......####......
......####......
..####....####..
..####....####..
..####....####..
..####....####..
......####......
......####......
..##..####..##..
..##..####..##..
................
................
................
  `.trim(),
  tasks: `
................
..############..
..#..........#..
..#.##.......#..
..#..........#..
..#.##.......#..
..#..........#..
..#.##.......#..
..#..........#..
..#..........#..
..############..
................
................
................
................
................
  `.trim(),
  notes: `
................
....########....
...#........#...
..#..####....#..
..#..........#..
..#..####....#..
..#..........#..
..#..####....#..
..#..........#..
..#..####....#..
..#..........#..
..############..
................
................
................
................
  `.trim(),
  clock: `
................
....########....
...#........#...
..#....##....#..
..#....##....#..
..#....##....#..
..#....#######..
..#..........#..
..#..........#..
...#........#...
....########....
................
................
................
................
................
  `.trim(),
  calc: `
................
..############..
..#..........#..
..#..######..#..
..#..........#..
..#.##.##.##.#..
..#.##.##.##.#..
..#..........#..
..#.##.##.##.#..
..#.##.##.##.#..
..#..........#..
..############..
................
................
................
................
  `.trim(),
  sticky: `
................
..##########....
..#........#....
..#........####.
..#...........#.
..#...........#.
..#...........#.
..#...........#.
..#...........#.
..#...........#.
..#...........#.
..#############.
................
................
................
................
  `.trim(),
  cmd: `
................
..############..
..#..........#..
..#.C:>......#..
..#..........#..
..#.DIR......#..
..#..........#..
..#.>_#......#..
..#..........#..
..#..........#..
..############..
................
................
................
................
................
  `.trim(),
};

export default function DesktopIcon({ app, label, onDoubleClick, isSelected, onSelect }: DesktopIconProps) {
  const sound = getSoundController();

  const pixelGrid = useMemo(() => {
    const lines = ICONS[app].split('\n');
    const colorMap: Record<AppType, string> = {
      files: '#ffcc00',
      ether: '#00ccff',
      tetris: '#ff00ff',
      nikata: '#33ff33',
      tasks: '#ff9933',
      notes: '#66ff66',
      clock: '#ffff33',
      calc: '#ff6699',
      sticky: '#ffff88',
      cmd: '#aaaaaa',
    };
    const color = colorMap[app] || '#33ff33';
    
    return lines.map((line, y) => (
      <div key={y} style={{ display: 'flex', justifyContent: 'center' }}>
        {line.split('').map((char, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: '3px',
              height: '3px',
              backgroundColor: char === '#' ? color : 'transparent',
            }}
          />
        ))}
      </div>
    ));
  }, [app]);

  const handleClick = () => {
    sound.playClick();
    onSelect();
  };

  const handleDoubleClick = () => {
    sound.playWindowOpen();
    onDoubleClick();
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'rgba(51, 255, 51, 0.2)' : 'transparent',
        border: isSelected ? '1px dashed var(--terminal-green)' : '1px solid transparent',
        userSelect: 'none',
      }}
    >
      {/* ICON */}
      <div style={{
        padding: '4px',
        marginBottom: '4px',
      }}>
        {pixelGrid}
      </div>

      {/* LABEL */}
      <span style={{
        fontSize: '12px',
        textAlign: 'center',
        color: isSelected ? 'var(--terminal-green)' : 'var(--terminal-white)',
        textShadow: isSelected ? '0 0 5px var(--terminal-green)' : 'none',
      }}>
        {label}
      </span>
    </div>
  );
}
