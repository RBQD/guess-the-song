import React, { useRef, useEffect, useState } from 'react';
import { useCurrentFrame, AbsoluteFill, staticFile } from 'remotion';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './GameEngine';

interface Note {
    name: string;
    midi: number;
    time: number;
    velocity: number;
    duration: number;
}

interface GuessTheSongProps {
    seed?: number;
}

export const GuessTheSong: React.FC<GuessTheSongProps> = ({ seed = 12345 }) => {
    const frame = useCurrentFrame();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 20, vy: -15 });
    const [diddyImage, setDiddyImage] = useState<HTMLImageElement | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const noteIndexRef = useRef(0);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Load the Diddy image
    useEffect(() => {
        const img = new Image();
        img.src = staticFile('/images/diddy.png');
        img.onload = () => setDiddyImage(img);
    }, []);

    // Load notes from JSON
    useEffect(() => {
        fetch(staticFile('sounds/VisiPiano.json'))
            .then(res => res.json())
            .then(data => {
                const notesFrom18 = data.tracks[0].notes.filter((note: Note) => note.time >= 18);
                const first50 = notesFrom18.slice(0, 50);
                setNotes(first50);
            })
            .catch(err => console.error('Failed to load notes:', err));
    }, []);

    const playNote = (note: Note) => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        const masterGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(masterGain);
        gain2.connect(masterGain);
        masterGain.connect(filter);
        filter.connect(ctx.destination);

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        const freq = 440 * Math.pow(2, (note.midi - 69) / 12);
        osc1.frequency.setValueAtTime(freq, ctx.currentTime);
        osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime); // octave

        // Low-pass filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 6, ctx.currentTime);
        filter.Q.setValueAtTime(2, ctx.currentTime);

        // Gains
        gain1.gain.setValueAtTime(note.velocity * 0.7, ctx.currentTime);
        gain2.gain.setValueAtTime(note.velocity * 0.3, ctx.currentTime);

        // Envelope on master
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01);
        masterGain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + note.duration * 0.2);
        masterGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.duration);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + note.duration);
        osc2.stop(ctx.currentTime + note.duration);
    };

    // Draw on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Reset ball position and velocity when video restarts (frame 0)
        if (frame === 0) {
            ballRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 20, vy: -15 };
            noteIndexRef.current = 0;
            audioCtxRef.current = null;
        }

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
            // Correct position
            const overlap = dist + ballRadius - radius;
            ball.x -= overlap * nx;
            ball.y -= overlap * ny;

            // Play note on bounce
            if (notes.length > 0) {
                playNote(notes[noteIndexRef.current]);
                noteIndexRef.current = (noteIndexRef.current + 1) % notes.length;
            }
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