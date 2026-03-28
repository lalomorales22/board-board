import { useRef, useEffect, useCallback, memo } from 'react';
import { CHAR_SET } from '../types';
import { playFlipSound } from '../utils/audio';

interface FlipTileProps {
  targetChar: string;
  delay?: number;
  size: 'small' | 'medium' | 'large';
  soundEnabled?: boolean;
  soundVolume?: number;
}

const FLIP_DURATION = 80;

function getFlipSequence(from: string, to: string): string[] {
  const fi = CHAR_SET.indexOf(from);
  const ti = CHAR_SET.indexOf(to);
  if (fi === ti) return [];
  const start = fi === -1 ? 0 : fi;
  const end = ti === -1 ? 0 : ti;
  const seq: string[] = [];
  let cur = start;
  // Always flip forward; wrap around if needed
  while (cur !== end) {
    cur = (cur + 1) % CHAR_SET.length;
    seq.push(CHAR_SET[cur]);
  }
  return seq;
}

const FlipTile = memo(function FlipTile({
  targetChar,
  delay = 0,
  size,
  soundEnabled = true,
  soundVolume = 0.3,
}: FlipTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCharRef = useRef(' ');
  const isAnimatingRef = useRef(false);
  const pendingRef = useRef(targetChar);
  const timerRef = useRef<number>(0);

  // DOM refs for direct manipulation during animation
  const topTextRef = useRef<HTMLSpanElement>(null);
  const bottomTextRef = useRef<HTMLSpanElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const flapFrontTextRef = useRef<HTMLSpanElement>(null);
  const flapBackTextRef = useRef<HTMLSpanElement>(null);

  const flipOnce = useCallback((char: string): Promise<void> => {
    return new Promise((resolve) => {
      const flap = flapRef.current;
      const topT = topTextRef.current;
      const botT = bottomTextRef.current;
      const fft = flapFrontTextRef.current;
      const fbt = flapBackTextRef.current;
      if (!flap || !topT || !botT || !fft || !fbt) { resolve(); return; }

      // Setup: static layers show NEW char; flap front shows OLD, back shows NEW
      topT.textContent = char;
      botT.textContent = char;
      fft.textContent = currentCharRef.current;
      fbt.textContent = char;

      // Trigger flip animation
      flap.classList.add('flipping');

      if (soundEnabled) playFlipSound(soundVolume);

      setTimeout(() => {
        // Snap back without animation
        flap.style.transition = 'none';
        flap.classList.remove('flipping');
        fft.textContent = char;
        flap.offsetHeight; // force reflow
        flap.style.transition = '';

        currentCharRef.current = char;
        resolve();
      }, FLIP_DURATION);
    });
  }, [soundEnabled, soundVolume]);

  const animateTo = useCallback(async (target: string) => {
    if (isAnimatingRef.current) {
      pendingRef.current = target;
      return;
    }
    isAnimatingRef.current = true;

    const seq = getFlipSequence(currentCharRef.current, target);
    for (const ch of seq) {
      if (pendingRef.current !== target) break;
      await flipOnce(ch);
    }

    isAnimatingRef.current = false;

    if (pendingRef.current !== currentCharRef.current) {
      animateTo(pendingRef.current);
    }
  }, [flipOnce]);

  useEffect(() => {
    const upper = targetChar.toUpperCase();
    const safe = CHAR_SET.includes(upper) ? upper : ' ';
    pendingRef.current = safe;

    clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (safe !== currentCharRef.current) {
        animateTo(safe);
      }
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [targetChar, delay, animateTo]);

  return (
    <div ref={containerRef} className={`flip-tile tile-${size}`}>
      <div className="tile-upper">
        <span ref={topTextRef} className="tile-char">{' '}</span>
      </div>
      <div className="tile-lower">
        <span ref={bottomTextRef} className="tile-char">{' '}</span>
      </div>
      <div ref={flapRef} className="tile-flap">
        <div className="flap-front">
          <span ref={flapFrontTextRef} className="tile-char">{' '}</span>
        </div>
        <div className="flap-back">
          <span ref={flapBackTextRef} className="tile-char">{' '}</span>
        </div>
      </div>
      <div className="tile-divider" />
    </div>
  );
});

export default FlipTile;
