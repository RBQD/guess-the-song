import { Audio, staticFile } from 'remotion';

export const GameAudio: React.FC = () => {
    return (
        <Audio
            src={staticFile("sounds/synthwave.mp3")}
            volume={0.5}
        />
    );
};
