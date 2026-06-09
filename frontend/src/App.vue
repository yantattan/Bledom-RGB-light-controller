<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import DeviceBar        from './components/DeviceBar.vue'
import ColorWheel       from './components/ColorWheel.vue'
import ModePanel        from './components/ModePanel.vue'
import { useBLE         } from './composables/useBLE.js'
import { useAudio       } from './composables/useAudio.js'
import { useMusicEffects } from './composables/useMusicEffects.js'
import { usePlaylists } from './composables/usePlaylists.js'

// ── Shared state ──────────────────────────────────────────
const mode = ref('static')
const rgb = ref({ r: 0, g: 191, b: 255 })
const staticRgb = ref({ ...rgb.value })

// ── BLE ───────────────────────────────────────────────────
const ble = useBLE()
onMounted(async () => {
  ble.fetchStatus();
  await playlists.load();
})

const rgbColor = computed(() => rgb.value)

// ── Composables ───────────────────────────────────────────
const audio = useAudio(rgbColor)
const music = useMusicEffects(rgbColor)
const playlists = usePlaylists()

// ── Mode switching ────────────────────────────────────────
watch(mode, async (newMode, oldMode) => {
  // Tear down the previous mode
  if (oldMode === 'sound') await audio.stop()
  if (oldMode === 'music') await music.stop()

  if (newMode === 'sound') {
    await audio.start()
  } else if (newMode === 'music') {
    // Music panel starts playback on song selection — nothing to do here
  } else {
    // Static: send current color immediately
    rgb.value = { ...staticRgb.value }
    await audio.sendStatic(rgb.value)
  }
})

// ── Color commit (wheel/slider released) ──────────────────
function onColorCommit() {
  if (mode.value === 'static') {
    staticRgb.value = { ...rgb.value }

    audio.sendStatic(rgb.value)
  }
}

// ── PWR ON / PWR OFF from DeviceBar ──────────────────────
async function onSetColor(rgb) {
  if (mode.value === 'sound') { 
    await audio.stop(); 
    mode.value = 'static' 
  }
  if (mode.value === 'music') { 
    await music.stop(); 
    mode.value = 'static' 
  }
  await audio.sendStatic(rgb)
}

// ── Music events from ModePanel ───────────────────────────
async function onMusicPlay(song) {
  mode.value = 'music'
  if (song.suggestColor) {
    rgb.value = { ...song.suggestColor }
  }
  await music.play(song)
}

async function onMusicPause() {
  await music.pause()
}
async function onMusicSeek({ song, pct }) {
  console.log(song, pct);
  await music.seek(song, pct)
}
</script>

<template>
  <div style="
    display: flex; flex-direction: column; height: 100vh;
    background: var(--bg); overflow: hidden; position: relative;
  ">
    <!-- Decorative grid -->
    <div style="
      position: fixed; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(var(--border) 1px, transparent 1px),
        linear-gradient(90deg, var(--border) 1px, transparent 1px);
      background-size: 40px 40px; opacity: 0.3;
    "></div>

    <DeviceBar :ble="ble" @set-color="onSetColor" />

    <main style="
      display: grid; grid-template-columns: 1fr 340px;
      flex: 1; overflow: hidden; position: relative;
    ">
      <!-- Left: Color picker -->
      <div style="
        padding: 32px 40px; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        border-right: 1px solid var(--border); overflow-y: auto;
      ">
        <div style="
          font-size:10px; font-weight:700; letter-spacing:0.16em;
          color:var(--text-muted); align-self:flex-start; margin-bottom:24px;
        ">COLOR PICKER</div>
        <ColorWheel
          v-model:rgb="rgb"
          @commit="onColorCommit"
          style="width:100%; max-width:320px;"
        />
      </div>

      <!-- Right: Mode panel -->
      <div style="padding:28px 24px; display:flex; flex-direction:column; overflow-y:auto; background:var(--panel);">
        <ModePanel
          :mode="mode"
          :amplitude="audio.amplitude.value"
          :audio-active="audio.active.value"
          :audio-error="audio.error.value"
          :color="rgbColor"
          :connected="ble.connected.value"
          :music="music"
          :songs="playlists.songs.value"
          @mode-change="m => mode = m"
          @music-play="onMusicPlay"
          @music-pause="onMusicPause"
          @music-seek="onMusicSeek"
        />
      </div>
    </main>

    <!-- Footer -->
    <footer style="
      display:flex; align-items:center; gap:16px; padding:7px 20px;
      background:var(--panel); border-top:1px solid var(--border);
      font-size:10px; color:var(--text-muted); letter-spacing:0.06em;
    ">
      <div class="mono" style="display:flex; align-items:center; gap:6px;">
        <span :style="{
          display:'inline-block', width:'5px', height:'5px', borderRadius:'50%',
          background: ble.connected.value ? 'var(--green)' : 'var(--red)',
        }"></span>
        BLE {{ ble.connected.value ? 'CONNECTED' : 'DISCONNECTED' }}
      </div>
      <div style="width:1px; height:12px; background:var(--border);"></div>
      <div class="mono">MODE: {{ mode.toUpperCase() }}</div>
      <div style="width:1px; height:12px; background:var(--border);"></div>
      <div class="mono">
        <template v-if="mode === 'music' && music.playing.value">
          ♪ {{ music.currentSong.value?.title }}
        </template>
        <template v-else>
          WS: {{ audio.active.value ? 'STREAMING' : 'IDLE' }}
        </template>
      </div>
      <div style="flex:1;"></div>
      <div class="mono" style="color:var(--border-bright);">BLEDOM SOUND TUNER v1.0</div>
    </footer>
  </div>
</template>