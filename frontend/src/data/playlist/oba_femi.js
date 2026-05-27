import { B, H, Q, E, colors, brightnessFade, fade } from './../song_services';

const obaColors = {
  green: { r: 140, g: 255, b: 0 }
}

let song = {
    id: 'oba-femi',

    title: 'Oba Femi - Hands of Fate',
    artist: 'WWE, def rebel',

    audio: '/audio/oba-femi.mp3',

    suggestColor: obaColors.green,

    cues: [],
}

// Intro
let timestamp = 0;
song.cues.push(...[
  { t: timestamp, amp: 0, color: obaColors.green },
  { t: timestamp + B, amp: 0.2 },

  { t: timestamp + (B + H), amp: 1.0 },
  { t: timestamp + (2*B), amp: 0.2 },

  { t: timestamp + (2*B + H), amp: 1.0 },
  { t: timestamp + (3*B), amp: 0.2 },
  { t: timestamp + (3*B + H), amp: 0 },

  { t: timestamp + (4*B), amp: 1.0 },
  { t: timestamp + (5*B), amp: 0 },
]);
timestamp += 5*B;
song.cues.push(...[
  { t: timestamp + H, amp: 1.0 },
  { t: timestamp + (2*B), amp: 0.2 },

  { t: timestamp + (2*B + H), amp: 1.0 },
  { t: timestamp + (3*B), amp: 0.2 },
  { t: timestamp + (3*B + H), amp: 0 }
]);
timestamp += 4*B;

// Rising
song.cues.push(...[
  { t: timestamp + H, amp: 1.0 },
  { t: timestamp + (B + H), amp: 0.1 },
  ...Array.from({ length: 7 }, (_, i) => {
    const n = i + 2

    return [
      { t: timestamp + n * B, amp: 1.0 },
      { t: timestamp + (n * B + H), amp: 0.1 },
    ]
  }).flat(),
  { t: timestamp + (9*B), amp: 0.7, color: colors.white },
  { t: timestamp + (9*B + H), amp: 0, color: colors.white },
  { t: timestamp + (9*B + H + Q), amp: 0.1, color: colors.white }
]);
timestamp += 10*B;

// Revealing
song.cues.push({ t: timestamp, amp: 0, color: colors.white });
timestamp += B;
song.cues.push(...fade(timestamp, colors.white, 0, colors.white, 0.1, 3*B));
timestamp += 3*B;
// Silhouette
song.cues.push(...fade(timestamp, colors.white, 0.1, colors.white, 0.05, B + H + Q));
timestamp += B + H + Q;
song.cues.push(...fade(timestamp, colors.white, 0.05, colors.white, 0.2, 3*B + H));
timestamp += 3*B + H
song.cues.push(...fade(timestamp, colors.white, 0.2, { r: 165, g: 173, b: 255 }, 1.0, 4*B));
timestamp += 4*B;

// Entry flash
timestamp += B + Q;
song.cues.push(...[
  { t: timestamp + Q, amp: 1.0, color: colors.white },
  { t: timestamp + H, amp: 0, color: colors.white },
  { t: timestamp + H + Q, amp: 1.0 },
]);

// Walk to stage
timestamp += B + H;
for (let i=0; i<15; i++) {
  song.cues.push(...[
    { t: timestamp + (B + E), amp: 1.0 },
    { t: timestamp + (2*B + Q), amp: 0.4 },

    { t: timestamp + (3*B + Q + E), amp: 1.0 },
    { t: timestamp + (4*B + H), amp: 0.6 },
    
    { t: timestamp + (5*B + H + E), amp: 1.0 },
    { t: timestamp + (6*B + H + Q), amp: 0.3 },

    { t: timestamp + (7*B + H + Q + E), amp: 1.0 },
    { t: timestamp + (9*B), amp: 0.7 },
  ]);
  timestamp += 9*B;
}

// End change
timestamp += B;
song.cues.push(...fade(timestamp, obaColors.green, 0.7, colors.white, 0, B));
timestamp += B;
song.cues.push(...fade(timestamp, colors.white, 0, colors.white, 0.1, H));
timestamp += H;
song.cues.push(...fade(timestamp, colors.white, 0.1, { r: 165, g: 173, b: 255 }, 0.5, 4*B));
timestamp += 4*B + 25*B + H;

// Show end
song.cues.push(...[
  { t: timestamp + Q, amp: 0, color: colors.white },
  { t: timestamp + H, amp: 0.5, color: colors.white },
]);

export default song;