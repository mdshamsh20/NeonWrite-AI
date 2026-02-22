import React from 'react';
import { GestureMode } from '../gestures/gestureEngine';
import { Edit3, Hand, MousePointer2, Eraser, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GesturesOverlayProps {
    mode: GestureMode;
    fps: number;
}

export const GesturesOverlay: React.FC<GesturesOverlayProps> = ({ mode, fps }) => {
    const getModeDetails = () => {
        switch (mode) {
            case 'DRAW':
                return { icon: Edit3, text: 'Drawing', color: 'text-blue-600', bg: 'bg-blue-100/90', border: 'border-blue-500/30' };
            case 'PAUSE':
                return { icon: Hand, text: 'Paused', color: 'text-amber-600', bg: 'bg-amber-100/90', border: 'border-amber-500/30' };
            case 'CLEAR':
                return { icon: MousePointer2, text: 'Clearing...', color: 'text-red-600', bg: 'bg-red-100/90', border: 'border-red-500/30' };
            case 'ERASER':
                return { icon: Eraser, text: 'Erasing', color: 'text-pink-600', bg: 'bg-pink-100/90', border: 'border-pink-500/30' };
            default:
                return { icon: Loader2, text: 'Searching Hand...', color: 'text-slate-600', bg: 'bg-slate-100/90', border: 'border-slate-300/50', animate: true };
        }
    };

    const details = getModeDetails();
    const Icon = details.icon;

    return (
        <div className="absolute top-6 left-6 z-50 flex flex-col gap-2">
            <div
                className={twMerge(
                    clsx(
                        "flex items-center gap-3 backdrop-blur-md rounded-2xl px-5 py-3 border shadow-lg transition-colors duration-300",
                        details.bg,
                        details.border,
                        details.color
                    )
                )}
            >
                <Icon className={clsx("w-6 h-6", details.animate ? "animate-spin" : "")} />
                <span className="font-semibold text-lg tracking-wide">{details.text}</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white/80 px-3 py-1.5 rounded-full w-max backdrop-blur-sm border border-slate-200 shadow-sm">
                <div className={clsx("w-2 h-2 rounded-full", fps > 20 ? "bg-green-500" : fps > 10 ? "bg-yellow-500" : "bg-red-500")} />
                {fps} FPS
            </div>
        </div>
    );
};
