// ============================================
// BOUNCE GAME - Remotion Edition
// Constants and Types for Visual Format
// ============================================

// Canvas and dimensions (9:16 ratio for YouTube Shorts)
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

// Game timing (kept for compatibility)
export const FPS = 60;
// Set to a very large number for effectively indefinite playback
export const GAME_DURATION_FRAMES = 60 * 60 * FPS; // 1 hour at 60fps

// Game constants
export const GROUND_HEIGHT = 10;

// Shared spiral parameters (used by rendering)
export const SPIRAL_TURNS = 3.5;
export const SPIRAL_START_RADIUS = 70;
export const SPIRAL_END_RADIUS = 500; // match rendering spiral radius
export const SPIRAL_ANGLE_OFFSET = Math.PI; // offset used when drawing the trajectory

export function getSpiralPosition(t: number, centerX: number, centerY: number): { x: number, y: number } {
    const angle = SPIRAL_TURNS * 2 * Math.PI * t + SPIRAL_ANGLE_OFFSET;
    const radius = SPIRAL_START_RADIUS + (SPIRAL_END_RADIUS - SPIRAL_START_RADIUS) * t;
    const x = centerX - Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    return { x, y };
}

export interface BounceRound {
    stationarySize: number;
    stationaryWeight: number;
    movingSize: number;
    movingWeight: number;
    startFrame: number;
    duration: number;
    movementDuration: number;
    roundIndex: number;
}

export interface PhysicsState {
    stationaryPosition: { x: number; y: number };
    stationaryVelocity: { x: number; y: number };
    movingPosition: { x: number; y: number };
    movingVelocity: { x: number; y: number };
    firstCollisionFrame: number | null;
    spiralCollisionFrames: number[];
    coinsCollected: number;
    donkeyPosition: { x: number; y: number } | null;
    donkeyVelocity: { x: number; y: number } | null;
    secondCollisionFrame: number | null;
    fragments: { x: number; y: number; vx: number; vy: number; r: number }[];
}