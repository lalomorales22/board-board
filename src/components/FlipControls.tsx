import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { MAX_ROWS } from '../types';
import type { OllamaState } from '../hooks/useOllama';
import type { TileSize, AutoInterval } from '../types';

interface Props {
  message: string;
  onMessageChange: (msg: string) => void;
  columns: number;
  ollama: OllamaState;
  onAiPrompt: (prompt: string) => Promise<void>;
  thinking: boolean;
}

const INTERVALS: { value: AutoInterval; label: string }[] = [
  { value: 1, label: '1m' },
  { value: 5, label: '5m' },
  { value: 10, label: '10m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
];

export default function FlipControls({
  message, onMessageChange, columns, ollama, onAiPrompt, thinking,
}: Props) {
  const { settings, updateSettings } = useAppContext();
  const { models, connected, generating, error } = ollama;
  const [prompt, setPrompt] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = thinking || generating;
  const isAiReady = connected && !!settings.selectedModel;
  const inputMode = manualMode || !isAiReady ? 'manual' : 'ai';

  // Auto-resize textarea to fit content
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }, [inputMode === 'manual' ? message : prompt]);

  // In manual mode, limit lines to MAX_ROWS
  const handleManualChange = (value: string) => {
    const lines = value.split('\n');
    if (lines.length > MAX_ROWS) return; // Don't allow more than MAX_ROWS lines
    onMessageChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (inputMode === 'ai') {
      // AI mode: Enter sends prompt, Shift+Enter for new line
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAiSubmit();
      }
    } else {
      // Manual mode: Enter creates new row (if under MAX_ROWS), Cmd+Enter submits
      if (e.key === 'Enter' && !e.shiftKey) {
        const lines = message.split('\n');
        if (lines.length >= MAX_ROWS) {
          e.preventDefault(); // At max rows, block Enter
        }
        // Otherwise, Enter naturally creates a new line in textarea
      }
    }
  };

  const handleAiSubmit = async () => {
    if (!prompt.trim() || isBusy) return;
    const text = prompt.trim();
    setPrompt('');
    await onAiPrompt(text);
  };

  const sizeBtn = (s: TileSize, label: string) => (
    <button
      className={`size-btn ${settings.tileSize === s ? 'active' : ''}`}
      onClick={() => updateSettings({ tileSize: s })}
    >
      {label}
    </button>
  );

  return (
    <div className="flip-controls">
      {/* Input row */}
      <div className="controls-section controls-input">
        <div className="input-mode-toggle">
          <button
            className={`mode-btn ${inputMode === 'ai' ? 'active' : ''}`}
            onClick={() => setManualMode(false)}
            disabled={!isAiReady}
            title="Send to AI"
          >
            AI
          </button>
          <button
            className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
            onClick={() => setManualMode(true)}
            title="Type directly on board"
          >
            TXT
          </button>
        </div>

        <div className="input-wrapper">
          {inputMode === 'ai' ? (
            <>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isBusy ? 'Thinking...' : 'Ask AI something... (Enter to send)'}
                spellCheck={false}
                disabled={isBusy}
                rows={1}
                className="input-field"
              />
              <button
                className="send-btn"
                onClick={handleAiSubmit}
                disabled={!prompt.trim() || isBusy}
              >
                {isBusy ? '...' : 'Ask'}
              </button>
            </>
          ) : (
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleManualChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type on the board... (Enter for new row)"
              spellCheck={false}
              rows={1}
              className="input-field"
            />
          )}
        </div>

        <div className="controls-info">
          {columns}x{Math.max(1, Math.min(MAX_ROWS, (inputMode === 'manual' ? message : '').split('\n').length))}
        </div>
      </div>

      {/* Tools row */}
      <div className="controls-section controls-tools">
        {/* Tile size */}
        <div className="control-group">
          <label>Size</label>
          <div className="btn-group">
            {sizeBtn('small', 'S')}
            {sizeBtn('medium', 'M')}
            {sizeBtn('large', 'L')}
          </div>
        </div>

        <div className="controls-divider" />

        {/* AI Model + Connect */}
        <div className="control-group ai-group">
          <label>
            AI
            <span className={`status-dot ${connected ? 'connected' : ''}`} />
          </label>
          <div className="ai-controls">
            <select
              value={settings.selectedModel}
              onChange={(e) => updateSettings({ selectedModel: e.target.value })}
              disabled={!connected}
            >
              <option value="">
                {connected ? 'Select model...' : 'Not connected'}
              </option>
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>

            <button
              className={`connect-btn ${connected ? 'connected' : ''}`}
              onClick={() => ollama.refresh()}
              title={connected ? 'Refresh models' : 'Connect to Ollama'}
            >
              {connected ? 'Refresh' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Auto mode */}
        <div className="control-group">
          <label>Auto</label>
          <div className="auto-controls">
            <button
              className={`toggle-btn ${settings.autoMode ? 'active' : ''}`}
              onClick={() => updateSettings({ autoMode: !settings.autoMode })}
              disabled={!isAiReady}
            >
              {settings.autoMode ? 'ON' : 'OFF'}
            </button>
            <select
              className="interval-select"
              value={settings.autoInterval}
              onChange={(e) => updateSettings({ autoInterval: Number(e.target.value) as AutoInterval })}
              disabled={!settings.autoMode}
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="ai-error">{error}</div>}
      </div>
    </div>
  );
}
