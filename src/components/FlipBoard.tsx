import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useOllama } from '../hooks/useOllama';
import { MAX_COLS, MAX_ROWS, CHAR_SET } from '../types';
import { loadState, saveState } from '../utils/storage';
import FlipTile from './FlipTile';
import FlipControls from './FlipControls';

// Target column counts per density setting
const DENSITY = { small: 30, medium: 20, large: 12 };
const FRAME_PAD_X = 40; // 20px each side
const FRAME_PAD_Y = 32; // 16px each side
const DISPLAY_PAD = 32; // 16px each side

export default function FlipBoard() {
  const { settings } = useAppContext();
  const ollama = useOllama(settings.ollamaUrl, settings.selectedModel);

  const [message, setMessage] = useState(() => loadState('boardMessage', 'BOARD BOARD'));
  const [columns, setColumns] = useState(16);
  const [tileDims, setTileDims] = useState({ w: 48, h: 68, font: 36, gap: 3 });
  const [thinking, setThinking] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { saveState('boardMessage', message); }, [message]);

  const displayText = thinking ? '...THINKING...' : message;
  const rows = Math.max(1, Math.min(MAX_ROWS, displayText.split('\n').length));

  // Compute columns AND tile size to fill the display area
  useEffect(() => {
    const calc = () => {
      if (!displayRef.current) return;
      const el = displayRef.current;
      const gap = settings.tileSize === 'small' ? 2 : settings.tileSize === 'large' ? 4 : 3;

      const availW = el.clientWidth - DISPLAY_PAD - FRAME_PAD_X;
      const availH = el.clientHeight - DISPLAY_PAD - FRAME_PAD_Y;

      // Determine number of columns from density setting
      const idealW = { small: 28, medium: 44, large: 64 }[settings.tileSize];
      const cols = Math.min(MAX_COLS, Math.max(4, Math.floor(availW / (idealW + gap))));

      // Compute tile width to fill horizontal space
      const tileW = Math.max(20, Math.floor((availW - (cols - 1) * gap) / cols));

      // Compute tile height to fill vertical space
      const rawH = Math.floor((availH - (rows - 1) * gap) / rows);
      // Cap aspect ratio: tile shouldn't be taller than ~1.8x its width
      const tileH = Math.max(20, Math.min(rawH, Math.floor(tileW * 1.8)));

      // Font: proportional to the tile, fitting nicely inside
      const fontSize = Math.max(12, Math.floor(Math.min(tileW * 0.75, tileH * 0.52)));

      setTileDims({ w: tileW, h: tileH, font: fontSize, gap });
      setColumns(cols);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (displayRef.current) ro.observe(displayRef.current);
    return () => ro.disconnect();
  }, [settings.tileSize, rows]);

  const grid = useMemo(() => {
    const lines = displayText.toUpperCase().split('\n');
    return Array.from({ length: rows }, (_, r) => {
      const line = lines[r] || '';
      return Array.from({ length: columns }, (_, c) => {
        const ch = (line[c] || ' ').toUpperCase();
        return CHAR_SET.includes(ch) ? ch : ' ';
      });
    });
  }, [displayText, rows, columns]);

  // Auto AI mode
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  useEffect(() => {
    if (!settings.autoMode || !ollama.connected || !settings.selectedModel) return;
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      setThinking(true);
      const phrase = await ollama.generate(columnsRef.current, MAX_ROWS);
      if (!cancelled) {
        setThinking(false);
        if (phrase) setMessage(phrase);
      }
    };
    run();
    const iv = setInterval(run, settings.autoInterval * 60 * 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [settings.autoMode, settings.autoInterval, settings.selectedModel, ollama.connected, ollama.generate]);

  const handleAiPrompt = useCallback(async (prompt: string) => {
    setThinking(true);
    const phrase = await ollama.generate(columnsRef.current, MAX_ROWS, prompt);
    setThinking(false);
    if (phrase) {
      setMessage(phrase);
    } else if (ollama.error) {
      setMessage(ollama.error.toUpperCase().slice(0, columnsRef.current));
    }
  }, [ollama.generate, ollama.error]);

  const frameStyle = {
    '--t-w': tileDims.w + 'px',
    '--t-h': tileDims.h + 'px',
    '--t-font': tileDims.font + 'px',
    '--t-gap': tileDims.gap + 'px',
  } as React.CSSProperties;

  return (
    <div className="flipboard-page">
      <div className="flipboard-display" ref={displayRef}>
        <div className="flipboard-frame" style={frameStyle}>
          {grid.map((row, r) => (
            <div key={r} className="flipboard-row">
              {row.map((ch, c) => (
                <FlipTile
                  key={`${r}-${c}`}
                  targetChar={ch}
                  delay={(r * columns + c) * 18}
                  soundEnabled={settings.soundEnabled}
                  soundVolume={settings.soundVolume}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <FlipControls
        message={message}
        onMessageChange={setMessage}
        columns={columns}
        ollama={ollama}
        onAiPrompt={handleAiPrompt}
        thinking={thinking}
      />
    </div>
  );
}
