import { ref, onUnmounted } from 'vue'

const SEND_INTERVAL = 100;

export function useAudio(colorRef) {
  const active    = ref(false)
  const amplitude = ref(0)
  const error     = ref(null)

  let ws       = null
  let audioCtx = null
  let analyser = null
  let stream   = null
  let animId   = null
  let lastSend = 0

  // ── WebSocket (sound mode only) ───────────────────────
  async function openWs() {
    if (ws?.readyState === WebSocket.OPEN) return;
    return new Promise(resolve => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${location.host}/ws`);
      ws.onopen = resolve;
    });
  }

  function closeWs() {
    ws?.close()
    ws = null
  }

  // ── Mic + AudioContext ────────────────────────────────
  async function start() {
    if (active.value) return
    error.value = null
    try {
      stream   = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      analyser = audioCtx.createAnalyser()
      analyser.fftSize               = 512
      analyser.smoothingTimeConstant = 0.75
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      await openWs()
      active.value = true
      loop()
    } catch (e) {
      error.value = e.name === 'NotAllowedError'
        ? 'Microphone permission denied'
        : 'Could not access microphone'
      console.error('[Audio]', e)
    }
  }

  function loop() {
    if (!active.value) return
    animId = requestAnimationFrame(loop)

    const buf = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(buf)

    let sum = 0
    for (const v of buf) sum += (v / 255) ** 2

    const raw = Math.sqrt(sum / buf.length)
    const alpha = 0.15;
    amplitude.value = amplitude.value * (1 - alpha) + raw * alpha;
    
    const threshold = 0.30;  // tune this: 0.05–0.15
    let rms = Math.max(0, raw - threshold);

    amplitude.value = amplitude.value * 0.8 + rms * 0.2;

    const now = Date.now()
    if (now - lastSend >= SEND_INTERVAL && ws?.readyState === WebSocket.OPEN) {
      lastSend = now
      ws.send(JSON.stringify({ amplitude: amplitude.value, color: colorRef.value }))
    }
  }

  function stop() {
    active.value    = false
    amplitude.value = 0
    if (animId) { cancelAnimationFrame(animId); animId = null }
    stream?.getTracks().forEach(t => t.stop())
    audioCtx?.close()
    closeWs()
    stream = audioCtx = analyser = null
  }

  // ── Static color — uses REST, never WebSocket ─────────
  // This avoids the sound loop race: WS is only for live amplitude streaming.
  async function sendStatic(color) {
    try {
      await fetch('/api/color', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(color),
      })
    } catch (e) {
      console.error('[Audio] sendStatic error:', e)
    }
  }

  onUnmounted(stop)

  return { active, amplitude, error, start, stop, sendStatic }
}