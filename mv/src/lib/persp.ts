// Pin-hole camera over a ground plane: x right, y up, z forward (metres).

export interface Cam {
  /** Screen y of the horizon. */
  horizon: number;
  /** Focal length in px. */
  f: number;
  /** Camera height above the ground (m). */
  h: number;
  /** Screen x of the optical axis. */
  cx: number;
}

export const project = (cam: Cam, x: number, y: number, z: number) => ({
  x: cam.cx + (cam.f * x) / z,
  y: cam.horizon + (cam.f * (cam.h - y)) / z,
  /** Pixels per metre at that depth. */
  s: cam.f / z,
});
