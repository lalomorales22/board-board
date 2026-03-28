import { useAppContext } from './context/AppContext';
import { resumeAudio } from './utils/audio';
import NavBar from './components/NavBar';
import FlipBoard from './components/FlipBoard';
import Whiteboard from './components/Whiteboard';
import Settings from './components/Settings';
import Screensaver from './components/Screensaver';

export default function App() {
  const { view, settingsOpen, setSettingsOpen, screensaverActive, setScreensaverActive } = useAppContext();

  const handleInteraction = () => {
    resumeAudio();
    if (screensaverActive) setScreensaverActive(false);
  };

  return (
    <div className="app" onClick={handleInteraction}>
      <NavBar />
      <main className="app-main">
        {view === 'flipboard' ? <FlipBoard /> : <Whiteboard />}
      </main>
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {screensaverActive && (
        <Screensaver onDismiss={() => setScreensaverActive(false)} />
      )}
    </div>
  );
}
