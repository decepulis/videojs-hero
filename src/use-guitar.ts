import { usePlayer } from '@videojs/react/video';
import { useEffect, useEffectEvent } from 'react';

import type { Lane } from './song';

/**
 * Which gamepad buttons a guitar's frets and strum bar are, for a guitar the browser reports with the `'standard'`
 * mapping: Xbox 360 (XInput) guitars, Santroller, and the CRKD Nitro in XInput mode.
 *
 * PS3, Wii, and other HID guitars report layouts of their own, and would need their own table here (and the
 * `'standard'` check below loosened). Open the page with `?pads` to see which buttons a guitar lights up.
 */
export const GUITAR_BUTTONS = {
  /** One per lane, in order. */
  frets: [
    0, // green: A
    1, // red: B
    3, // yellow: Y
    2, // blue: X
    4, // orange: LB
  ],
  /** The strum bar: d-pad up and down. */
  strum: [12, 13],
};

/**
 * Call `press` and `release` from a guitar controller, the way the real game plays: holding frets does nothing until a
 * strum, which plays every fret held, so chords work. Letting go of a fret lets go of its lane. Strums only count while
 * the song plays.
 */
export function useGuitar(press: (lane: Lane) => void, release: (lane: Lane) => void): void {
  const paused = usePlayer((state) => state.paused);

  // Each pad's buttons as of the last frame, to tell when one goes down or comes up.
  const poll = useEffectEvent((last: Map<number, boolean[]>) => {
    for (const pad of navigator.getGamepads()) {
      if (pad?.mapping !== 'standard') continue;

      const now = pad.buttons.map((button) => button.pressed);
      const before = last.get(pad.index) ?? [];
      last.set(pad.index, now);

      GUITAR_BUTTONS.frets.forEach((button, lane) => {
        if (before[button] && !now[button]) release(lane as Lane);
      });

      // A strum with no fret held plays nothing. The real game calls that an overstrum and breaks the combo; this one
      // forgives it.
      const strummed = GUITAR_BUTTONS.strum.some((button) => now[button] && !before[button]);
      if (!strummed || paused) continue;

      GUITAR_BUTTONS.frets.forEach((button, lane) => {
        if (now[button]) press(lane as Lane);
      });
    }
  });

  // An unplugged guitar never lets go of its frets.
  const releaseAll = useEffectEvent(() => {
    GUITAR_BUTTONS.frets.forEach((_, lane) => release(lane as Lane));
  });

  // Gamepads have no button events, so read them every frame, but only while one is plugged in.
  useEffect(() => {
    // Browsers only offer gamepads to secure pages: https, or localhost.
    if (!window.isSecureContext) return;

    const last = new Map<number, boolean[]>();
    let frame = 0;

    const loop = () => {
      poll(last);
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const connect = () => {
      if (!frame) loop();
    };
    const disconnect = (event: GamepadEvent) => {
      last.delete(event.gamepad.index);
      releaseAll();
      if (!navigator.getGamepads().some((pad) => pad?.connected)) stop();
    };

    if (navigator.getGamepads().some((pad) => pad?.connected)) connect();
    window.addEventListener('gamepadconnected', connect);
    window.addEventListener('gamepaddisconnected', disconnect);

    return () => {
      stop();
      window.removeEventListener('gamepadconnected', connect);
      window.removeEventListener('gamepaddisconnected', disconnect);
    };
  }, []);
}
