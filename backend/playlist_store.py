import json
from pathlib import Path

PLAYLIST_DIR = Path(__file__).parent / "playlist"

def list_playlists():
    songs = []

    for file in PLAYLIST_DIR.glob("*.json"):
        try:
            with open(file, "r", encoding="utf-8") as f:
                songs.append(json.load(f))
        except Exception as e:
            print(f"[Playlist] Failed to load {file}: {e}")

    return songs


def get_playlist(song_id: str):
    file = PLAYLIST_DIR / f"{song_id}.json"

    if not file.exists():
        return None

    with open(file, "r", encoding="utf-8") as f:
        return json.load(f)