import './styles.css';
import './theme.css';
import { Container } from '@videojs/react';
import { VideoPlayer } from '@videojs/react/video';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ChartMedia } from './chart-media';
import { ChartMediaView } from './chart-media-view';
import { ControlBar } from './controls';
import { Banner, Hud, Lanes, Lyrics, Results, TitleCard } from './overlays';
import { SONG_URL } from './song';
import { SongTracks } from './song-tracks';
import { useGame } from './use-game';

// The song plays through a media of its own, which the player drives like a `<video>`.
const media = new ChartMedia();

media.src = SONG_URL;

function App() {
  const { song, part, run } = useChart(media);

  return (
    // No skin: the game draws its own UI, and owns the keyboard.
    <VideoPlayer>
      <main className="guitar-hero">
        <Container className="stage">
          <div className="screen">
            <ChartMediaView media={media} className="highway" />
            {song && part && (
              <>
                <SongTracks song={song} part={part} />
                {/* A new part, or playing the song again from the start, starts a new game. */}
                <Game key={`${part.id}:${run}`} clock={media} />
                <TitleCard song={song} />
              </>
            )}
          </div>
          {song && <ControlBar song={song} />}
        </Container>
        {song && <p className="credits">{song.credits}</p>}
      </main>
    </VideoPlayer>
  );
}

function Game({ clock }: { clock: ChartMedia }) {
  const game = useGame(clock);

  return (
    <>
      <Hud game={game} />
      <Banner banner={game.banner} />
      <Lyrics />
      <Lanes game={game} />
      <Results game={game} />
    </>
  );
}

/**
 * The song once it loads, the part being played, which the quality menu picks, and a count of runs, which goes up each
 * time the song plays from the start.
 */
function useChart(media: ChartMedia) {
  const [chart, setChart] = useState({ song: media.song, part: media.part });
  const [run, setRun] = useState(0);

  useEffect(() => {
    const update = () => setChart({ song: media.song, part: media.part });
    const restart = () => {
      if (media.currentTime === 0) setRun((run) => run + 1);
    };

    media.addEventListener('partchange', update);
    media.addEventListener('play', restart);

    return () => {
      media.removeEventListener('partchange', update);
      media.removeEventListener('play', restart);
    };
  }, [media]);

  return { ...chart, run };
}

createRoot(document.getElementById('root')!).render(<App />);
