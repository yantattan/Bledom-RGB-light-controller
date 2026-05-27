import { ref } from 'vue'

export function useBLE() {
  const connected  = ref(false)
  const address    = ref(null)
  const scanning   = ref(false)
  const connecting = ref(false)
  const devices    = ref([])
  const error      = ref(null)

  async function fetchStatus() {
    try {
      const res  = await fetch('/api/status')
      const data = await res.json()
      connected.value = data.connected
      address.value   = data.address
    } catch (e) {
      error.value = 'Cannot reach backend'
    }
  }

  async function scan() {
    scanning.value = true
    devices.value  = []
    error.value    = null
    try {
      const res  = await fetch('/api/scan', { method: 'POST' })
      const data = await res.json()
      devices.value = data.devices
      if (!data.devices.length) error.value = 'No BLE devices found'
    } catch (e) {
      error.value = 'Scan failed — is the backend running?'
    } finally {
      scanning.value = false
    }
  }

  async function connect(addr) {
    connecting.value = true
    error.value      = null
    try {
      const res  = await fetch(`/api/connect/${encodeURIComponent(addr)}`, { method: 'POST' })
      const data = await res.json()
      connected.value = data.connected
      address.value   = data.success ? addr : null
      if (!data.success) error.value = data.error || 'Connection failed'
    } catch (e) {
      error.value = 'Connection request failed'
    } finally {
      connecting.value = false
    }
  }

  async function disconnect() {
    await fetch('/api/disconnect', { method: 'POST' }).catch(() => {})
    connected.value = false
    address.value   = null
    devices.value   = []
  }

  async function power(on) {
    await fetch(`/api/power/${on ? 'on' : 'off'}`, { method: 'POST' }).catch(() => {})
  }

  return { connected, address, scanning, connecting, devices, error, fetchStatus, scan, connect, disconnect, power }
}