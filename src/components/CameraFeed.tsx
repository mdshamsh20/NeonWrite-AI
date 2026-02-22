import React, { useRef, useEffect, useState } from 'react';

interface CameraFeedProps {
    onVideoReady?: (videoElement: HTMLVideoElement) => void;
    className?: string;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ onVideoReady, className = '' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;

        const initCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user' // Front-facing camera
                    },
                    audio: false
                });

                setHasPermission(true);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Error accessing camera:', err);
                setHasPermission(false);
            }
        };

        initCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleVideoCanPlay = () => {
        if (videoRef.current && onVideoReady) {
            // Start processing when the video is ready
            onVideoReady(videoRef.current);
        }
    };

    return (
        <div className={`relative overflow-hidden bg-black ${className}`}>
            {hasPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 text-white rounded-lg p-6 text-center">
                    <p>Camera access denied. Please enable camera permissions to use AirWrite.</p>
                </div>
            )}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onCanPlay={handleVideoCanPlay}
                className="w-full h-full object-cover transform -scale-x-100" // Mirror the camera feed
            />
        </div>
    );
};
