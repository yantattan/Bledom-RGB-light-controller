import { ref } from 'vue'

export function usePlaylists() {
  const songs = ref([])
  const loading = ref(false)

  async function load() {
    loading.value = true

    try {
      const res = await fetch('/api/playlists')
      songs.value = await res.json()
    }
    finally {
      loading.value = false
    }
  }

  return {
    songs,
    loading,
    load,
  }
}