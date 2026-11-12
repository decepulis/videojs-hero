import { useEffect, useEffectEvent } from 'react';

import type { Lane } from './song';

/** Keys 1 to 5 play the five lanes, green to orange. Read by position, so any layout, and Shift, work the same. */
const LANE_KEYS = new Map<string, Lane>([
  ['Digit1', 0],
  ['Digit2', 1],
  ['Digit3', 2],
  ['Digit4', 3],
  ['Digit5', 4],
]);

/** Call `press` and `release` as the lane keys go down and up. */
export function useLaneKeys(press: (lane: Lane) => void, release: (lane: Lane) => void): void {
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    const lane = LANE_KEYS.get(event.code);
    if (lane === undefined || event.repeat) return;

    if (event.type === 'keydown') press(lane);
    else release(lane);
  });

  // A key let go while the window is in the background never sends its keyup.
  const releaseAll = useEffectEvent(() => {
    for (const lane of LANE_KEYS.values()) release(lane);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    const blur = () => releaseAll();

    window.addEventListener('keydown', listener);
    window.addEventListener('keyup', listener);
    window.addEventListener('blur', blur);

    return () => {
      window.removeEventListener('keydown', listener);
      window.removeEventListener('keyup', listener);
      window.removeEventListener('blur', blur);
    };
  }, []);
}
