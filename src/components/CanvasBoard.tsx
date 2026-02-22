import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface CanvasBoardHandle {
    clearCanvas: () => void;
    downloadCanvas: () => void;
    getCanvas: () => HTMLCanvasElement | null;
}

interface CanvasBoardProps {
    // Can extend if needed, but the main logic is controlled from outside
}

export const CanvasBoard = forwardRef<CanvasBoardHandle, CanvasBoardProps>((_props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
        clearCanvas: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        },
        downloadCanvas: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Create a temporary canvas with white background for export
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = canvas.width;
            exportCanvas.height = canvas.height;
            const ctx = exportCanvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#1e293b'; // slate-800 for cool dark mode background
                ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                ctx.drawImage(canvas, 0, 0);
            }

            const link = document.createElement('a');
            link.download = `airwrite-export-${Date.now()}.png`;
            link.href = exportCanvas.toDataURL('image/png');
            link.click();
        },
        getCanvas: () => canvasRef.current
    }));

    useEffect(() => {
        // Handle resize to keep canvas full screen
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                // Only resize if different to prevent clearing content automatically
                if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    // Setting line defaults
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                    }
                }
            }
        };

        handleResize(); // Initialize
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        />
    );
});

CanvasBoard.displayName = 'CanvasBoard';
