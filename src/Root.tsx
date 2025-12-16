import { Composition } from 'remotion';
import { GuessTheSong } from './GuessTheSong';
import { FPS, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_DURATION_FRAMES } from './GameEngine';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="GuessTheSong"
                component={GuessTheSong}
                durationInFrames={GAME_DURATION_FRAMES}
                fps={FPS}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                defaultProps={{
                    seed: 12345
                }}
            />
            {/* Additional compositions with different seeds */}
            <Composition
                id="GuessTheSong-Alt1"
                component={GuessTheSong}
                durationInFrames={GAME_DURATION_FRAMES}
                fps={FPS}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                defaultProps={{
                    seed: 54321
                }}
            />
            <Composition
                id="GuessTheSong-Alt2"
                component={GuessTheSong}
                durationInFrames={GAME_DURATION_FRAMES}
                fps={FPS}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                defaultProps={{
                    seed: 99999
                }}
            />
        </>
    );
};
