import { useAppContext } from '../context/AppContext';
import type { ThemeName } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const THEMES: { value: ThemeName; label: string; preview: string }[] = [
  { value: 'classic', label: 'Classic', preview: '#ffffff' },
  { value: 'matrix', label: 'Matrix', preview: '#00ff41' },
  { value: 'amber', label: 'Amber', preview: '#ffb000' },
  { value: 'ocean', label: 'Ocean', preview: '#00d4ff' },
];

export default function Settings({ open, onClose }: Props) {
  const { settings, updateSettings } = useAppContext();

  return (
    <>
      <div className={`settings-backdrop ${open ? 'visible' : ''}`} onClick={onClose} />
      <div className={`settings-panel ${open ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          {/* Theme */}
          <section className="settings-section">
            <h3>Theme</h3>
            <div className="theme-grid">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  className={`theme-btn ${settings.theme === t.value ? 'active' : ''}`}
                  onClick={() => updateSettings({ theme: t.value })}
                >
                  <div className="theme-preview" style={{ background: '#111', color: t.preview }}>
                    Aa
                  </div>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Colors */}
          <section className="settings-section">
            <h3>Colors</h3>
            <div className="setting-row">
              <label>Text Color</label>
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => updateSettings({ textColor: e.target.value })}
              />
            </div>
            <div className="setting-row">
              <label>Tile Background</label>
              <input
                type="color"
                value={settings.tileColor}
                onChange={(e) => updateSettings({ tileColor: e.target.value })}
              />
            </div>
          </section>

          {/* Sound */}
          <section className="settings-section">
            <h3>Sound</h3>
            <div className="setting-row">
              <label>Flip Sound</label>
              <button
                className={`toggle-btn ${settings.soundEnabled ? 'active' : ''}`}
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              >
                {settings.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            {settings.soundEnabled && (
              <div className="setting-row">
                <label>Volume</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
                />
              </div>
            )}
          </section>

          {/* AI */}
          <section className="settings-section">
            <h3>AI (Ollama)</h3>
            <div className="setting-row">
              <label>Ollama URL</label>
              <input
                type="text"
                value={settings.ollamaUrl}
                onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
                placeholder="http://localhost:11434"
                spellCheck={false}
              />
            </div>
            <p className="settings-hint">
              Ollama must be running locally. Models are auto-detected.
            </p>
          </section>

          {/* Screensaver */}
          <section className="settings-section">
            <h3>Screensaver</h3>
            <div className="setting-row">
              <label>Enable</label>
              <button
                className={`toggle-btn ${settings.screensaverEnabled ? 'active' : ''}`}
                onClick={() => updateSettings({ screensaverEnabled: !settings.screensaverEnabled })}
              >
                {settings.screensaverEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            {settings.screensaverEnabled && (
              <div className="setting-row">
                <label>Idle time (min)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.screensaverIdleMinutes}
                  onChange={(e) => updateSettings({ screensaverIdleMinutes: Number(e.target.value) || 10 })}
                />
              </div>
            )}
            <p className="settings-hint">
              Add PNGs to <code>public/images/</code> for the image screensaver.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
