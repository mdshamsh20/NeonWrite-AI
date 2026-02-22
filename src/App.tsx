import { useEffect, useState, useRef, useCallback } from 'react';
import { CameraFeed } from './components/CameraFeed';
import { CanvasBoard, CanvasBoardHandle } from './components/CanvasBoard';
import { Toolbar, COLORS } from './components/Toolbar';
import { GesturesOverlay } from './components/GesturesOverlay';
import { handTracker } from './vision/handTracker';
import { detectGesture, GestureMode } from './gestures/gestureEngine';
import { MovingAverageFilter } from './utils/smoothing';

function App() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [currentColor, setCurrentColor] = useState(COLORS[0].hex);
  const [mode, setMode] = useState<GestureMode>('NONE');
  const [fps, setFps] = useState(0);
  const [pointerPos, setPointerPos] = useState<{ x: number, y: number, show: boolean }>({ x: 0, y: 0, show: false });

  const canvasRef = useRef<CanvasBoardHandle>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(performance.now());
  const framesRef = useRef<number>(0);

  // State refs for the animation loop
  const colorRef = useRef(currentColor);
  const modeRef = useRef(mode);

  // Drawing state
  const lastPointRef = useRef<{ x: number, y: number } | null>(null);
  const smoothingFilterRef = useRef(new MovingAverageFilter(6)); // Increased moving average window for smoother text

  // Gesture Debounce
  const modeDebounceRef = useRef<{ mode: GestureMode, count: number }>({ mode: 'NONE', count: 0 });

  useEffect(() => {
    colorRef.current = currentColor;
  }, [currentColor]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    // Initialize MediaPipe model
    handTracker.initialize();
  }, []);

  const drawOnCanvas = useCallback((x: number, y: number, _z: number, isDrawing: boolean) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isDrawing) {
      lastPointRef.current = null;
      return;
    }

    if (lastPointRef.current) {
      ctx.beginPath();
      // Calculate mirror X coordinate because the camera feed is mirrored
      const mirrorX = canvas.width - x;

      // Dynamic stroke width based on Z (depth) was causing lines to break due to noise.
      // We will use a consistent, medium-thick width for a smooth neon effect instead.

      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(mirrorX, y);

      // Neon Glow Effect Settings
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 15;
      ctx.shadowColor = colorRef.current;

      ctx.stroke();
      lastPointRef.current = { x: mirrorX, y };
    } else {
      const mirrorX = canvas.width - x;
      lastPointRef.current = { x: mirrorX, y };
    }
  }, []);

  const eraseOnCanvas = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mirrorX = canvas.width - x;
    const eraserSize = 40;

    // Actually clear the path, enabling transparent "erase" down to video layer
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(mirrorX, y, eraserSize, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.restore();

    lastPointRef.current = null; // Reset path connection
  }, []);

  const renderLoop = useCallback(() => {
    if (!videoElement || !handTracker.isReady()) {
      requestRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    // FPS Calculation
    const now = performance.now();
    framesRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      setFps(framesRef.current);
      framesRef.current = 0;
      lastTimeRef.current = now;
    }

    const result = handTracker.detect(videoElement, performance.now());

    if (result && result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0]; // Process only first hand

      // Classify gesture with debounce to prevent flicker
      const detectedMode = detectGesture(landmarks);

      if (detectedMode === modeRef.current) {
        modeDebounceRef.current.count = 0;
      } else {
        if (modeDebounceRef.current.mode === detectedMode) {
          modeDebounceRef.current.count++;
          if (modeDebounceRef.current.count > 3) { // Require 3 consistent frames to switch mode
            modeRef.current = detectedMode;
            setMode(detectedMode);
            modeDebounceRef.current.count = 0;
          }
        } else {
          modeDebounceRef.current.mode = detectedMode;
          modeDebounceRef.current.count = 1;
        }
      }

      const activeMode = modeRef.current;

      // Handle interactions based on active mode
      if (activeMode === 'DRAW' || activeMode === 'ERASER' || activeMode === 'PAUSE') {
        // Always track pointer position when hands are available
        const indexTip = landmarks[8];
        const screenX = indexTip.x * window.innerWidth;
        const screenY = indexTip.y * window.innerHeight;

        // Apply smoothing including Z depth
        const smoothedPoint = smoothingFilterRef.current.add({ x: screenX, y: screenY, z: indexTip.z });

        // Show pointer
        setPointerPos({ x: window.innerWidth - smoothedPoint.x, y: smoothedPoint.y, show: true });

        if (activeMode === 'DRAW') {
          drawOnCanvas(smoothedPoint.x, smoothedPoint.y, smoothedPoint.z || 0, true);
        } else if (activeMode === 'ERASER') {
          eraseOnCanvas(smoothedPoint.x, smoothedPoint.y);
        } else {
          // If we are in PAUSE mode, break the line so it doesn't connect when we draw again
          lastPointRef.current = null;
        }
      } else if (activeMode === 'CLEAR') {
        canvasRef.current?.clearCanvas();
        lastPointRef.current = null;
        smoothingFilterRef.current.reset();
        setPointerPos(p => ({ ...p, show: false }));
      } else {
        lastPointRef.current = null;
        smoothingFilterRef.current.reset();
        setPointerPos(p => ({ ...p, show: false }));
      }
    } else {
      // No hands detected
      if (modeRef.current !== 'NONE') {
        modeRef.current = 'NONE';
        setMode('NONE');
      }
      setPointerPos(p => ({ ...p, show: false }));
      lastPointRef.current = null;
      smoothingFilterRef.current.reset();
    }

    requestRef.current = requestAnimationFrame(renderLoop);
  }, [videoElement, drawOnCanvas, eraseOnCanvas]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [renderLoop]);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans text-white">
      {/* Background Grid Pattern for "Paper" feel */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

      {/* Visible Pointer / Tracker */}
      {pointerPos.show && (
        <div
          className="absolute z-40 rounded-full pointer-events-none transition-all duration-75 ease-out"
          style={{
            left: pointerPos.x,
            top: pointerPos.y,
            transform: 'translate(-50%, -50%)',
            width: mode === 'ERASER' ? '40px' : '16px',
            height: mode === 'ERASER' ? '40px' : '16px',
            backgroundColor: mode === 'ERASER' ? 'rgba(236, 72, 153, 0.4)' : currentColor,
            boxShadow: `0 0 15px ${currentColor}, 0 0 30px ${currentColor}`,
            border: '2px solid white'
          }}
        />
      )}

      {/* Gesture Instructions Panel */}
      <div className="absolute left-6 bottom-6 z-20 bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200/50 w-52 hover:bg-white/90 transition-colors">
        <h2 className="text-xs font-bold mb-3 text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2">Gestures</h2>
        <ul className="space-y-3 text-xs">
          <li className="flex items-center gap-3">
            <span className="text-lg">☝️</span>
            <div>
              <p className="font-semibold text-slate-700">Draw</p>
              <p className="text-[10px] text-slate-500 leading-tight">Index finger</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg">✌️</span>
            <div>
              <p className="font-semibold text-slate-700">Gap/Pause</p>
              <p className="text-[10px] text-slate-500 leading-tight">2 fingers</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg">✊</span>
            <div>
              <p className="font-semibold text-slate-700">Eraser</p>
              <p className="text-[10px] text-slate-500 leading-tight">Closed fist</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg">🖐️</span>
            <div>
              <p className="font-semibold text-slate-700">Clear</p>
              <p className="text-[10px] text-slate-500 leading-tight">Open palm</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Camera Picture-in-Picture */}
      <div className="absolute top-6 right-6 z-20 w-80 h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white/50 bg-black">
        <CameraFeed onVideoReady={setVideoElement} className="absolute inset-0" />
      </div>

      <CanvasBoard ref={canvasRef} />

      {/* Moved overlay to avoid overlapping instructions */}
      <div className="absolute top-6 left-6 z-20">
        <GesturesOverlay mode={mode} fps={fps} />
      </div>

      <Toolbar
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        onClear={() => canvasRef.current?.clearCanvas()}
        onDownload={() => canvasRef.current?.downloadCanvas()}
      />
    </div>
  );
}

export default App;
