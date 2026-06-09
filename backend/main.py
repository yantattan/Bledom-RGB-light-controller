from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import json
import os
from ble_controller import BLEController
from playlist_store import list_playlists, get_playlist

ble = BLEController()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    print("[Server] Shutting down, disconnecting BLE...")
    await ble.disconnect()


app = FastAPI(title="BLEDOM Sound Tuner", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── REST Endpoints ──────────────────────────────────────────────────────────

@app.get("/api/status")
async def status():
    return {
        "connected": ble.is_connected,
        "address": ble.device_address,
    }


@app.post("/api/scan")
async def scan():
    devices = await ble.scan()
    return {"devices": devices}


@app.post("/api/connect/{address:path}")
async def connect(address: str):
    result = await ble.connect(address)
    result["connected"] = ble.is_connected
    return result


@app.post("/api/disconnect")
async def disconnect():
    await ble.disconnect()
    return {"connected": False}


# @app.post("/api/power/{state}")
# async def power(state: str):
#     on = state.lower() == "on"
#     ok = await ble.power(on)
#     return {"success": ok}


@app.post("/api/color")
async def set_color(body: dict):
    r = max(0, min(255, int(body.get("r", 0))))
    g = max(0, min(255, int(body.get("g", 0))))
    b = max(0, min(255, int(body.get("b", 0))))
    ok = await ble.set_color(r, g, b)
    return {"success": ok}


# Playlist retrieval

@app.get("/api/playlists")
async def playlists():
    return list_playlists()

@app.get("/api/playlists/{song_id}")
async def playlist(song_id: str):
    data = get_playlist(song_id)

    if not data:
        return {"error": "Song not found"}

    return data


# ── WebSocket: Audio → Light ─────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_audio(websocket: WebSocket):
    """
    Receives audio amplitude from the browser and drives the BLE light.
    Expected payload: { amplitude: 0.0-1.0, color: { r, g, b } }
    """
    await websocket.accept()
    print("[WS] Client connected")
    try:
        while True:
            raw = await websocket.receive_text()
            payload = json.loads(raw)

            amplitude: float = float(payload.get("amplitude", 0.0))
            color: dict = payload.get("color", {"r": 255, "g": 255, "b": 255})

            r = int(max(0, min(255, color["r"] * amplitude)))
            g = int(max(0, min(255, color["g"] * amplitude)))
            b = int(max(0, min(255, color["b"] * amplitude)))

            if ble.is_connected:
                await ble.set_color(r, g, b)

    except WebSocketDisconnect:
        print("[WS] Client disconnected")
    except Exception as e:
        print(f"[WS] Error: {e}")


# ── Serve built Vue frontend (production) ────────────────────────────────────

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        index = os.path.join(FRONTEND_DIST, "index.html")
        return FileResponse(index)