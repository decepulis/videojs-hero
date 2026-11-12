import { useEffect, useState } from 'react';

/**
 * Every connected gamepad, with the buttons held and the axes pushed past halfway, for mapping a new guitar onto
 * `GUITAR_BUTTONS` in `use-guitar.ts`. Shown with `?pads` in the page's URL.
 */
export function PadsDebug() {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!window.isSecureContext) {
      setText('Gamepads need https or localhost.');
      return;
    }

    let frame = 0;
    const loop = () => {
      // A string, so React skips the render when nothing changed.
      setText(navigator.getGamepads().filter((pad) => pad !== null).map(describe).join('\n\n'));
      frame = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(frame);
  }, []);

  return <pre className="pads">{`${HELP}\n\n${text || 'No gamepads yet. Press a button on one.'}`}</pre>;
}

const HELP = [
  'Guitars with the standard layout (XInput, Santroller, CRKD Nitro) play as is.',
  'For another controller: press each fret, then strum up and down, and note the button numbers.',
  'The mapping is GUITAR_BUTTONS in src/use-guitar.ts; send the numbers along and we will add it.',
].join('\n');

function describe(pad: Gamepad): string {
  const buttons = pad.buttons.flatMap((button, index) => (button.pressed ? [index] : []));
  const axes = pad.axes.flatMap((value, index) => (Math.abs(value) > 0.5 ? [`${index}${value > 0 ? '+' : '-'}`] : []));

  return [
    `#${pad.index} ${pad.id}`,
    `mapping: ${pad.mapping || '(none)'}`,
    `buttons: ${buttons.join(' ') || '-'}`,
    `axes: ${axes.join(' ') || '-'}`,
  ].join('\n');
}
