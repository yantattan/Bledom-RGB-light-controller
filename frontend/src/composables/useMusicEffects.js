import { ref, onUnmounted } from 'vue'

export function useMusicEffects(colorRef) {
  const playing = ref(false)
  const paused = ref(false)

  const currentSong = ref(null)
  const progress = ref(0)

  let ws = null
  let audio = null
  let animationFrame = null

  let nextCueIndex = 0
  let playbackId = 0

  function stopRenderLoop() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
  }

  // ─────────────────────────────
  // WebSocket
  // ─────────────────────────────

  async function openWs() {
    if (ws?.readyState === WebSocket.OPEN) return;

    return new Promise(resolve => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      ws = new WebSocket(`${proto}//${location.host}/ws`)
      ws.onopen = resolve
    })
  }

  function closeWs() {
    ws?.close()
    ws = null
  }

  // ─────────────────────────────
  // Send frame
  // ─────────────────────────────

  function sendFrame(cue) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const base = cue.color ?? colorRef.value

    ws.send(JSON.stringify({
      amplitude: cue.amp ?? 1,
      color: {
        r: base.r ?? 255,
        g: base.g ?? 255,
        b: base.b ?? 255,
      },
    }))
  }

  // ─────────────────────────────
  // Core loop
  // ─────────────────────────────

  function renderLoop(myPlaybackId) {
    if (myPlaybackId !== playbackId) return
    if (!playing.value || paused.value) return
    if (!audio || !currentSong.value) return

    const song = currentSong.value

    const currentMs = audio.currentTime * 1000
    const durationMs = audio.duration * 1000 || 1

    progress.value = audio.duration
    ? currentMs / durationMs
    : 0

    const cues = song.cues;

    while (nextCueIndex < cues.length && cues[nextCueIndex].t <= currentMs) {
      sendFrame(cues[nextCueIndex]);
      nextCueIndex++;
    }

    stopRenderLoop();
    animationFrame = requestAnimationFrame(() => renderLoop(myPlaybackId));
  }

  function getNextCueIndex(song, currentMs) {
    return song.cues.findIndex(cue => cue.t > currentMs)
  }

  // ─────────────────────────────
  // PLAY
  // ─────────────────────────────

  async function play(song = null) {
    // Resume existing paused song
    if (paused.value && audio) {
      playbackId++
      const myPlaybackId = playbackId

      paused.value = false
      playing.value = true

      await openWs()
      await audio.play()

      stopRenderLoop()
      renderLoop(myPlaybackId)
      return
    }

    await stop()

    playbackId++
    const myPlaybackId = playbackId

    currentSong.value = song
    audio = new Audio(song.audio)

    playing.value = true
    paused.value = false
    progress.value = 0

    await audio.play()
    nextCueIndex = getNextCueIndex(song, audio.currentTime * 1000)

    await openWs()

    stopRenderLoop()
    renderLoop(myPlaybackId)

    audio.onended = () => stop()
  }

  // ─────────────────────────────
  // PAUSE (DO NOT RESET)
  // ─────────────────────────────

  async function pause() {
    if (!audio) return

    paused.value = true
    playing.value = false

    audio.pause()
    playbackId++;

    sendFrame({
      amp: 0,
      color: colorRef.value,
    })

    closeWs()
    cancelAnimationFrame(animationFrame)
  }

  // ─────────────────────────────
  // SEEK
  // ─────────────────────────────

  async function seek(song, pct) {
    if (!audio || !song) return

    const durationMs = audio.duration * 1000 || 0
    const targetMs = durationMs * pct

    audio.currentTime = targetMs / 1000

    progress.value = targetMs / durationMs
    
    nextCueIndex = getNextCueIndex(song, audio.currentTime * 1000)

    if (!paused.value) {
      stopRenderLoop()
      renderLoop(playbackId)
    }
  }

  // ─────────────────────────────
  // STOP (hard reset)
  // ─────────────────────────────

  async function stop() {
    playing.value = false
    paused.value = false

    cancelAnimationFrame(animationFrame)

    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }

    audio = null

    progress.value = 0
    currentSong.value = null
    nextCueIndex = 0
    playbackId++;

    closeWs();
  }

  onUnmounted(stop)

  return {
    playing,
    paused,
    currentSong,
    progress,

    play,
    pause,
    seek,
    stop,
  }
}