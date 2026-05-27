<script setup>
import { ref, defineEmits } from 'vue'

const props = defineProps({
  ble: Object
})

const showDevices = ref(false)

const emit = defineEmits(['set-color'])

async function doScan() {
  showDevices.value = true
  await props.ble.scan()
}

async function doConnect(addr) {
  showDevices.value = false
  await props.ble.connect(addr)
}

function closeDropdown() {
  showDevices.value = false
}
</script>

<template>
  <!-- Wrapper creates isolated stacking context -->
  <div class="device-bar-wrapper">
    <!-- ── Top bar ─────────────────────────────────────────── -->
    <header class="fade-up device-bar">
      <!-- Logo / title -->
      <div style="display:flex; align-items:center; gap:10px; flex:0 0 auto;">
        <div style="
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--accent-dim); border: 1px solid var(--accent);
          display: grid; place-items: center; font-size: 16px;
        ">💡</div>
        <div>
          <div style="font-size:13px; font-weight:700; letter-spacing:0.12em; color:var(--text);">
            BLEDOM
          </div>
          <div class="mono" style="font-size:9px; color:var(--text-muted); letter-spacing:0.06em;">
            SOUND TUNER
          </div>
        </div>
      </div>

      <div style="width:1px; height:28px; background:var(--border); flex-shrink:0;"></div>

      <!-- Connection status -->
      <div style="display:flex; align-items:center; gap:8px; flex:1;">
        <div :style="{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: ble.connected.value ? 'var(--green)' : 'var(--text-muted)',
          boxShadow: ble.connected.value ? '0 0 8px var(--green)' : 'none',
          transition: 'all 0.3s',
          flexShrink: 0
        }"></div>

        <span class="mono" style="font-size:11px; color:var(--text-muted);">
          {{ ble.connected.value ? ble.address.value : 'NOT CONNECTED' }}
        </span>
      </div>

      <!-- Error badge -->
      <div
        v-if="ble.error.value"
        style="
          font-size:11px;
          color: var(--red);
          background: rgba(255,77,109,0.08);
          border: 1px solid rgba(255,77,109,0.25);
          border-radius: 6px;
          padding: 3px 10px;
          flex-shrink: 0;
        "
      >
        {{ ble.error.value }}
      </div>

      <!-- Connected buttons -->
      <template v-if="ble.connected.value">
        <button @click="emit('set-color', { r: 255, g: 255, b: 255 })" class="action-btn green">
          PWR ON
        </button>

        <button @click="emit('set-color', { r: 0, g: 0, b: 0 })" class="action-btn red">
          PWR OFF
        </button>
        
        <button @click="ble.disconnect()" class="action-btn neutral">DISCONNECT</button>
      </template>

      <!-- Scan button -->
      <template v-else>
        <button
          @click="doScan"
          :disabled="ble.scanning.value"
          class="scan-btn"
        >
          {{ ble.scanning.value ? 'SCANNING…' : 'SCAN' }}
        </button>
      </template>
    </header>

    <!-- ── Device dropdown ───────────────────────────────── -->
    <transition name="slide">
      <div
        v-if="showDevices && ble.devices.value.length"
        class="device-dropdown"
      >
        <div class="dropdown-title">SELECT DEVICE</div>

        <div
          v-for="d in ble.devices.value"
          :key="d.address"
          class="device-item"
          @click="doConnect(d.address)"
        >
          <div
            class="device-dot"
            :style="{
              background: d.is_bledom
                ? 'var(--green)'
                : 'var(--text-muted)'
            }"
          ></div>

          <div style="flex:1; min-width:0;">
            <div class="device-name">
              {{ d.name }}
              <span v-if="d.is_bledom" class="bledom-badge">BLEDOM</span>
            </div>
            <div class="mono device-address">{{ d.address }}</div>
          </div>
        </div>

        <div class="dropdown-footer">
          <button @click="closeDropdown" class="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ---------- Wrapper ---------- */
.device-bar-wrapper {
  position: relative;
  z-index: 1000;
  isolation: isolate;
}

/* ---------- Header ---------- */
.device-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  position: relative;
  z-index: 10;
}

/* ---------- Dropdown ---------- */
.device-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 24px;
  z-index: 9999;

  min-width: 280px;
  background: var(--panel-raised);
  border: 1px solid var(--border-bright);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.dropdown-title {
  padding: 8px 12px 4px;
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  border-top: 1px solid var(--border);
  transition: background 0.15s;
}

.device-item:hover {
  background: var(--accent-dim);
}

.device-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.device-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-address {
  font-size: 10px;
  color: var(--text-muted);
}

.bledom-badge {
  font-size: 9px;
  background: rgba(0,214,143,0.12);
  border: 1px solid rgba(0,214,143,0.3);
  color: var(--green);
  border-radius: 3px;
  padding: 1px 5px;
  margin-left: 6px;
  letter-spacing: 0.08em;
}

.dropdown-footer {
  padding: 8px 14px;
  border-top: 1px solid var(--border);
}

.cancel-btn {
  font-size: 11px;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Syne', sans-serif;
}

/* ---------- Buttons ---------- */
.scan-btn,
.action-btn {
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 11px;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
  white-space: nowrap;
}

.scan-btn {
  background: var(--accent-dim);
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 5px 16px;
  font-weight: 600;
}

.action-btn.green {
  background: rgba(0,214,143,0.08);
  border: 1px solid rgba(0,214,143,0.3);
  color: var(--green);
}

.action-btn.red {
  background: rgba(255,77,109,0.08);
  border: 1px solid rgba(255,77,109,0.25);
  color: var(--red);
}

.action-btn.neutral {
  background: transparent;
  border: 1px solid var(--border-bright);
  color: var(--text-muted);
}

/* ---------- Animation ---------- */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>