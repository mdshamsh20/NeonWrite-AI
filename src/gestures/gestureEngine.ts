import { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Modes defined by PRD
export type GestureMode = 'DRAW' | 'PAUSE' | 'CLEAR' | 'ERASER' | 'NONE';

/**
 * Helper to calculate Euclidean distance between two landmarks.
 */
function distance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Checks if a specific finger is extended.
 * Compares the distance from the fingertip to the wrist vs the PIP joint to the wrist.
 * MediaPipe indices:
 * Wrist: 0
 * Index tip: 8, PIP: 6
 * Middle tip: 12, PIP: 10
 * Ring tip: 16, PIP: 14
 * Pinky tip: 20, PIP: 18
 * Thumb tip: 4, IP: 3
 */
function isFingerExtended(landmarks: NormalizedLandmark[], tipIdx: number, pipIdx: number): boolean {
  const wrist = landmarks[0];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  
  // A finger is extended if its tip is further from the wrist than its PIP joint
  return distance(tip, wrist) > distance(pip, wrist) * 1.1; // adding a slight threshold
}

export function detectGesture(landmarks: NormalizedLandmark[]): GestureMode {
  if (!landmarks || landmarks.length < 21) {
    return 'NONE';
  }

  // Determine state of each finger
  const isThumbExtended = isFingerExtended(landmarks, 4, 3);
  const isIndexExtended = isFingerExtended(landmarks, 8, 6);
  const isMiddleExtended = isFingerExtended(landmarks, 12, 10);
  const isRingExtended = isFingerExtended(landmarks, 16, 14);
  const isPinkyExtended = isFingerExtended(landmarks, 20, 18);

  const extendedFingersCount = [isThumbExtended, isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(Boolean).length;

  // 1. Closed fist (Eraser) - Very few fingers extended
  if (extendedFingersCount <= 1 && !isIndexExtended) {
    return 'ERASER';
  }

  // 2. Open palm (Clear) - Almost all fingers extended
  if (extendedFingersCount >= 4) {
    return 'CLEAR';
  }

  // 3. Pause (Two fingers: Index + Middle)
  if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return 'PAUSE';
  }

  // 4. Draw (Only Index finger up)
  if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return 'DRAW';
  }

  return 'NONE';
}
