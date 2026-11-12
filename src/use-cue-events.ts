import { type MediaTextCue, type TextTrackDefinition, useActiveTextCues, useTextCues } from '@videojs/react';
import { usePlayer } from '@videojs/react/video';
import { useEffect, useEffectEvent, useRef } from 'react';

export interface CueEvents<Cue> {
  onEnter?: (cue: Cue) => void;
  onExit?: (cue: Cue) => void;
}

/** Call `onEnter` as each cue on a track starts, and `onExit` as it ends. */
export function useCueEvents<Cue extends MediaTextCue>(track: TextTrackDefinition<Cue>, events: CueEvents<Cue>): void {
  const cues = useTextCues(track);
  const active = useActiveTextCues(track);
  const seeking = usePlayer((state) => state.seeking);
  const previous = useRef({ cues, active });

  const enter = useEffectEvent((cue: Cue) => events.onEnter?.(cue));
  const exit = useEffectEvent((cue: Cue) => events.onExit?.(cue));

  useEffect(() => {
    const last = previous.current;

    previous.current = { cues, active };

    // A seek jumps over cues rather than playing them, and a new set of cues, such as another difficulty's notes,
    // starts fresh rather than ending every cue of the old one.
    if (seeking || cues !== last.cues) return;

    // While the track is unchanged, its cue list and the cues in it keep their identity, so comparing the active cues
    // before and after finds the ones that ended and the ones that started.
    for (const cue of last.active) {
      if (!active.includes(cue)) exit(cue);
    }

    for (const cue of active) {
      if (!last.active.includes(cue)) enter(cue);
    }
  }, [cues, active, seeking]);
}
