import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useOllama } from '../hooks/useOllama';
import { TILE_DIMS, MAX_COLS, CHAR_SET } from '../types';
import { loadState, saveState } from '../utils/storage';
import FlipTile from './FlipTile';
import FlipControls from './FlipControls';

export default function FlipBoard() {
  const { settings } = useAppContext();
  const ollama = useOllama(settings.ollamaUrl, settings.selectedModel);

  const [message, setMessage] = useState(() => loadState('boardMessage', 'BOARD BOARD'));
  const [rows, setRows] = useState(() => loadState('boardRows', 3));
  const [columns, setColumns] = useState(16);
  const [thinking, setThinking] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  const generateRef = useRef(ollama.generate);
  generateRef.current = ollama.generate;

  // Persist
  useEffect(() => { saveState('boardMessage', message); }, [message]);
  useEffect(() => { saveState('boardRows', rows); }, [rows]);

  // Auto-fit columns
  useEffect(() => {
    const calc = () => {
      if (!displayRef.current) return;
      const td = TILE_DIMS[settings.tileSize];
      const available = displayRef.current.clientWidth - 32 - 40 - 8;
      const cols = Math.min(MAX_COLS, Math.max(4, Math.floor(available / (td.width + td.gap))));
      setColumns(cols);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (displayRef.current) ro.observe(displayRef.current);
    return () => ro.disconnect();
  }, [settings.tileSize]);

  // The display text: show "THINKING..." while AI is working, otherwise the message
  const displayText = thinking ? '...THINKING...' : message;

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
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    if (!settings.autoMode || !ollama.connected || !settings.selectedModel) return;
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      setThinking(true);
      const phrase = await generateRef.current(columnsRef.current, rowsRef.current);
      if (!cancelled) {
        setThinking(false);
        if (phrase) setMessage(phrase);
      }
    };

    run();
    const iv = setInterval(run, settings.autoInterval * 60 * 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [settings.autoMode, settings.autoInterval, settings.selectedModel, ollama.connected]);

  const handleAiPrompt = useCallback(async (prompt: string) => {
    setThinking(true);
    const phrase = await generateRef.current(columnsRef.current, rowsRef.current, prompt);
    setThinking(false);
    if (phrase) setMessage(phrase);
  }, []);

  return (
    <div className="flipboard-page">
      <div className="flipboard-display" ref={displayRef}>
        <div className="flipboard-frame">
          {grid.map((row, r) => (
            <div key={r} className="flipboard-row">
              {row.map((ch, c) => (
                <FlipTile
                  key={`${r}-${c}`}
                  targetChar={ch}
                  delay={(r * columns + c) * 18}
                  size={settings.tileSize}
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
        rows={rows}
        onRowsChange={setRows}
        columns={columns}
        ollama={ollama}
        onAiPrompt={handleAiPrompt}
        thinking={thinking}
      />
    </div>
  );
}
