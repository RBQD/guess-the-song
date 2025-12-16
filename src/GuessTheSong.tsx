import React, { useRef, useEffect, useState } from 'react';
import { useCurrentFrame, AbsoluteFill, staticFile } from 'remotion';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_DURATION_FRAMES } from './GameEngine';

// --- CONFIGURATION ---
const SONG_START_TIME = 23; // Seconds to skip at start of song
const NOTES_TO_LOAD = 300; // Number of notes to load into the game
const NOTES_PER_BOUNCE = 5; // How many notes to play simultaneously on each bounce
const NOTE_INCREMENT = 5; // How many notes to skip after each bounce
const BALL_INITIAL_VX = 10; // Higher initial horizontal speed for bigger bounces
const BALL_INITIAL_VY = 12; // Higher initial vertical speed for bigger bounces
const GRAVITY = 0.2 ;
const BALL_RADIUS = 25;
const CIRCLE_RADIUS = 450;
const BOUNCINESS = 2.0; // Perfect bounce - maintains same energy/speed
const HEAD_SCALE_FACTOR = 0.111; // How much to scale Diddy's head per bounce

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
    const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: BALL_INITIAL_VX, vy: BALL_INITIAL_VY });
    const [diddyImage, setDiddyImage] = useState<HTMLImageElement | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const noteIndexRef = useRef(0);
    const bounceCountRef = useRef(0);
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
                const notesFrom18 = data.tracks[0].notes.filter((note: Note) => note.time >= SONG_START_TIME);
                const first100 = notesFrom18.slice(0, NOTES_TO_LOAD);
                setNotes(first100);
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
            ballRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: BALL_INITIAL_VX, vy: BALL_INITIAL_VY };
            noteIndexRef.current = 0;
            bounceCountRef.current = 0;
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
        const ball = ballRef.current;
        const ballRadius = BALL_RADIUS;
        const gravity = GRAVITY;

        // Calculate scale for Diddy
        const scale = 1.2 + bounceCountRef.current * HEAD_SCALE_FACTOR;
        const effectiveRadius = ballRadius * 2 * scale; // Scale collision radius with head size

        // Apply gravity
        ball.vy += gravity;

        // Update ball position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Check collision with circle edge
        const dx = ball.x - centerX;
        const dy = ball.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist + effectiveRadius > radius) {
            // Reflect velocity with bounciness factor
            const nx = dx / dist;
            const ny = dy / dist;
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx -= BOUNCINESS * dot * nx;
            ball.vy -= BOUNCINESS * dot * ny;
            // Correct position
            const overlap = dist + effectiveRadius - radius;
            ball.x -= overlap * nx;
            ball.y -= overlap * ny;

            // Play 3 notes at once on bounce
            if (notes.length > 0) {
                // Play current note and the next 2 notes
                for (let i = 0; i < NOTES_PER_BOUNCE; i++) {
                    const noteIndex = (noteIndexRef.current + i) % notes.length;
                    playNote(notes[noteIndex]);
                }
                // Advance by 3 notes for next bounce
                noteIndexRef.current = (noteIndexRef.current + NOTE_INCREMENT) % notes.length;
            }
            // Increment bounce count
            bounceCountRef.current++;
        }

        // Draw ball (now Diddy image)
        if (diddyImage) {
            const scale = 1.2 + bounceCountRef.current * HEAD_SCALE_FACTOR;
            const imgWidth = ballRadius * 4 * scale;
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