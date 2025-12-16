import React, { useRef, useEffect, useState } from 'react';
import { useCurrentFrame, AbsoluteFill, staticFile, Audio } from 'remotion';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_DURATION_FRAMES } from './GameEngine';
import simulationData from './simulation-data.json';

// --- CONFIGURATION ---
const BALL_RADIUS = 25;
const CIRCLE_RADIUS = 450;
const HEAD_SCALE_FACTOR = 0.111; // How much to scale Diddy's head per bounce

interface GuessTheSongProps {
    seed?: number;
}

export const GuessTheSong: React.FC<GuessTheSongProps> = ({ seed = 12345 }) => {
    const frame = useCurrentFrame();
    const canvasRef = useRef<HTMLCanvasElement>(null);
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

        // Title: "Can you Guess" with "Guess" purple, "the Song in Time" with "Song" and "Time" purple
        const lineA_white = 'Can you ';
        const lineA_purple = 'Guess';
        const lineB_white1 = 'the ';
        const lineB_purple1 = 'Song';
        const lineB_white2 = ' in ';
        const lineB_purple2 = 'Time?';

        // Measure and draw using left alignment for precise placement
        ctx.textAlign = 'left';

        // Line height for spacing
        const lineHeight = 100;

        // Calculate positions for first line
        const lineA_full = lineA_white + lineA_purple;
        const lineA_width = ctx.measureText(lineA_full).width;
        const lineA_startX = titleX - lineA_width / 2;

        // Draw first line
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(lineA_white, lineA_startX, titleY);
        ctx.fillStyle = '#8a2be2';
        ctx.shadowColor = '#8a2be2';
        ctx.fillText(lineA_purple, lineA_startX + ctx.measureText(lineA_white).width, titleY);

        // Calculate positions for second line
        const lineB_full = lineB_white1 + lineB_purple1 + lineB_white2 + lineB_purple2;
        const lineB_width = ctx.measureText(lineB_full).width;
        const lineB_startX = titleX - lineB_width / 2;

        // Draw second line
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(lineB_white1, lineB_startX, titleY + lineHeight);
        const bpos1 = lineB_startX + ctx.measureText(lineB_white1).width;
        ctx.fillStyle = '#8a2be2';
        ctx.shadowColor = '#8a2be2';
        ctx.fillText(lineB_purple1, bpos1, titleY + lineHeight);
        const bpos2 = bpos1 + ctx.measureText(lineB_purple1).width;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(lineB_white2, bpos2, titleY + lineHeight);
        const bpos3 = bpos2 + ctx.measureText(lineB_white2).width;
        ctx.fillStyle = '#8a2be2';
        ctx.shadowColor = '#8a2be2';
        ctx.fillText(lineB_purple2, bpos3, titleY + lineHeight);

        ctx.restore();

        // --- CENTER CIRCLE ---
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const radius = CIRCLE_RADIUS;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

        // Stroke with gradient and enhanced glow
        const strokeGradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
        strokeGradient.addColorStop(0, '#8a2be2');
        strokeGradient.addColorStop(0.5, '#ff6b9d');
        strokeGradient.addColorStop(1, '#8a2be2');
        ctx.strokeStyle = strokeGradient;
        ctx.lineWidth = 8;
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#8a2be2';
        ctx.stroke();

        // Inner stroke for layered effect
        ctx.strokeStyle = 'rgba(138, 43, 226, 0.6)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // --- PROGRESS BAR ---
        const progress = Math.min(frame / GAME_DURATION_FRAMES, 1);
        const barWidth = 800;
        const barHeight = 30;
        const barX = (CANVAS_WIDTH - barWidth) / 2;
        const barY = centerY + radius + 140;

        // Background bar with rounded corners
        ctx.fillStyle = 'rgba(138, 43, 226, 0.2)';
        ctx.strokeStyle = 'rgba(138, 43, 226, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 15);
        ctx.fill();
        ctx.stroke();

        // Progress fill with gradient
        const progressWidth = barWidth * progress;
        const gradient = ctx.createLinearGradient(barX, barY, barX + progressWidth, barY);
        gradient.addColorStop(0, '#8a2be2');
        gradient.addColorStop(1, '#ff6b9d');
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#8a2be2';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(barX, barY, progressWidth, barHeight, 15);
        ctx.fill();
        ctx.shadowBlur = 0;

        // --- TIMER TEXT ---
        const elapsedSeconds = Math.floor(frame / 60);
        const totalSeconds = Math.floor(GAME_DURATION_FRAMES / 60);
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        const elapsedSecs = elapsedSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalSecs = totalSeconds % 60;
        const timerText = `${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSecs.toString().padStart(2, '0')} / ${totalMinutes.toString().padStart(2, '0')}:${totalSecs.toString().padStart(2, '0')}`;
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#8a2be2';
        ctx.shadowBlur = 10;
        ctx.fillText(timerText, CANVAS_WIDTH / 2, barY + barHeight + 55);
        ctx.shadowBlur = 0;

        // --- BALL ---
        // Get position from simulation data
        const currentData = simulationData[Math.min(frame, simulationData.length - 1)];
        const { x, y, bounceCount } = currentData;
        const ballRadius = BALL_RADIUS;

        // Draw ball (now Diddy image)
        if (diddyImage) {
            const scale = 1.2 + bounceCount * HEAD_SCALE_FACTOR;
            const imgWidth = ballRadius * 4 * scale;
            const imgHeight = imgWidth * (590 / 393);
            ctx.drawImage(diddyImage, x - imgWidth / 2, y - imgHeight / 2, imgWidth, imgHeight);
        }

    }, [frame, diddyImage]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
            <Audio src={staticFile('sounds/generated-audio.wav')} />
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
