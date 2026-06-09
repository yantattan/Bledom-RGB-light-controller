import { B, H, Q, E, colors, brightnessFade, fade } from '../song_services.js';

const kaneColors = {
  orange: { r: 255, g: 25, b: 0 },
  yellow: { r: 255, g: 65, b: 0 }
}

let song = {
    id: 'kane-burned',

    title: 'Kane - Burned',
    artist: 'WWE, Jim Johnston',

    audio: '/audio/kane-v1.mp3',

    suggestColor: colors.red,

    cues: [],
}

// Intro
let timestamp = 0;
song.cues.push({ t: timestamp, amp: 0, color: colors.red });
timestamp += B;
song.cues.push(...fade(timestamp, colors.red, 0.8, colors.red, 0.1, 5*B + H));
timestamp += 5*B + H;
song.cues.push(...fade(timestamp, colors.red, 0.1, colors.red, 0.4, 5*B + H));
timestamp += 5*B + H;
// Fire flash
song.cues.push(...[
  { t: timestamp + Q, amp: 1, color: kaneColors.yellow },
]);
// Flame effects
function flameEffect() {
  song.cues.push({ t: timestamp + H, amp: 0.5, color: kaneColors.orange });
  timestamp += 5*B;
  song.cues.push(...fade(timestamp, kaneColors.orange, 0.5, kaneColors.yellow, 1, 3*B));
  
  timestamp += 6*B;
  song.cues.push(...fade(timestamp, kaneColors.yellow, 1, colors.red, 0.3, B + H));
  timestamp += 6*B;
  song.cues.push(...fade(timestamp, colors.red, 0.4, kaneColors.orange, 0.5, B));
  timestamp += B;
}

for (let i=0; i<3; i++) flameEffect();

song.cues.pop();
timestamp += B;
song.cues.push(...[
  { t: timestamp, amp: 1, color: kaneColors.yellow },
  { t: timestamp + H, amp: 0.5, color: kaneColors.orange }
]);

timestamp += 3*B;
flameEffect();



// Show end
// song.cues.push(...[
//   { t: timestamp + Q, amp: 0, color: colors.white },
//   { t: timestamp + H, amp: 0.5, color: colors.white },
// ]);

export default song;