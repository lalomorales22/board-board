import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, type AppSettings, type ViewMode, type ThemeName, THEME_COLORS } from '../types';
import { loadState, saveState } from '../utils/storage';

interface AppContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  screensaverActive: boolean;
  setScreensaverActive: (active: boolean) => void;
}

const AppContext = createContext<AppContextType>(null!);

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadState('settings', DEFAULT_SETTINGS)
  );
  const [view, setView] = useState<ViewMode>('flipboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [screensaverActive, setScreensaverActive] = useState(false);

  // Persist settings
  useEffect(() => {
    saveState('settings', settings);
  }, [settings]);

  // Apply theme CSS variables + day/night mode
  useEffect(() => {
    const root = document.documentElement;
    const theme = THEME_COLORS[settings.theme];
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-mode', settings.dayMode ? 'day' : 'night');
    root.style.setProperty('--text-tile', settings.textColor || theme.text);
    root.style.setProperty('--accent', theme.accent);
    if (theme.tileBg) {
      root.style.setProperty('--bg-tile', theme.tileBg);
    } else {
      root.style.setProperty('--bg-tile', settings.tileColor || '#1a1a1a');
    }
  }, [settings.theme, settings.textColor, settings.tileColor, settings.dayMode]);

  // Idle detection for screensaver
  useEffect(() => {
    if (!settings.screensaverEnabled) {
      setScreensaverActive(false);
      return;
    }

    let timer: number;
    const reset = () => {
      clearTimeout(timer);
      if (screensaverActive) setScreensaverActive(false);
      timer = window.setTimeout(() => {
        setScreensaverActive(true);
      }, settings.screensaverIdleMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'wheel'] as const;
    events.forEach((e) => document.addEventListener(e, reset));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => document.removeEventListener(e, reset));
    };
  }, [settings.screensaverEnabled, settings.screensaverIdleMinutes, screensaverActive]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      // When theme changes, also update text color to match
      if (updates.theme && updates.theme !== prev.theme && !updates.textColor) {
        next.textColor = THEME_COLORS[updates.theme as ThemeName].text;
      }
      return next;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        view,
        setView,
        settingsOpen,
        setSettingsOpen,
        screensaverActive,
        setScreensaverActive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
