import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const COLORS = [
    { id: 'white', hex: '#ffffff', name: 'White' },
    { id: 'blue', hex: '#3b82f6', name: 'Blue' },
    { id: 'green', hex: '#10b981', name: 'Green' },
    { id: 'purple', hex: '#8b5cf6', name: 'Purple' },
    { id: 'pink', hex: '#ec4899', name: 'Pink' },
    { id: 'yellow', hex: '#eab308', name: 'Yellow' }
];

interface ToolbarProps {
    currentColor: string;
    onColorChange: (color: string) => void;
    onClear: () => void;
    onDownload: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    currentColor,
    onColorChange,
    onClear,
    onDownload
}) => {
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-[#111827] p-2 pr-6 rounded-full border border-white/10 shadow-2xl z-50">

            {/* Colors Container */}
            <div className="flex items-center gap-2 bg-[#030712] rounded-full p-1">
                {COLORS.map((color) => (
                    <button
                        key={color.id}
                        onClick={() => onColorChange(color.hex)}
                        className={twMerge(
                            clsx(
                                "w-10 h-10 rounded-full transition-all outline-none",
                                currentColor === color.hex
                                    ? "scale-110 shadow-lg z-10"
                                    : "opacity-90 hover:opacity-100 hover:scale-105"
                            )
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                        aria-label={`Select ${color.name}`}
                    />
                ))}
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10"></div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onClear}
                    className="flex items-center justify-center p-2 text-[#fb7185] hover:text-white hover:bg-red-500/20 rounded-full transition-all group"
                    title="Clear Canvas"
                >
                    <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                </button>

                <button
                    onClick={onDownload}
                    className="flex items-center justify-center p-2 text-[#60a5fa] hover:text-white hover:bg-blue-500/20 rounded-full transition-all group"
                    title="Download Output"
                >
                    <Download className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
};
