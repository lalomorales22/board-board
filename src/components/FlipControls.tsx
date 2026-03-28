import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MAX_ROWS } from '../types';
import type { OllamaState } from '../hooks/useOllama';
import type { TileSize, AutoInterval } from '../types';

interface Props {
  message: string;
  onMessageChange: (msg: string) => void;
  rows: number;
  onRowsChange: (r: number) => void;
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
  message, onMessageChange, rows, onRowsChange, columns, ollama, onAiPrompt, thinking,
}: Props) {
  const { settings, updateSettings } = useAppContext();
  const { models, connected, generating, error } = ollama;
  const [inputText, setInputText] = useState('');
  const [manualMode, setManualMode] = useState(false);

  const isBusy = thinking || generating;

  const handleSubmit = async () => {
    if (!inputText.trim() || isBusy) return;
    if (manualMode || !connected || !settings.selectedModel) {
      onMessageChange(inputText.trim());
      setInputText('');
    } else {
      const prompt = inputText.trim();
      setInputText('');
      await onAiPrompt(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isAiReady = connected && !!settings.selectedModel;
  const inputMode = manualMode || !isAiReady ? 'manual' : 'ai';

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
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isBusy
                ? 'Thinking...'
                : inputMode === 'ai'
                  ? 'Ask AI something... (Enter to send)'
                  : 'Type board text... (Enter to display)'
            }
            spellCheck={false}
            disabled={isBusy}
          />
          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={!inputText.trim() || isBusy}
          >
            {isBusy ? '...' : inputMode === 'ai' ? 'Ask' : 'Set'}
          </button>
        </div>

        <div className="controls-info">
          {columns}x{rows}
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

        {/* Rows */}
        <div className="control-group">
          <label>Rows</label>
          <div className="btn-group">
            <button
              className="icon-btn"
              disabled={rows <= 1}
              onClick={() => onRowsChange(Math.max(1, rows - 1))}
            >
              −
            </button>
            <span className="row-count">{rows}</span>
            <button
              className="icon-btn"
              disabled={rows >= MAX_ROWS}
              onClick={() => onRowsChange(Math.min(MAX_ROWS, rows + 1))}
            >
              +
            </button>
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
