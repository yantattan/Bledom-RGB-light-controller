from bleak import BleakClient, BleakScanner
from bleak.exc import BleakError
import asyncio

# BLEDOM write characteristic UUID (provided by user)
# If this doesn't work, the fallback standard BLEDOM char is: 0000fff3-0000-1000-8000-00805f9b34fb
WRITE_CHAR_UUID = "E9348988-68C3-74C2-99E4-84D484EC9280"

# BLEDOM command bytes (reverse-engineered protocol)
# Format: 7E 00 05 03 R G B 00 EF
def build_color_cmd(r: int, g: int, b: int) -> bytes:
    return bytes([0x7E, 0x00, 0x05, 0x03,
                  max(0, min(255, r)),
                  max(0, min(255, g)),
                  max(0, min(255, b)),
                  0x00, 0xEF])

def build_power_cmd(on: bool) -> bytes:
    flag = 0x01 if on else 0xFF
    return bytes([0x7E, 0x00, 0x04, 0xF0, 0x00, flag, 0xFF, 0x00, 0xEF])


class BLEController:
    def __init__(self):
        self.client: BleakClient | None = None
        self.device_name: str | None = None
        self.device_address: str | None = None
        self._write_lock = asyncio.Lock()
        self._state_lock = asyncio.Lock()
        self.write_char = None

    @property
    def is_connected(self) -> bool:
        return self.client is not None and self.client.is_connected

    async def scan(self, timeout: float = 6.0) -> list[dict]:
        """Scan for nearby BLE devices and return them all (frontend can filter)."""
        try:
            devices = await BleakScanner.discover(timeout=timeout)
            found = []
            for d in devices:
                found.append({
                    "name": d.name or "Unknown",
                    "address": d.address,
                    "is_bledom": "BLEDOM" in (d.name or "").upper()
                })
            # Filter BLE devices only
            found = list(filter(lambda x: x["is_bledom"], found))
            found.sort(key=lambda x: x["name"])
            return found
        except Exception as e:
            print(f"[BLE] Scan error: {e}")
            return []

    async def connect(self, address: str) -> dict:
        """Connect to a BLE device by address."""
        try:
            if self.is_connected:
                await self.disconnect()

            self.client = BleakClient(address, disconnected_callback=self._on_disconnect)
            await self.client.connect(timeout=10.0)

            self.device_address = address

            # find writable characteristic dynamically
            self.write_char = None

            for service in self.client.services:
                for char in service.characteristics:
                    if "write" in char.properties or "write-without-response" in char.properties:
                        self.write_char = char.uuid
                        break

            print(f"[BLE] Connected: {address}")
            print(f"[BLE] Write char: {self.write_char}")

            # Try to resolve device name
            for service in self.client.services:
                pass  # just iterate to populate

            self.device_name = address  # fallback
            print(f"[BLE] Connected to {address}")
            return {"success": True, "address": address}

        except BleakError as e:
            print(f"[BLE] Connection error: {e}")
            self.client = None
            return {"success": False, "error": str(e)}
        except Exception as e:
            print(f"[BLE] Unexpected error: {e}")
            self.client = None
            return {"success": False, "error": str(e)}

    def _on_disconnect(self, client: BleakClient):
        print(f"[BLE] Device disconnected: {client.address}")
        self.client = None

    async def disconnect(self):
        if self.client and self.client.is_connected:
            try:
                await self.client.disconnect()
            except Exception:
                pass
        self.client = None
        self.device_address = None

    async def set_color(self, r: int, g: int, b: int):
        """Send a color command to the light."""
        if not self.is_connected:
            return False
        async with self._write_lock:
            try:
                cmd = build_color_cmd(r, g, b)
                await self.client.write_gatt_char(
                    self.write_char,
                    cmd,
                    response=True
                )
                return True
            except Exception as e:
                print(f"[BLE] Write error: {e}")
                return False
            