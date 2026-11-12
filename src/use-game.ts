import { useActiveTextCues, useTextCues } from '@videojs/react';
import { usePlayer } from '@videojs/react/video';
import { useReducer, useRef } from 'react';

import { accuracy, INITIAL_SCORE, multiplier, scoreReducer } from './score';
import type { Lane } from './song';
import { notesTrack, solosTrack, starPowerTrack, sustainsTrack } from './tracks';
import { useCueEvents } from './use-cue-events';
import { useLaneKeys } from './use-lane-keys';

/** Play along: strum a lane as its note's cue passes the strike line, with keys 1 to 5 or the tap zones. */
export function useGame(clock: { readonly currentTime: number }) {
  const store = usePlayer();
  const notes = useTextCues(notesTrack);
  const starPower = useActiveTextCues(starPowerTrack).length > 0;
  const [state, dispatch] = useReducer(scoreReducer, INITIAL_SCORE);
  const held = useRef(new Set<Lane>());

  function press(lane: Lane) {
    // Active cues change only on `timeupdate`, but a strum can land between two of them, so judge it against the
    // media's clock right now.
    const time = clock.currentTime;
    const cue = notes.find(
      (cue) => cue.value?.lane === lane && !state.hits.has(cue) && cue.startTime <= time && time < cue.endTime
    );

    // A strum with no note to hit breaks the combo.
    if (!cue) {
      dispatch({ type: 'miss', lane, at: time });
      return;
    }

    // Only a hit note can be held.
    held.current.add(lane);
    store.selectAudioTrack('hit');
    dispatch({ type: 'hit', cue, lane, starPower, at: time });
  }

  function release(lane: Lane) {
    held.current.delete(lane);
  }

  useLaneKeys(press, release);

  // A note whose hit window passes without a hit is a miss: there's nothing to hold, and the part goes quiet.
  useCueEvents(notesTrack, {
    onExit(cue) {
      if (state.hits.has(cue) || !cue.value) return;

      held.current.delete(cue.value.lane);
      store.selectAudioTrack('missed');
      dispatch({ type: 'miss', lane: cue.value.lane, at: cue.endTime });
    },
  });

  // Holding a hit note to the end of its sustain earns a bonus.
  useCueEvents(sustainsTrack, {
    onExit(cue) {
      if (cue.value && held.current.has(cue.value.lane)) dispatch({ type: 'sustain', length: cue.value.length });
    },
  });

  useCueEvents(solosTrack, {
    onEnter: (cue) => dispatch({ type: 'banner', text: 'SOLO!', at: cue.startTime }),
    onExit: (cue) => dispatch({ type: 'banner', text: `Solo: ${accuracy(notes, state.hits, cue)}%`, at: cue.endTime }),
  });

  return { ...state, notes, starPower, multiplier: multiplier(state.combo), press, release };
}

export type Game = ReturnType<typeof useGame>;
