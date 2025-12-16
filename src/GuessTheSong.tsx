import React, { useRef, useEffect, useState } from 'react';
import { useCurrentFrame, AbsoluteFill, staticFile } from 'remotion';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './GameEngine';

interface GuessTheSongProps {
    seed?: number;
}

export const GuessTheSong: React.FC<GuessTheSongProps> = ({ seed = 12345 }) => {
    const frame = useCurrentFrame();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 5, vy: 3 });
    const [diddyImage, setDiddyImage] = useState<HTMLImageElement | null>(null);

    // Load the Diddy image
    useEffect(() => {
        const img = new Image();
        img.src = staticFile('/images/diddy.png');
        img.onload = () => setDiddyImage(img);
    }, []);

    // Draw on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- BACKGROUND ---
        // Create a vibrant music-themed gradient (deep purple to electric blue)
        const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGradient.addColorStop(0, '#1a1a2e');
        bgGradient.addColorStop(0.3, '#16213e');
        bgGradient.addColorStop(0.7, '#0f3460');
        bgGradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Add animated sound wave pattern in background
        ctx.strokeStyle = 'rgba(138, 43, 226, 0.3)'; // Purple waves
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const y = 200 + i * 150;
            const amplitude = 30 + Math.sin(frame * 0.05 + i) * 20;
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x < CANVAS_WIDTH; x += 10) {
                const waveY = y + Math.sin(x * 0.02 + frame * 0.1 + i * 0.5) * amplitude;
                ctx.lineTo(x, waveY);
            }
            ctx.stroke();
        }

        // --- TITLE TEXT ---
        ctx.save();
        ctx.font = 'bold 90px Arial';
        ctx.shadowColor = '#ff6b9d';
        ctx.shadowBlur = 15;

        const titleX = CANVAS_WIDTH / 2;
        const titleY = 280;

        // Title: "Guess the" (white) + "Song!" (purple with glow)
        const lineA = 'Guess the ';
        const lineB = 'Song!';

        // Measure and draw using left alignment for precise placement while keeping centered layout
        ctx.textAlign = 'left';

        // Line placement
        const full = lineA + lineB;
        const fullWidth = ctx.measureText(full).width;
        const startX = titleX - fullWidth / 2;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(lineA, startX, titleY);

        ctx.fillStyle = '#8a2be2';
        ctx.shadowColor = '#8a2be2';
        ctx.fillText(lineB, startX + ctx.measureText(lineA).width, titleY);

        ctx.restore();

        // --- CENTER CIRCLE ---
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const radius = 450;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#8a2be2';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#8a2be2';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // --- BALL ---
        const ball = ballRef.current;
        const ballRadius = 25;
        const gravity = 0.5;
        const damping = 0.98;

        // Apply gravity
        ball.vy += gravity;

        // Update ball position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Check collision with circle edge
        const dx = ball.x - centerX;
        const dy = ball.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist + ballRadius > radius) {
            // Reflect velocity
            const nx = dx / dist;
            const ny = dy / dist;
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx -= 2 * dot * nx;
            ball.vy -= 2 * dot * ny;
            // Apply damping
            ball.vx *= damping;
            ball.vy *= damping;
            // Correct position
            const overlap = dist + ballRadius - radius;
            ball.x -= overlap * nx;
            ball.y -= overlap * ny;
        }

        // Draw ball (now Diddy image)
        if (diddyImage) {
            const imgWidth = ballRadius * 4;
            const imgHeight = imgWidth * (590 / 393);
            ctx.drawImage(diddyImage, ball.x - imgWidth / 2, ball.y - imgHeight / 2, imgWidth, imgHeight);
        }

    }, [frame]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
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