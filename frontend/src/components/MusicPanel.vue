<script setup>
import { SONGS } from '../data/songs.js'

const props = defineProps({
  music: Object,
  connected: Boolean,
})

const emit = defineEmits([
  'play',
  'pause',
  'seek'
])

function isPlaying(song) {
  return (
    props.music?.playing?.value &&
    props.music?.currentSong?.value?.id === song.id
  )
}

function handlePlay(song) {
  if (props.music?.playing?.value && props.music?.currentSong?.value?.id === song.id) {
    emit('pause')
  } else {
    emit('play', song)
  }
}

function seek(song, event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const pct = (event.clientX - rect.left) / rect.width

  emit('seek', { song, pct })
}
</script>

<template>
  <div class="flex flex-col gap-3">

    <div
      v-for="song in SONGS"
      :key="song.id"
      class="border rounded-xl p-4"
    >
      <div class="flex items-center justify-between">

        <div>
          <div class="font-semibold">
            {{ song.title }}
          </div>

          <div class="text-sm opacity-60">
            {{ song.artist }}
          </div>
        </div>

        <!-- PLAY/PAUSE button -->
        <button
          @click="handlePlay(song)"
          :disabled="!connected"
          class="w-8 h-8 rounded-full grid place-items-center"
        >
          <svg 
            v-if="!isPlaying(song)" 
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z"/>
          </svg>

          <svg 
            v-else 
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 5h4v14H6zm8 0h4v14h-4z"/>
          </svg>
        </button>

      </div>

      <!-- progress -->

      <div
        v-if="music.currentSong?.value?.id === song.id"
        class="mt-4 h-2 rounded bg-white/10 overflow-hidden cursor-pointer"
        @click="seek(song, $event)"
      >
        <div
          class="h-full bg-slate-600"
          :style="{
            width: `${music.progress.value * 100}%`
          }"
        />
      </div>

    </div>

  </div>
</template>