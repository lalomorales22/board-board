import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  onDismiss: () => void;
}

const SS_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6',
];

const TILE_SIZE = 48;
const FLIP_STAGGER = 40; // ms between tile flips
const HOLD_DURATION = 6000; // ms to hold image/pattern

export default function Screensaver({ onDismiss }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState<{ rows: number; cols: number }>({ rows: 0, cols: 0 });
  const [tiles, setTiles] = useState<Array<{ color: string; imageSlice?: string; flipped: boolean }>>([]);
  const [images, setImages] = useState<string[]>([]);
  const imageIdxRef = useRef(0);
  const phaseRef = useRef<'idle' | 'revealing' | 'holding' | 'hiding'>('idle');
  const timerRef = useRef<number>(0);

  // Calculate grid dimensions
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cols = Math.ceil(w / TILE_SIZE);
      const rows = Math.ceil(h / TILE_SIZE);
      setGrid({ rows, cols });
      setTiles(
        Array.from({ length: rows * cols }, () => ({
          color: SS_COLORS[Math.floor(Math.random() * SS_COLORS.length)],
          flipped: false,
        }))
      );
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // Load images
  useEffect(() => {
    fetch('/api/images')
      .then((r) => r.json())
      .then((imgs: string[]) => setImages(imgs))
      .catch(() => {});
  }, []);

  // Slice image into tiles
  const sliceImage = useCallback(
    (imgSrc: string): Promise<string[]> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const { rows, cols } = grid;
          const canvas = document.createElement('canvas');
          canvas.width = cols * TILE_SIZE;
          canvas.height = rows * TILE_SIZE;
          const ctx = canvas.getContext('2d')!;

          // Cover-fit the image
          const imgRatio = img.width / img.height;
          const canvasRatio = canvas.width / canvas.height;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (imgRatio > canvasRatio) {
            sw = img.height * canvasRatio;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / canvasRatio;
            sy = (img.height - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

          const slices: string[] = [];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const tc = document.createElement('canvas');
              tc.width = TILE_SIZE;
              tc.height = TILE_SIZE;
              tc.getContext('2d')!.drawImage(
                canvas, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE,
                0, 0, TILE_SIZE, TILE_SIZE
              );
              slices.push(tc.toDataURL('image/jpeg', 0.7));
            }
          }
          resolve(slices);
        };
        img.onerror = () => resolve([]);
        img.src = imgSrc;
      });
    },
    [grid]
  );

  // Generate random reveal order
  const getRandomOrder = useCallback((count: number) => {
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }, []);

  // Animation cycle
  const runCycle = useCallback(async () => {
    const total = grid.rows * grid.cols;
    if (total === 0) return;

    phaseRef.current = 'revealing';

    // Decide: image or color pattern
    let slices: string[] = [];
    if (images.length > 0) {
      const idx = imageIdxRef.current % images.length;
      imageIdxRef.current++;
      slices = await sliceImage(images[idx]);
    }

    const useImages = slices.length === total;
    const order = getRandomOrder(total);
    const newColors = Array.from({ length: total }, () =>
      SS_COLORS[Math.floor(Math.random() * SS_COLORS.length)]
    );

    // Reveal tiles one by one
    for (let i = 0; i < order.length; i++) {
      const idx = order[i];
      setTiles((prev) => {
        const next = [...prev];
        next[idx] = {
          color: newColors[idx],
          imageSlice: useImages ? slices[idx] : undefined,
          flipped: true,
        };
        return next;
      });
      await new Promise((r) => setTimeout(r, FLIP_STAGGER));
    }

    // Hold
    phaseRef.current = 'holding';
    await new Promise((r) => (timerRef.current = window.setTimeout(r, HOLD_DURATION)));

    // Hide tiles
    phaseRef.current = 'hiding';
    const hideOrder = getRandomOrder(total);
    for (let i = 0; i < hideOrder.length; i++) {
      const idx = hideOrder[i];
      setTiles((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], flipped: false };
        return next;
      });
      await new Promise((r) => setTimeout(r, FLIP_STAGGER / 2));
    }

    // Brief pause then repeat
    await new Promise((r) => (timerRef.current = window.setTimeout(r, 1000)));
    phaseRef.current = 'idle';
  }, [grid, images, sliceImage, getRandomOrder]);

  // Start animation loop
  useEffect(() => {
    if (grid.rows === 0) return;
    let running = true;

    const loop = async () => {
      while (running) {
        await runCycle();
      }
    };
    loop();

    return () => {
      running = false;
      clearTimeout(timerRef.current);
    };
  }, [grid, runCycle]);

  return (
    <div className="screensaver" onClick={onDismiss} ref={containerRef}>
      <div
        className="ss-grid"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${grid.rows}, ${TILE_SIZE}px)`,
        }}
      >
        {tiles.map((tile, i) => (
          <div key={i} className={`ss-tile ${tile.flipped ? 'flipped' : ''}`}>
            <div className="ss-tile-inner">
              <div className="ss-tile-front" />
              <div
                className="ss-tile-back"
                style={
                  tile.imageSlice
                    ? { backgroundImage: `url(${tile.imageSlice})`, backgroundSize: 'cover' }
                    : { backgroundColor: tile.color }
                }
              />
            </div>
          </div>
        ))}
      </div>
      <div className="ss-hint">Click anywhere to exit</div>
    </div>
  );
}
