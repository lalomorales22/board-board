export type TileSize = 'small' | 'medium' | 'large';
export type ViewMode = 'flipboard' | 'whiteboard';
export type AutoInterval = 1 | 5 | 10 | 30 | 60;
export type WhiteboardTool = 'pen' | 'eraser';
export type ThemeName = 'classic' | 'matrix' | 'amber' | 'ocean';

export interface AppSettings {
  tileSize: TileSize;
  rows: number;
  textColor: string;
  tileColor: string;
  soundEnabled: boolean;
  soundVolume: number;
  ollamaUrl: string;
  selectedModel: string;
  autoMode: boolean;
  autoInterval: AutoInterval;
  screensaverEnabled: boolean;
  screensaverIdleMinutes: number;
  theme: ThemeName;
  dayMode: boolean;
}

export interface DrawPath {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  tool: WhiteboardTool;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  tileSize: 'medium',
  rows: 3,
  textColor: '#ffffff',
  tileColor: '#1a1a1a',
  soundEnabled: true,
  soundVolume: 0.3,
  ollamaUrl: 'http://localhost:11434',
  selectedModel: '',
  autoMode: false,
  autoInterval: 5,
  screensaverEnabled: false,
  screensaverIdleMinutes: 10,
  theme: 'classic',
  dayMode: false,
};

export const TILE_DIMS: Record<TileSize, { width: number; height: number; fontSize: number; gap: number }> = {
  small:  { width: 32, height: 46, fontSize: 24, gap: 2 },
  medium: { width: 48, height: 68, fontSize: 36, gap: 3 },
  large:  { width: 68, height: 96, fontSize: 52, gap: 4 },
};

export const MAX_COLS = 50;
export const MAX_ROWS = 5;

export const CHAR_SET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!?,\'-":;@#&+()';

export const THEME_COLORS: Record<ThemeName, { text: string; accent: string; tileBg?: string }> = {
  classic: { text: '#ffffff', accent: '#3b82f6' },
  matrix:  { text: '#00ff41', accent: '#00ff41', tileBg: '#0a1a0a' },
  amber:   { text: '#ffb000', accent: '#ffb000', tileBg: '#1a1400' },
  ocean:   { text: '#00d4ff', accent: '#00d4ff', tileBg: '#0a1628' },
};
