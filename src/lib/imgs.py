"""PIL image -> Blender image datablock (pixels set directly, no files)."""
import numpy as np
import bpy

_CACHE = {}


def to_bpy(pil, name, keep=True):
    arr = np.asarray(pil.convert('RGBA'), dtype=np.float32) / 255.0
    arr = np.ascontiguousarray(arr[::-1])
    h, w = arr.shape[:2]
    img = bpy.data.images.get(name)
    if img is None or tuple(img.size) != (w, h):
        if img is not None:
            bpy.data.images.remove(img)
        img = bpy.data.images.new(name, w, h, alpha=True)
        img.colorspace_settings.name = 'sRGB'
        img.alpha_mode = 'STRAIGHT'
    img.pixels.foreach_set(arr.ravel())
    img.update()
    return img


def update(img, pil):
    """Replace pixels of an existing image (same size) - cheap per-frame screen updates."""
    arr = np.asarray(pil.convert('RGBA'), dtype=np.float32) / 255.0
    arr = np.ascontiguousarray(arr[::-1])
    img.pixels.foreach_set(arr.ravel())
    img.update()


_SWAP_N = {}


def swap(node, pil, base):
    """Give an image-texture node a brand-new image datablock. Cycles' persistent data
    ignores in-place pixel edits, but it does pick up a different image."""
    k = _SWAP_N.get(base, 0) + 1
    _SWAP_N[base] = k
    old = node.image
    new = to_bpy(pil, f'{base}~{k}')
    node.image = new
    if old is not None and old.users == 0:
        bpy.data.images.remove(old)
    return new
