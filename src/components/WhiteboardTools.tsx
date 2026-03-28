import type { WhiteboardTool } from '../types';

const MARKER_COLORS = [
  { color: '#222222', label: 'Black' },
  { color: '#dc2626', label: 'Red' },
  { color: '#2563eb', label: 'Blue' },
  { color: '#16a34a', label: 'Green' },
  { color: '#9333ea', label: 'Purple' },
  { color: '#ea580c', label: 'Orange' },
];

interface Props {
  tool: WhiteboardTool;
  onToolChange: (t: WhiteboardTool) => void;
  color: string;
  onColorChange: (c: string) => void;
  brushSize: number;
  onBrushSizeChange: (s: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pathVersion: number;
}

export default function WhiteboardTools({
  tool, onToolChange, color, onColorChange,
  brushSize, onBrushSizeChange,
  onUndo, onRedo, onClear, canUndo, canRedo,
}: Props) {
  return (
    <div className="wb-tools">
      {/* Tool selection */}
      <div className="wb-tool-group">
        <button
          className={`wb-tool-btn ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => onToolChange('pen')}
          title="Pen"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z" />
          </svg>
        </button>
        <button
          className={`wb-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => onToolChange('eraser')}
          title="Eraser"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 20H7L3 16a1 1 0 010-1.4l9.6-9.6a1 1 0 011.4 0l7 7a1 1 0 010 1.4L14 20" />
          </svg>
        </button>
      </div>

      <div className="wb-separator" />

      {/* Colors */}
      <div className="wb-tool-group wb-colors">
        {MARKER_COLORS.map((c) => (
          <button
            key={c.color}
            className={`wb-color-btn ${color === c.color ? 'active' : ''}`}
            style={{ '--swatch': c.color } as React.CSSProperties}
            onClick={() => onColorChange(c.color)}
            title={c.label}
          />
        ))}
        <label className="wb-color-custom" title="Custom color">
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
          />
          <span className="wb-color-btn custom" style={{ '--swatch': color } as React.CSSProperties} />
        </label>
      </div>

      <div className="wb-separator" />

      {/* Brush size */}
      <div className="wb-tool-group wb-brush">
        <input
          type="range"
          min="1"
          max="24"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="wb-slider"
        />
        <div
          className="wb-brush-preview"
          style={{ width: brushSize, height: brushSize }}
        />
      </div>

      <div className="wb-separator" />

      {/* Actions */}
      <div className="wb-tool-group">
        <button className="wb-tool-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Cmd+Z)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 10h10a5 5 0 015 5v2" />
            <path d="M3 10l5-5M3 10l5 5" />
          </svg>
        </button>
        <button className="wb-tool-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 10H11a5 5 0 00-5 5v2" />
            <path d="M21 10l-5-5M21 10l-5 5" />
          </svg>
        </button>
        <button className="wb-tool-btn danger" onClick={onClear} title="Clear board">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
