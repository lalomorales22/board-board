import { useRef, useState, useEffect, useCallback } from 'react';
import type { DrawPath, WhiteboardTool } from '../types';
import WhiteboardTools from './WhiteboardTools';

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<WhiteboardTool>('pen');
  const [color, setColor] = useState('#222222');
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pathVersion, setPathVersion] = useState(0);

  const pathsRef = useRef<DrawPath[]>([]);
  const undoneRef = useRef<DrawPath[]>([]);
  const currentRef = useRef<DrawPath | null>(null);

  const drawPath = useCallback((ctx: CanvasRenderingContext2D, p: DrawPath) => {
    if (p.points.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = p.width;

    if (p.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = p.color;
    }

    ctx.moveTo(p.points[0].x, p.points[0].y);
    for (let i = 1; i < p.points.length; i++) {
      const prev = p.points[i - 1];
      const cur = p.points[i];
      const mx = (prev.x + cur.x) / 2;
      const my = (prev.y + cur.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    }
    const last = p.points[p.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pathsRef.current) drawPath(ctx, p);
    if (currentRef.current) drawPath(ctx, currentRef.current);
  }, [drawPath]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Save current image
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = canvas.height;
      tmpCanvas.getContext('2d')!.drawImage(canvas, 0, 0);

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);

      // Redraw all paths at new scale
      redraw();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    setIsDrawing(true);
    currentRef.current = {
      points: [pos],
      color,
      width: tool === 'eraser' ? brushSize * 4 : brushSize,
      tool,
    };
    undoneRef.current = [];
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentRef.current) return;
    currentRef.current.points.push(getPos(e));
    redraw();
  };

  const endDraw = () => {
    if (!isDrawing || !currentRef.current) return;
    if (currentRef.current.points.length > 1) {
      pathsRef.current.push(currentRef.current);
    }
    currentRef.current = null;
    setIsDrawing(false);
    setPathVersion((v) => v + 1);
  };

  const undo = () => {
    const p = pathsRef.current.pop();
    if (p) {
      undoneRef.current.push(p);
      setPathVersion((v) => v + 1);
      redraw();
    }
  };

  const redo = () => {
    const p = undoneRef.current.pop();
    if (p) {
      pathsRef.current.push(p);
      setPathVersion((v) => v + 1);
      redraw();
    }
  };

  const clear = () => {
    pathsRef.current = [];
    undoneRef.current = [];
    setPathVersion((v) => v + 1);
    redraw();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="whiteboard-page">
      <div className="whiteboard-frame" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
          className={tool === 'eraser' ? 'cursor-eraser' : 'cursor-pen'}
        />
      </div>
      <WhiteboardTools
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        onUndo={undo}
        onRedo={redo}
        onClear={clear}
        canUndo={pathsRef.current.length > 0}
        canRedo={undoneRef.current.length > 0}
        pathVersion={pathVersion}
      />
    </div>
  );
}
