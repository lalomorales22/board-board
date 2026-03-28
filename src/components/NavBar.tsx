import { useAppContext } from '../context/AppContext';
import type { ViewMode } from '../types';

export default function NavBar() {
  const { view, setView, setSettingsOpen, settings, updateSettings } = useAppContext();

  const viewBtn = (v: ViewMode, label: string) => (
    <button
      className={`nav-view-btn ${view === v ? 'active' : ''}`}
      onClick={() => setView(v)}
    >
      {label}
    </button>
  );

  return (
    <nav className="navbar">
      <div className="nav-brand">BOARD&middot;BOARD</div>

      <div className="nav-views">
        {viewBtn('flipboard', 'BOARD')}
        {viewBtn('whiteboard', 'DRAW')}
      </div>

      <div className="nav-actions">
        {/* Day / Night toggle */}
        <button
          className="nav-icon-btn"
          onClick={() => updateSettings({ dayMode: !settings.dayMode })}
          title={settings.dayMode ? 'Switch to night' : 'Switch to day'}
        >
          {settings.dayMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
        </button>
        {/* Fullscreen */}
        <button
          className="nav-icon-btn"
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
          }}
          title="Toggle fullscreen"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />
          </svg>
        </button>
        {/* Settings */}
        <button
          className="nav-icon-btn"
          onClick={() => setSettingsOpen(true)}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M13.5 8a5.5 5.5 0 01-.4 1.6l1.2 1.2-1.1 1.1-1.2-1.2A5.5 5.5 0 018 13.5a5.5 5.5 0 01-3.8-1.6L3 13.1l-1.1-1.1 1.2-1.2A5.5 5.5 0 012.5 8c0-.6.1-1.1.3-1.6L1.6 5.2l1.1-1.1 1.2 1.2A5.5 5.5 0 018 2.5c1.4 0 2.7.5 3.8 1.6l1.2-1.2 1.1 1.1-1.2 1.2c.2.5.3 1 .3 1.6z" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
