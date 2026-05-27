function makeTiming(bpm) {
  const beat = 60000 / bpm

  return {
    B: beat,
    H: beat / 2,
    Q: beat / 4,
    E: beat / 8,
  }
}

const { B, H, Q, E } = makeTiming(140)

const colors = {
  white: { r: 255, g: 255, b: 255 },
  red: { r: 255, g: 0, b: 0 },
}

function brightnessFade(timestamp, ampStart, ampEnd, duration) {
  let cues = [];

  let steps = Math.floor(duration / E);

  for (let i = 0; i <= steps; i++) {
    const t = timestamp + (i * E);

    const progress = steps === 0 ? 1 : i / steps

    const amp = ampStart + (ampEnd - ampStart) * progress

    cues.push({t, amp});
  }

  return cues;
}

function fade(timestamp, colorStart, ampStart, colorEnd, ampEnd, duration) {
  let cues = [];

  let steps = Math.floor(duration / E);

  for (let i = 0; i <= steps; i++) {
    const t = timestamp + (i * E);

    const progress = steps === 0 ? 1 : i / steps

    const r = Math.round(colorStart.r + (colorEnd.r - colorStart.r) * progress)
    const g = Math.round(colorStart.g + (colorEnd.g - colorStart.g) * progress)
    const b = Math.round(colorStart.b + (colorEnd.b - colorStart.b) * progress)

    const amp = ampStart + (ampEnd - ampStart) * progress

    cues.push({t, color: { r, g, b }, amp });
  }

  return cues;
}

export { B, H, Q, E, colors, brightnessFade, fade }