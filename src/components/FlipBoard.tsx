import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useOllama } from '../hooks/useOllama';
import { TILE_DIMS, MAX_COLS, MAX_ROWS, CHAR_SET } from '../types';
import { loadState, saveState } from '../utils/storage';
import FlipTile from './FlipTile';
import FlipControls from './FlipControls';

export default function FlipBoard() {
  const { settings } = useAppContext();
  const ollama = useOllama(settings.ollamaUrl, settings.selectedModel);

  const [message, setMessage] = useState(() => loadState('boardMessage', 'BOARD BOARD'));
  const [columns, setColumns] = useState(16);
  const [thinking, setThinking] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  // Persist message
  useEffect(() => { saveState('boardMessage', message); }, [message]);

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

  // Rows are determined by the displayed content (number of lines, capped at MAX_ROWS)
  const displayText = thinking ? '...THINKING...' : message;
  const rows = Math.max(1, Math.min(MAX_ROWS, displayText.split('\n').length));

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

  // Handle AI prompt
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
        columns={columns}
        ollama={ollama}
        onAiPrompt={handleAiPrompt}
        thinking={thinking}
      />
    </div>
  );
}
