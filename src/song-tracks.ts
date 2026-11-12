import { useCreateTextTrack } from '@videojs/react';

import { type Part, type Song, songFile } from './song';
import {
  lyricsTrack,
  notesTrack,
  sectionsTrack,
  solosTrack,
  starPowerTrack,
  sustainsTrack,
  toNoteCues,
  toSustainCues,
} from './tracks';

/** Add the chart's tracks to the player. A new part swaps in its own notes, Star Power, and solos. */
export function SongTracks({ song, part }: { song: Song; part: Part }): null {
  const notesFile = songFile(part.notes);
  const starPower = song.tracks.starPower[part.instrument];
  const solos = song.tracks.solos[part.instrument];

  // One notes file, read two ways: a cue per note to hit, and a cue per sustain to hold.
  useCreateTextTrack(notesTrack, { src: notesFile, format: toNoteCues });
  useCreateTextTrack(sustainsTrack, { src: notesFile, format: toSustainCues });

  // The rest are JSON cue lists, which the player loads without a `format`.
  useCreateTextTrack(sectionsTrack, { src: songFile(song.tracks.sections) });
  useCreateTextTrack(lyricsTrack, { src: songFile(song.tracks.lyrics) });

  // Hooks can't be conditional, so a part with no Star Power or solos gets empty tracks.
  useCreateTextTrack(starPowerTrack, { src: starPower ? songFile(starPower) : undefined });
  useCreateTextTrack(solosTrack, { src: solos ? songFile(solos) : undefined });

  return null;
}
