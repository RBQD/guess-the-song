import React, { useRef, useEffect } from 'react';
import { useCurrentFrame, AbsoluteFill } from 'remotion';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, SPIRAL_TURNS, SPIRAL_START_RADIUS, SPIRAL_END_RADIUS, SPIRAL_ANGLE_OFFSET } from './GameEngine';

interface GuessTheSongProps {
    seed?: number;
}

export const GuessTheSong: React.FC<GuessTheSongProps> = ({ seed = 12345 }) => {
    const frame = useCurrentFrame();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Draw on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- BACKGROUND ---
        // Create a deep space/night gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGradient.addColorStop(0, '#0f2027');
        bgGradient.addColorStop(0.5, '#203a43');
        bgGradient.addColorStop(1, '#2c5364');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Neon lines on walls
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#4ECDC4';
        ctx.fillStyle = '#4ECDC4';
        ctx.fillRect(0, 0, 10, CANVAS_HEIGHT); // Left wall
        ctx.fillRect(CANVAS_WIDTH - 10, 0, 10, CANVAS_HEIGHT); // Right wall
        ctx.fillRect(0, 0, CANVAS_WIDTH, 10); // Top wall
        ctx.shadowBlur = 0; // Reset shadow

        // Wall boundary lines
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'black';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(10, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH - 10, 0);
        ctx.lineTo(CANVAS_WIDTH - 10, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(CANVAS_WIDTH, 10);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // --- SPIRAL (smooth, continuous) ---
        ctx.save();

        // Define spiral parameters (shared with physics)
        const spiralCenterX = CANVAS_WIDTH / 2 - 30;
        const spiralCenterY = CANVAS_HEIGHT / 2 + 100;
        const spiralTurns = SPIRAL_TURNS; // Number of turns
        const spiralStartRadius = SPIRAL_START_RADIUS; // Opening in the middle
        const spiralEndRadius = SPIRAL_END_RADIUS; // How far out the spiral goes
        const spiralPoints = 600;

        // Create gradient for spiral
        const spiralGradient = ctx.createLinearGradient(
            spiralCenterX - spiralEndRadius, spiralCenterY - spiralEndRadius,
            spiralCenterX + spiralEndRadius, spiralCenterY + spiralEndRadius
        );
        spiralGradient.addColorStop(0, '#FFD700'); // Gold at center
        spiralGradient.addColorStop(0.5, '#FFFFFF'); // White in middle
        spiralGradient.addColorStop(1, '#00BFFF'); // Deep sky blue at outer edge

        ctx.strokeStyle = spiralGradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFD700';

        ctx.beginPath();
        for (let i = 0; i <= spiralPoints; i++) {
            const t = i / spiralPoints;
            const angle = spiralTurns * 2 * Math.PI * t;
            const radius = spiralStartRadius + (spiralEndRadius - SPIRAL_START_RADIUS) * t;
            const x = spiralCenterX - Math.cos(angle) * radius;
            const y = spiralCenterY + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Add inner glow for extra sparkle
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#FFFFFF';
        ctx.globalAlpha = 0.3;
        ctx.stroke();

        ctx.restore();

        // --- GROUND ---
        const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

        // Neon line
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#4ECDC4';
        ctx.fillStyle = '#4ECDC4';
        ctx.fillRect(0, CANVAS_HEIGHT - 5, CANVAS_WIDTH, 5);
        ctx.shadowBlur = 0; // Reset shadow

        // --- TITLE TEXT ---
        ctx.save();
        ctx.font = 'bold 80px Arial';
        ctx.shadowColor = '#4ECDC4';
        ctx.shadowBlur = 10;

        const titleX = CANVAS_WIDTH / 2;
        const titleY1 = 170;
        const titleY2 = titleY1 + 90;

        // We'll draw each line as two parts so only specific words are blue.
        // Line 1: "Will the " (white) + "ball" (blue)
        // Line 2: "reach the " (white) + "center?" (blue)
        const line1A = 'Will the ';
        const line1B = 'ball';
        const line2A = 'reach the ';
        const line2B = 'center?';

        // Measure and draw using left alignment for precise placement while keeping centered layout
        ctx.textAlign = 'left';

        // Line 1 placement
        const full1 = line1A + line1B;
        const full1Width = ctx.measureText(full1).width;
        const startX1 = titleX - full1Width / 2;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line1A, startX1, titleY1);

        ctx.fillStyle = '#00FFFF';
        ctx.fillText(line1B, startX1 + ctx.measureText(line1A).width, titleY1);

        // Line 2 placement
        const full2 = line2A + line2B;
        const full2Width = ctx.measureText(full2).width;
        const startX2 = titleX - full2Width / 2;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line2A, startX2, titleY2);

        ctx.fillStyle = '#00FFFF';
        ctx.fillText(line2B, startX2 + ctx.measureText(line2A).width, titleY2);

        ctx.restore();

    }, [frame]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#0f2027' }}>
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                }}
            />
        </AbsoluteFill>
    );
};