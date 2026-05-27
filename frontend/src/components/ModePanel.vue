<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import MusicPanel from './MusicPanel.vue'

const props = defineProps({
  mode:        { type: String,  default: 'static' },
  amplitude:   { type: Number,  default: 0 },
  audioActive: { type: Boolean, default: false },
  audioError:  { type: String,  default: null },
  color:       { type: Object,  default: () => ({ r: 255, g: 255, b: 255 }) },
  connected:   { type: Boolean, default: false },
  music:       { type: Object,  required: true },
})

const emit = defineEmits(['mode-change', 'music-play', 'music-pause', 'music-seek'])

const colorCss = computed(() => `rgb(${props.color.r}, ${props.color.g}, ${props.color.b})`)

// ── Visualizer canvas ────────────────────────────────────
const barCanvas = ref(null)
let animId = null
const history = new Float32Array(80)
let histIdx = 0

function drawViz() {
  animId = requestAnimationFrame(drawViz)
  const canvas = barCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  history[histIdx++ % history.length] = props.amplitude
  ctx.clearRect(0, 0, W, H)
  const barW = W / history.length
  for (let i = 0; i < history.length; i++) {
    const v  = history[(histIdx + i) % history.length]
    const bH = Math.max(2, v * H * 0.9)
    ctx.fillStyle = `rgba(${props.color.r},${props.color.g},${props.color.b},${0.15 + v * 0.7})`
    ctx.fillRect(i * barW, H - bH, barW - 1, bH)
  }
  if (props.amplitude > 0.01) {
    const y = H - props.amplitude * H * 0.9
    ctx.strokeStyle = colorCss.value
    ctx.lineWidth   = 1
    ctx.globalAlpha = 0.4
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    ctx.globalAlpha = 1
  }
}

onMounted(() => {
  if (barCanvas.value) {
    barCanvas.value.width  = barCanvas.value.offsetWidth  || 320
    barCanvas.value.height = barCanvas.value.offsetHeight || 80
  }
  drawViz()
})
onUnmounted(() => cancelAnimationFrame(animId))

// ── Mode button helper ────────────────────────────────────
const MODES = [
  {
    id:    'static',
    label: 'STATIC',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill="COLOR"/>
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="COLOR" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    activeColor: () => colorCss.value,
  },
  {
    id:    'sound',
    label: 'SOUND',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 18V6l11-3v12" stroke="COLOR" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="6" cy="18" r="3" fill="COLOR" opacity="0.8"/>
      <circle cx="17" cy="15" r="3" fill="COLOR" opacity="0.5"/>
    </svg>`,
    activeColor: () => 'var(--accent)',
  },
  {
    id:    'music',
    label: 'LIGHT SHOW',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.7l-4.9 2.5.9-5.5-4-3.9 5.5-.8L12 3z"
        stroke="COLOR" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`,
    activeColor: () => 'var(--accent)',
  },
]
</script>

<template>
  <div class="flex flex-col gap-5 h-full">

    <!-- Label -->
    <p class="text-[10px] font-bold tracking-[0.16em] text-dim uppercase">Light Mode</p>

    <!-- Mode buttons (3-column grid) -->
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="m in MODES" :key="m.id"
        @click="emit('mode-change', m.id)"
        :class="[
          'flex flex-col items-center gap-2 py-4 px-2 rounded-xl border transition-all duration-200 cursor-pointer',
          mode === m.id
            ? 'border-accent bg-accent/10 shadow-[0_0_16px_rgba(124,92,252,0.15)]'
            : 'border-line-bright bg-panel hover:border-accent/30'
        ]"
        :style="mode === m.id && m.id === 'static' ? {
          border: `1px solid ${colorCss}`,
          background: `rgba(${color.r},${color.g},${color.b},0.1)`,
          boxShadow: `0 0 20px rgba(${color.r},${color.g},${color.b},0.2)`
        } : {}"
      >
        <!-- SVG icon — color swapped via v-html + replace -->
        <span
          :style="{ opacity: mode === m.id ? 1 : 0.3 }"
          v-html="m.icon.replaceAll('COLOR', mode === m.id ? m.activeColor() : 'var(--text-muted)')"
        ></span>
        <span class="text-[10px] font-bold tracking-[0.08em] font-sans"
              :style="{ color: mode === m.id ? m.activeColor() : 'var(--text-muted)' }">
          {{ m.label }}
        </span>
      </button>
    </div>

    <!-- ── STATIC panel ───────────────────────────────── -->
    <div v-if="mode === 'static'" class="rounded-lg bg-panel border border-line p-4 text-center">
      <div class="w-12 h-12 rounded-full mx-auto mb-2.5 border-2 border-white/10 transition-all duration-200"
           :style="{
             background: colorCss,
             boxShadow: `0 0 24px rgba(${color.r},${color.g},${color.b},0.5)`
           }">
      </div>
      <p class="text-[11px] text-dim tracking-[0.06em]">Lights set to selected color</p>
      <p v-if="!connected" class="mt-2 text-[10px] text-danger/70">⚠ Connect a device first</p>
    </div>

    <!-- ── SOUND panel ────────────────────────────────── -->
    <div v-if="mode === 'sound'" class="flex flex-col gap-3">
      <!-- Status -->
      <div class="flex items-center gap-2">
        <span :class="audioActive ? 'bg-success shadow-[0_0_6px_#00d68f]' : 'bg-dim'"
              class="w-1.5 h-1.5 rounded-full flex-none transition-all duration-300"></span>
        <span class="font-mono text-[10px] text-dim">
          {{ audioActive ? 'MICROPHONE ACTIVE' : 'STARTING MIC…' }}
        </span>
      </div>
      <!-- Error -->
      <div v-if="audioError"
           class="text-[11px] text-danger bg-danger/8 border border-danger/20 rounded-lg px-2.5 py-1.5">
        ⚠ {{ audioError }}
      </div>
      <!-- Waveform canvas -->
      <div class="relative bg-panel border border-line rounded-lg overflow-hidden h-20">
        <canvas ref="barCanvas" class="w-full h-full block"/>
        <div v-if="!audioActive && !audioError"
             class="absolute inset-0 grid place-items-center font-mono text-[11px] text-dim tracking-[0.08em]">
          WAITING FOR MIC…
        </div>
      </div>
      <!-- Amplitude meter -->
      <div class="flex items-center gap-3">
        <span class="text-[10px] text-dim tracking-[0.1em] uppercase flex-none">Amplitude</span>
        <div class="flex-1 h-1 bg-line rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-[40ms]"
               :style="{
                 width: amplitude * 100 + '%',
                 background: colorCss,
                 boxShadow: `0 0 8px ${colorCss}`,
               }">
          </div>
        </div>
        <span class="font-mono text-[10px] text-dim w-9 text-right">{{ Math.round(amplitude * 100) }}%</span>
      </div>
    </div>

    <!-- ── MUSIC (Light Show) panel ───────────────────── -->
    <MusicPanel
      v-if="mode === 'music'"
      :music="music"
      :connected="connected"
      @play="s => emit('music-play', s)"
      @pause="emit('music-pause')"
      @seek="p => emit('music-seek', p)"
    />

    <!-- Connection hint -->
    <div v-if="!connected"
         class="mt-auto rounded-lg bg-accent/5 border border-accent/20 px-3 py-2.5 text-[11px] text-dim leading-relaxed">
      💡 Use <strong class="text-accent">SCAN</strong> in the top bar to connect your BLEDOM device.
    </div>

  </div>
</template>