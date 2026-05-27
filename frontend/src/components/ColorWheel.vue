<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  rgb: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:rgb', 'commit'])

// ── Canvas setup ──────────────────────────────────────────
const canvas = ref(null)

const SIZE = 260
const RADIUS = SIZE / 2 - 6

// ── RGB ↔ HSL helpers ─────────────────────────────────────
function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min

    s = l > 0.5
      ? d / (2 - max - min)
      : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break

      case g:
        h = (b - r) / d + 2
        break

      case b:
        h = (r - g) / d + 4
        break
    }

    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function hslToRgb(h, s, l) {
  s /= 100
  l /= 100

  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)

  const f = n =>
    l - a * Math.max(
      -1,
      Math.min(k(n) - 3, Math.min(9 - k(n), 1))
    )

  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  }
}

// ── Internal HSL state ────────────────────────────────────
const hsl = ref(
  rgbToHsl(
    props.rgb.r,
    props.rgb.g,
    props.rgb.b,
  )
)

// sync external RGB → internal HSL
watch(
  () => props.rgb,
  (rgb) => {
    hsl.value = rgbToHsl(rgb.r, rgb.g, rgb.b)
  },
  { deep: true }
)

// ── Draw wheel ────────────────────────────────────────────
function drawWheel() {
  const ctx = canvas.value.getContext('2d')

  canvas.value.width = SIZE
  canvas.value.height = SIZE

  const cx = SIZE / 2
  const cy = SIZE / 2

  const img = ctx.createImageData(SIZE, SIZE)
  const d = img.data

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {

      const dx = x - cx
      const dy = y - cy

      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= RADIUS) {

        const h =
          ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360

        const s = (dist / RADIUS) * 100

        const rgb = hslToRgb(h, s, 50)

        const i = (y * SIZE + x) * 4

        d[i]     = rgb.r
        d[i + 1] = rgb.g
        d[i + 2] = rgb.b
        d[i + 3] = 255
      }
    }
  }

  ctx.putImageData(img, 0, 0)

  // outer ring
  ctx.beginPath()
  ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

// ── Cursor position ───────────────────────────────────────
const cursorPos = computed(() => {
  const angle = hsl.value.h * Math.PI / 180
  const dist = (hsl.value.s / 100) * RADIUS

  const cx = SIZE / 2
  const cy = SIZE / 2

  return {
    x: cx + Math.cos(angle) * dist,
    y: cy + Math.sin(angle) * dist,
  }
})

// ── Preview / hex ─────────────────────────────────────────
const previewBg = computed(() =>
  `rgb(${props.rgb.r}, ${props.rgb.g}, ${props.rgb.b})`
)

const hexColor = computed(() => {
  return `#${
    props.rgb.r.toString(16).padStart(2, '0')
  }${
    props.rgb.g.toString(16).padStart(2, '0')
  }${
    props.rgb.b.toString(16).padStart(2, '0')
  }`
})

// ── Emit RGB update ───────────────────────────────────────
function emitRgb() {
  emit(
    'update:rgb',
    hslToRgb(
      hsl.value.h,
      hsl.value.s,
      hsl.value.l,
    )
  )
}

// ── Pointer interaction ───────────────────────────────────
let draggingWheel = false

function getHSFromEvent(e) {

  const rect = canvas.value.getBoundingClientRect()

  const px = e.touches
    ? e.touches[0].clientX
    : e.clientX

  const py = e.touches
    ? e.touches[0].clientY
    : e.clientY

  const scaleX = SIZE / rect.width
  const scaleY = SIZE / rect.height

  const x = (px - rect.left) * scaleX
  const y = (py - rect.top) * scaleY

  const cx = SIZE / 2
  const cy = SIZE / 2

  const dx = x - cx
  const dy = y - cy

  const dist = Math.sqrt(dx * dx + dy * dy)

  return {
    h: ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360,
    s: Math.min(100, (dist / RADIUS) * 100),
  }
}

function onCanvasDown(e) {
  draggingWheel = true

  const { h, s } = getHSFromEvent(e)

  hsl.value.h = h
  hsl.value.s = s

  emitRgb()
}

function onWindowMove(e) {
  if (!draggingWheel) return

  const { h, s } = getHSFromEvent(e)

  hsl.value.h = h
  hsl.value.s = s

  emitRgb()
}

function onWindowUp() {
  if (!draggingWheel) return

  draggingWheel = false

  emit('commit')
}

// ── Sliders ───────────────────────────────────────────────
function onSlider(key, val) {
  hsl.value[key] = Number(val)
  emitRgb()
}

function onSliderCommit() {
  emit('commit')
}

// ── Slider styles ─────────────────────────────────────────
const satTrack = computed(() => ({
  background: `linear-gradient(
    to right,
    hsl(${hsl.value.h}, 0%, 50%),
    hsl(${hsl.value.h}, 100%, 50%)
  )`
}))

const ligTrack = computed(() => ({
  background: `linear-gradient(
    to right,
    hsl(${hsl.value.h}, ${hsl.value.s}%, 0%),
    hsl(${hsl.value.h}, ${hsl.value.s}%, 50%),
    hsl(${hsl.value.h}, ${hsl.value.s}%, 100%)
  )`
}))

onMounted(() => {
  drawWheel()

  window.addEventListener('mousemove', onWindowMove)
  window.addEventListener('mouseup', onWindowUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onWindowMove)
  window.removeEventListener('mouseup', onWindowUp)
})
</script>

<template>
  <div
    class="fade-up-1"
    style="
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:24px;
    "
  >

    <!-- Wheel -->
    <div
      style="position:relative; flex-shrink:0;"
      :style="{ filter: `drop-shadow(0 0 18px ${previewBg}55)` }"
    >

      <canvas
        ref="canvas"
        :width="SIZE"
        :height="SIZE"
        style="
          display:block;
          cursor:crosshair;
          border-radius:50%;
          width:260px;
          height:260px;
        "
        @mousedown="onCanvasDown"
        @touchstart.prevent="onCanvasDown"
        @touchmove.prevent="onWindowMove"
        @touchend="onWindowUp"
      />

      <!-- cursor -->
      <div
        :style="{
          position: 'absolute',
          left: cursorPos.x + 'px',
          top: cursorPos.y + 'px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          transform: 'translate(-50%,-50%)',
          background: previewBg,
          border: '3px solid white',
          boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 0 10px ${previewBg}88`,
          pointerEvents: 'none',
        }"
      ></div>

    </div>

    <!-- Preview -->
    <div style="display:flex; align-items:center; gap:12px;">

      <div
        :style="{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: previewBg,
          boxShadow: `0 0 16px ${previewBg}88`,
          border: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }"
      ></div>

      <div>

        <div
          class="mono"
          style="
            font-size:18px;
            font-weight:500;
            letter-spacing:0.04em;
          "
        >
          {{ hexColor }}
        </div>

        <div
          class="mono"
          style="
            font-size:10px;
            color:var(--text-muted);
          "
        >
          R:{{ props.rgb.r }}
          G:{{ props.rgb.g }}
          B:{{ props.rgb.b }}
        </div>

      </div>

    </div>

    <!-- Sliders -->
    <div
      style="
        width:100%;
        display:flex;
        flex-direction:column;
        gap:16px;
      "
    >

      <!-- Hue -->
      <div>

        <div
          style="
            display:flex;
            justify-content:space-between;
            margin-bottom:6px;
          "
        >
          <span
            style="
              font-size:10px;
              font-weight:600;
              letter-spacing:0.12em;
              color:var(--text-muted);
            "
          >
            HUE
          </span>

          <span class="mono"
            style="font-size:10px; color:var(--text-muted);"
          >
            {{ Math.round(hsl.h) }}°
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="360"
          :value="hsl.h"
          class="custom-range slider-hue"
          @input="e => onSlider('h', e.target.value)"
          @change="onSliderCommit"
        />

      </div>

      <!-- Saturation -->
      <div>

        <div
          style="
            display:flex;
            justify-content:space-between;
            margin-bottom:6px;
          "
        >
          <span
            style="
              font-size:10px;
              font-weight:600;
              letter-spacing:0.12em;
              color:var(--text-muted);
            "
          >
            SATURATION
          </span>

          <span class="mono"
            style="font-size:10px; color:var(--text-muted);"
          >
            {{ Math.round(hsl.s) }}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          :value="hsl.s"
          class="custom-range"
          :style="satTrack"
          @input="e => onSlider('s', e.target.value)"
          @change="onSliderCommit"
        />

      </div>

      <!-- Lightness -->
      <div>

        <div
          style="
            display:flex;
            justify-content:space-between;
            margin-bottom:6px;
          "
        >
          <span
            style="
              font-size:10px;
              font-weight:600;
              letter-spacing:0.12em;
              color:var(--text-muted);
            "
          >
            LIGHTNESS
          </span>

          <span class="mono"
            style="font-size:10px; color:var(--text-muted);"
          >
            {{ Math.round(hsl.l) }}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          :value="hsl.l"
          class="custom-range"
          :style="ligTrack"
          @input="e => onSlider('l', e.target.value)"
          @change="onSliderCommit"
        />

      </div>

    </div>

  </div>
</template>