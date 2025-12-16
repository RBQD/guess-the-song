const fs = require('fs');
const path = require('path');
const { WaveFile } = require('wavefile');

// Constants
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const FPS = 60;
const GAME_DURATION_FRAMES = 30 * FPS;
const SONG_START_TIME = 23;
const NOTES_TO_LOAD = 300;
const NOTES_PER_BOUNCE = 5;
const NOTE_INCREMENT = 5;
const BALL_INITIAL_VX = 10;
const BALL_INITIAL_VY = 12;
const GRAVITY = 0.2;
const BALL_RADIUS = 25;
const CIRCLE_RADIUS = 450;
const BOUNCINESS = 2.0;
const HEAD_SCALE_FACTOR = 0.111;

// Paths
const JSON_PATH = path.join(__dirname, 'public/sounds/VisiPiano.json');
const AUDIO_OUT_PATH = path.join(__dirname, 'public/sounds/generated-audio.wav');
const DATA_OUT_PATH = path.join(__dirname, 'src/simulation-data.json');

// Load Notes
const rawData = fs.readFileSync(JSON_PATH);
const data = JSON.parse(rawData);
const notesFrom18 = data.tracks[0].notes.filter(note => note.time >= SONG_START_TIME);
const notes = notesFrom18.slice(0, NOTES_TO_LOAD);

// Simulation State
let ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: BALL_INITIAL_VX, vy: BALL_INITIAL_VY };
let noteIndex = 0;
let bounceCount = 0;
const simulationData = [];
const audioEvents = [];

const centerX = CANVAS_WIDTH / 2;
const centerY = CANVAS_HEIGHT / 2;
const radius = CIRCLE_RADIUS;

// Run Simulation
for (let frame = 0; frame < GAME_DURATION_FRAMES; frame++) {
    // Store position
    simulationData.push({ x: ball.x, y: ball.y, bounceCount });

    // Physics
    const scale = 1.2 + bounceCount * HEAD_SCALE_FACTOR;
    const effectiveRadius = BALL_RADIUS * 2 * scale;

    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;

    const dx = ball.x - centerX;
    const dy = ball.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist + effectiveRadius > radius) {
        // Bounce
        const nx = dx / dist;
        const ny = dy / dist;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= BOUNCINESS * dot * nx;
        ball.vy -= BOUNCINESS * dot * ny;

        const overlap = dist + effectiveRadius - radius;
        ball.x -= overlap * nx;
        ball.y -= overlap * ny;

        // Audio Event
        if (notes.length > 0) {
            const notesToPlay = [];
            for (let i = 0; i < NOTES_PER_BOUNCE; i++) {
                const idx = (noteIndex + i) % notes.length;
                notesToPlay.push(notes[idx]);
            }
            audioEvents.push({
                frame: frame,
                time: frame / FPS,
                notes: notesToPlay
            });
            noteIndex = (noteIndex + NOTE_INCREMENT) % notes.length;
        }
        bounceCount++;
    }
}

// Generate Audio
const sampleRate = 44100;
const numChannels = 1; // Mono is easier, stereo if needed
const totalSamples = Math.ceil((GAME_DURATION_FRAMES / FPS) * sampleRate);
const audioBuffer = new Float32Array(totalSamples);

function addNote(buffer, note, startTime) {
    const startSample = Math.floor(startTime * sampleRate);
    const duration = note.duration;
    const lengthSamples = Math.floor(duration * sampleRate);
    
    const freq = 440 * Math.pow(2, (note.midi - 69) / 12);
    const freq2 = freq * 2;
    
    for (let i = 0; i < lengthSamples; i++) {
        const idx = startSample + i;
        if (idx >= buffer.length) break;
        
        const t = i / sampleRate;
        
        // Sawtooth approximation
        // osc1
        const osc1 = 2 * ((t * freq) % 1) - 1;
        // osc2
        const osc2 = 2 * ((t * freq2) % 1) - 1;
        
        // Envelope
        let gain = 0;
        if (t < 0.01) {
            gain = t / 0.01; // Attack
        } else if (t < duration * 0.2) {
            // Decay to 0.3
            // Linear approx for simplicity or exponential
            // Using simple linear interpolation for robustness
            const progress = (t - 0.01) / (duration * 0.2 - 0.01);
            gain = 1 - progress * 0.7; 
        } else {
            // Decay to 0.01
            const progress = (t - duration * 0.2) / (duration - duration * 0.2);
            gain = 0.3 - progress * 0.29;
        }
        if (gain < 0) gain = 0;

        // Mix
        const sample = (osc1 * 0.7 + osc2 * 0.3) * gain * note.velocity * 0.5; // 0.5 master volume
        
        buffer[idx] += sample;
    }
}

audioEvents.forEach(event => {
    event.notes.forEach(note => {
        addNote(audioBuffer, note, event.time);
    });
});

// Normalize/Clip
for (let i = 0; i < audioBuffer.length; i++) {
    if (audioBuffer[i] > 1) audioBuffer[i] = 1;
    if (audioBuffer[i] < -1) audioBuffer[i] = -1;
}

// Create WAV
const wav = new WaveFile();
wav.fromScratch(1, sampleRate, '32f', audioBuffer);
fs.writeFileSync(AUDIO_OUT_PATH, wav.toBuffer());
fs.writeFileSync(DATA_OUT_PATH, JSON.stringify(simulationData));

console.log('Audio and simulation data generated.');
