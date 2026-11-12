# What we bumped into in Video.js

Notes from building this app on the timed metadata APIs, for Video.js maintainers and the blog post.

- **No cue enter or exit events.** `useCueEvents` diffs a track's active cues between renders, in about ten lines.
- **Active cues update on `timeupdate`.** That's about four times a second on a `<video>`, too coarse to judge a strum,
  so this media fires it every frame and strums are judged against `currentTime`.
- **A typed cue's `value` stays optional.** A track definition types `value`, but reads still have to check it's there.
- **App subtitles only toggle when the media has `textTracks`.** The canvas media keeps a detached `<video>` just to hold
  them, and nothing renders captions for a media that isn't a video, so the app draws its own lyrics.
- **`QualityRadioGroup` always adds "Auto".** The part menu hides it, since there's no automatic difficulty.
- **The same `src` with two formats is fetched twice.** `useCreateTextTrack` loads the notes file once per track.
- **`Hotkey` has no custom actions or keyup, and `Gesture` has only left, center, and right regions.** The game has its
  own keyboard and tap input.
- **The default skins bind 0 to 9 to `seekToPercent`.** That clashes with lane keys 1 to 5, so the game uses no skin.
- **`MediaSeekCapability` bundles the clock with seeking.** There's no way to say "has a clock but isn't seekable".
