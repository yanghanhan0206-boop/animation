"""Procedural materials: plasticine (with fingerprints and per-frame 'boil'),
paper, painted wood, cardboard, fabric, plastic, screens.

Everything is node-generated - no image textures except the ones we paint
ourselves with PIL (screens, paper prints).
"""
import math
import random
import bpy

_BOIL_NODES = []   # mapping nodes whose location changes every animation frame


def srgb(h):
    """'#rrggbb' or (r,g,b) 0..1 sRGB -> linear tuple"""
    if isinstance(h, str):
        h = h.lstrip('#')
        c = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    else:
        c = list(h)

    def lin(x):
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return tuple(lin(x) for x in c)


class NB:
    """Tiny node-graph builder."""

    def __init__(self, mat):
        mat.use_nodes = True
        self.mat = mat
        self.nt = mat.node_tree
        self.n = self.nt.nodes
        self.l = self.nt.links
        self.x = 0

    def clear(self):
        self.n.clear()

    def node(self, typ, name=None, **props):
        nd = self.n.new(typ)
        if name:
            nd.name = name
            nd.label = name
        for k, val in props.items():
            setattr(nd, k, val)
        nd.location = (self.x, 0)
        self.x -= 200
        return nd

    def link(self, a, b):
        self.l.new(a, b)

    def set_in(self, sock, val):
        if isinstance(val, bpy.types.NodeSocket):
            self.link(val, sock)
        else:
            sock.default_value = val

    def math(self, op, a, b=None, c=None, clamp=False):
        nd = self.node('ShaderNodeMath', operation=op, use_clamp=clamp)
        self.set_in(nd.inputs[0], a)
        if b is not None:
            self.set_in(nd.inputs[1], b)
        if c is not None:
            self.set_in(nd.inputs[2], c)
        return nd.outputs[0]

    def maprange(self, val, a, b, c=0.0, d=1.0, interp='SMOOTHSTEP'):
        nd = self.node('ShaderNodeMapRange', interpolation_type=interp, clamp=True)
        self.set_in(nd.inputs['Value'], val)
        nd.inputs['From Min'].default_value = a
        nd.inputs['From Max'].default_value = b
        nd.inputs['To Min'].default_value = c
        nd.inputs['To Max'].default_value = d
        return nd.outputs['Result']

    def mixcol(self, fac, a, b, blend='MIX'):
        nd = self.node('ShaderNodeMix', data_type='RGBA', blend_type=blend)
        ins = [s for s in nd.inputs if s.enabled]
        # enabled inputs for RGBA: Factor, A, B
        self.set_in(ins[0], fac)
        self.set_in(ins[1], a if not isinstance(a, tuple) or len(a) == 4 else (*a, 1))
        self.set_in(ins[2], b if not isinstance(b, tuple) or len(b) == 4 else (*b, 1))
        outs = [s for s in nd.outputs if s.enabled]
        return outs[0]

    def value(self, v, name=None):
        nd = self.node('ShaderNodeValue', name=name)
        nd.outputs[0].default_value = v
        return nd.outputs[0]

    def coords(self, space='Object', scale=100.0, name=None, loc=(0, 0, 0)):
        tc = self.node('ShaderNodeTexCoord')
        mp = self.node('ShaderNodeMapping', name=name)
        self.link(tc.outputs[space], mp.inputs['Vector'])
        mp.inputs['Scale'].default_value = (scale, scale, scale)
        mp.inputs['Location'].default_value = loc
        return mp

    def noise(self, vec, scale, detail=2.0, rough=0.5, dist=0.0, dims='3D'):
        nd = self.node('ShaderNodeTexNoise', noise_dimensions=dims)
        self.link(vec, nd.inputs['Vector'])
        nd.inputs['Scale'].default_value = scale
        nd.inputs['Detail'].default_value = detail
        nd.inputs['Roughness'].default_value = rough
        nd.inputs['Distortion'].default_value = dist
        return nd

    def voronoi(self, vec, scale, feature='F1', rand=1.0):
        nd = self.node('ShaderNodeTexVoronoi', feature=feature)
        self.link(vec, nd.inputs['Vector'])
        nd.inputs['Scale'].default_value = scale
        nd.inputs['Randomness'].default_value = rand
        return nd

    def bsdf(self):
        return self.node('ShaderNodeBsdfPrincipled')

    def output(self, shader):
        out = self.node('ShaderNodeOutputMaterial')
        self.link(shader, out.inputs['Surface'])
        return out


def _new(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nb = NB(m)
    nb.clear()
    return m, nb


# --------------------------------------------------------------------------
# plasticine
# --------------------------------------------------------------------------
def clay(name, color, rough=0.5, bump=1.0, spec=0.35, prints=1.0, sss=0.0,
         sheen=0.12, lump=1.0, gloss=0.0, seed=None):
    """Plasticine: low-frequency lumps, thumb dents, fingerprint whorls (boiled),
    slight colour mottling. 'desat' value node lets shots fade the colour to grey."""
    m, nb = _new(name)
    col = srgb(color) if isinstance(color, str) else color
    seed = random.random() * 100 if seed is None else seed

    static = nb.coords(scale=100.0, loc=(seed, seed * 0.7, seed * 1.3))  # cm space
    boil = nb.coords(scale=100.0, name='boil', loc=(seed, -seed, seed * 0.5))
    _BOIL_NODES.append(boil)

    # low-frequency lumps (static shape irregularity)
    lumps = nb.noise(static.outputs[0], 0.9, detail=3, rough=0.55)
    # thumb dents: voronoi craters
    vd = nb.noise(static.outputs[0], 1.3, detail=1)
    dent = nb.maprange(vd.outputs['Fac'], 0.62, 0.8, 0.0, 1.0)
    # fingerprints: concentric rings around voronoi points (boiled coordinates)
    vf = nb.voronoi(boil.outputs[0], 0.55)
    dist_cm = nb.math('DIVIDE', vf.outputs['Distance'], 0.55)
    warp = nb.noise(boil.outputs[0], 2.2, detail=2)
    ring_arg = nb.math('MULTIPLY_ADD', dist_cm, 95.0, nb.math('MULTIPLY', warp.outputs['Fac'], 9.0))
    rings = nb.math('MULTIPLY_ADD', nb.math('SINE', ring_arg), 0.5, 0.5)
    pmask = nb.maprange(dist_cm, 0.55, 0.12)
    cellon = nb.math('GREATER_THAN', vf.outputs['Color'], 0.55)
    fp = nb.math('MULTIPLY', nb.math('MULTIPLY', rings, pmask), cellon)
    # fine grain
    fine = nb.noise(boil.outputs[0], 14.0, detail=2, rough=0.6)

    h = nb.math('MULTIPLY', lumps.outputs['Fac'], 0.9 * lump)
    h = nb.math('MULTIPLY_ADD', dent, -0.35 * lump, h)
    h = nb.math('MULTIPLY_ADD', fp, 0.07 * prints, h)
    h = nb.math('MULTIPLY_ADD', fine.outputs['Fac'], 0.10, h)

    bp = nb.node('ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.55 * bump
    bp.inputs['Distance'].default_value = 0.0012
    nb.link(h, bp.inputs['Height'])

    # colour mottling + desaturation control
    mott = nb.noise(static.outputs[0], 1.6, detail=2)
    mott_f = nb.math('MULTIPLY_ADD', mott.outputs['Fac'], 0.16, 0.92)
    base = nb.mixcol(mott_f, (0, 0, 0, 1), (*col, 1), blend='MIX')
    # grey version
    gray = sum(c * w for c, w in zip(col, (0.2126, 0.7152, 0.0722)))
    g = gray * 0.5 + 0.045
    desat = nb.value(0.0, name='desat')
    grey_col = nb.mixcol(mott_f, (0, 0, 0, 1), (g, g, g * 1.04, 1))
    final_col = nb.mixcol(desat, base, grey_col)

    b = nb.bsdf()
    nb.link(final_col, b.inputs['Base Color'])
    rr = nb.math('MULTIPLY_ADD', fine.outputs['Fac'], 0.18, rough - 0.09)
    nb.link(rr, b.inputs['Roughness'])
    b.inputs['Specular IOR Level'].default_value = spec
    b.inputs['Sheen Weight'].default_value = sheen
    b.inputs['Sheen Roughness'].default_value = 0.6
    if sss > 0:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (1.0, 0.45, 0.25)
        b.inputs['Subsurface Scale'].default_value = 0.002
    if gloss > 0:
        b.inputs['Coat Weight'].default_value = gloss
        b.inputs['Coat Roughness'].default_value = 0.12
    nb.link(bp.outputs['Normal'], b.inputs['Normal'])
    nb.output(b.outputs[0])
    return m


_BOIL_BASE = {}


def boil_all(frame, amount=1.0):
    """Shift fingerprint coordinates - the puppet was touched between frames."""
    rng = random.Random(frame * 7919 + 13)
    for nd in _BOIL_NODES:
        try:
            key = nd.as_pointer()
            if key not in _BOIL_BASE:
                _BOIL_BASE[key] = tuple(nd.inputs['Location'].default_value)
            base = _BOIL_BASE[key]
            j = 0.35 * amount
            nd.inputs['Location'].default_value = (base[0] + rng.uniform(-j, j),
                                                   base[1] + rng.uniform(-j, j),
                                                   base[2] + rng.uniform(-j, j))
        except ReferenceError:
            pass


def set_desat(mats, amount):
    for m in mats:
        nd = m.node_tree.nodes.get('desat')
        if nd:
            nd.outputs[0].default_value = amount


# --------------------------------------------------------------------------
# glossy bead (eyes), liquid
# --------------------------------------------------------------------------
def bead(name, color, rough=0.12, spec=0.6):
    m, nb = _new(name)
    b = nb.bsdf()
    b.inputs['Base Color'].default_value = (*srgb(color), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = spec
    b.inputs['Coat Weight'].default_value = 0.6
    b.inputs['Coat Roughness'].default_value = 0.05
    nb.output(b.outputs[0])
    return m


def liquid(name, color='#dbeef7', rough=0.03, alpha=0.32):
    """Clear resin-like drop (tears, sweat): glossy coat, partly see-through."""
    m, nb = _new(name)
    b = nb.bsdf()
    b.inputs['Base Color'].default_value = (*srgb(color), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = 1.0
    b.inputs['Coat Weight'].default_value = 1.0
    b.inputs['Coat Roughness'].default_value = 0.02
    b.inputs['Alpha'].default_value = alpha
    nb.output(b.outputs[0])
    return m


# --------------------------------------------------------------------------
# set materials
# --------------------------------------------------------------------------
def painted(name, color, rough=0.75, brush=1.0, scale=1.0, color2=None, split_z=None,
            stripe=None):
    """Matte painted board (walls, furniture). Optional two-tone split at height split_z (cm,
    object space) - the classic green-lower/white-upper Chinese dorm wall."""
    m, nb = _new(name)
    c1 = srgb(color)
    co = nb.coords(scale=100.0)
    strokes = nb.noise(co.outputs[0], 0.35 * scale, detail=4, rough=0.6, dist=0.4)
    # brush direction streaks
    sep = nb.node('ShaderNodeSeparateXYZ')
    nb.link(co.outputs[0], sep.inputs[0])
    streak = nb.node('ShaderNodeTexWave', wave_type='BANDS', bands_direction='Z')
    nb.link(co.outputs[0], streak.inputs['Vector'])
    streak.inputs['Scale'].default_value = 1.4 * scale
    streak.inputs['Distortion'].default_value = 6.0
    streak.inputs['Detail'].default_value = 3.0
    h = nb.math('MULTIPLY_ADD', streak.outputs['Fac'], 0.3, strokes.outputs['Fac'])
    bp = nb.node('ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.18 * brush
    bp.inputs['Distance'].default_value = 0.0008
    nb.link(h, bp.inputs['Height'])
    f = nb.math('MULTIPLY_ADD', strokes.outputs['Fac'], 0.12, 0.94)
    base = nb.mixcol(f, (0, 0, 0, 1), (*c1, 1))
    if color2 is not None and split_z is not None:
        c2 = srgb(color2)
        base2 = nb.mixcol(f, (0, 0, 0, 1), (*c2, 1))
        edge = nb.math('LESS_THAN', sep.outputs['Z'], split_z)
        base = nb.mixcol(edge, base, base2)
    b = nb.bsdf()
    nb.link(base, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = 0.3
    nb.link(bp.outputs['Normal'], b.inputs['Normal'])
    nb.output(b.outputs[0])
    return m


def wood(name, light='#c99b67', dark='#9a6a3e', rough=0.45, scale=1.0, axis='X', varnish=0.3):
    """Wood laminate: long straight grain streaks along `axis` plus soft growth bands."""
    m, nb = _new(name)
    tc = nb.node('ShaderNodeTexCoord')
    mp = nb.node('ShaderNodeMapping')
    nb.link(tc.outputs['Object'], mp.inputs['Vector'])
    k = 100.0 * scale
    if axis == 'X':
        mp.inputs['Scale'].default_value = (k * 0.08, k * 2.2, k * 2.2)
    elif axis == 'Y':
        mp.inputs['Scale'].default_value = (k * 2.2, k * 0.08, k * 2.2)
    else:
        mp.inputs['Scale'].default_value = (k * 2.2, k * 2.2, k * 0.08)
    streak = nb.noise(mp.outputs[0], 1.0, detail=6, rough=0.62, dist=0.3)
    bands = nb.noise(mp.outputs[0], 0.18, detail=2, rough=0.5, dist=1.2)
    f = nb.math('MULTIPLY_ADD', streak.outputs['Fac'], 0.6, nb.math('MULTIPLY', bands.outputs['Fac'], 0.4))
    col = nb.mixcol(nb.maprange(f, 0.3, 0.72, interp='SMOOTHSTEP'), (*srgb(dark), 1), (*srgb(light), 1))
    bp = nb.node('ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.08
    bp.inputs['Distance'].default_value = 0.0004
    nb.link(streak.outputs['Fac'], bp.inputs['Height'])
    b = nb.bsdf()
    nb.link(col, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = varnish
    b.inputs['Coat Roughness'].default_value = 0.25
    nb.link(bp.outputs['Normal'], b.inputs['Normal'])
    nb.output(b.outputs[0])
    return m


def plastic(name, color, rough=0.32, spec=0.5, metal=0.0):
    m, nb = _new(name)
    co = nb.coords(scale=100.0)
    n = nb.noise(co.outputs[0], 3.0, detail=2)
    bp = nb.node('ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.05
    bp.inputs['Distance'].default_value = 0.0004
    nb.link(n.outputs['Fac'], bp.inputs['Height'])
    b = nb.bsdf()
    b.inputs['Base Color'].default_value = (*srgb(color), 1)
    rr = nb.math('MULTIPLY_ADD', n.outputs['Fac'], 0.1, rough - 0.05)
    nb.link(rr, b.inputs['Roughness'])
    b.inputs['Specular IOR Level'].default_value = spec
    b.inputs['Metallic'].default_value = metal
    nb.link(bp.outputs['Normal'], b.inputs['Normal'])
    nb.output(b.outputs[0])
    return m


def fabric(name, color, rough=0.9, scale=1.0, color2=None, check=None):
    """Woven fabric; optional check pattern (check = size in cm)."""
    m, nb = _new(name)
    co = nb.coords(scale=100.0)
    weave1 = nb.node('ShaderNodeTexWave', wave_type='BANDS', bands_direction='X')
    weave2 = nb.node('ShaderNodeTexWave', wave_type='BANDS', bands_direction='Z')
    for w in (weave1, weave2):
        nb.link(co.outputs[0], w.inputs['Vector'])
        w.inputs['Scale'].default_value = 28.0 * scale
    h = nb.math('ADD', weave1.outputs['Fac'], weave2.outputs['Fac'])
    lump = nb.noise(co.outputs[0], 0.6, detail=3)
    h = nb.math('MULTIPLY_ADD', lump.outputs['Fac'], 3.0, h)
    bp = nb.node('ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.25
    bp.inputs['Distance'].default_value = 0.0005
    nb.link(h, bp.inputs['Height'])
    c = (*srgb(color), 1)
    if check and color2:
        ck = nb.node('ShaderNodeTexChecker')
        nb.link(co.outputs[0], ck.inputs['Vector'])
        ck.inputs['Scale'].default_value = 1.0 / check
        colsock = nb.mixcol(ck.outputs['Fac'], c, (*srgb(color2), 1))
    else:
        f = nb.math('MULTIPLY_ADD', lump.outputs['Fac'], 0.15, 0.92)
        colsock = nb.mixcol(f, (0, 0, 0, 1), c)
    b = nb.bsdf()
    nb.link(colsock, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    b.inputs['Sheen Weight'].default_value = 0.6
    b.inputs['Specular IOR Level'].default_value = 0.2
    nb.link(bp.outputs['Normal'], b.inputs['Normal'])
    nb.output(b.outputs[0])
    return m


def paper(name, color='#f3eee2', image=None, rough=0.85, translucent=0.15, fibers=1.0,
          uv_map=True, alpha=False, emission=0.0):
    """Paper/card with optional printed image (PIL-made)."""
    m, nb = _new(name)
    co = nb.coords(scale=100.0)
    fib = nb.noise(co.outputs[0], 18.0, detail=3, rough=0.7)
    blot = nb.noise(co.outputs[0], 0.8, detail=2)
    h = nb.math('MULTIPLY_ADD', fib.outputs['Fac'], 1.0, blot.outputs['Fac'])
    bp = nb.node('ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.15 * fibers
    bp.inputs['Distance'].default_value = 0.0003
    nb.link(h, bp.inputs['Height'])
    b = nb.bsdf()
    tint = nb.math('MULTIPLY_ADD', blot.outputs['Fac'], 0.08, 0.95)
    if image is not None:
        tx = nb.node('ShaderNodeTexImage')
        tx.image = image if not isinstance(image, str) else bpy.data.images.load(image)
        tx.interpolation = 'Cubic'
        tx.extension = 'CLIP'
        if uv_map:
            uv = nb.node('ShaderNodeTexCoord')
            nb.link(uv.outputs['UV'], tx.inputs['Vector'])
        col = nb.mixcol(tint, (0, 0, 0, 1), tx.outputs['Color'])
        if alpha:
            nb.link(tx.outputs['Alpha'], b.inputs['Alpha'])
        m['tex_node'] = tx.name
    else:
        col = nb.mixcol(tint, (0, 0, 0, 1), (*srgb(color), 1))
    nb.link(col, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = 0.25
    nb.link(bp.outputs['Normal'], b.inputs['Normal'])
    if emission > 0:
        nb.link(col, b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = emission
    shader = b.outputs[0]
    if translucent > 0:
        tr = nb.node('ShaderNodeBsdfTranslucent')
        nb.link(col, tr.inputs['Color'])
        mix = nb.node('ShaderNodeMixShader')
        mix.inputs[0].default_value = translucent
        nb.link(b.outputs[0], mix.inputs[1])
        nb.link(tr.outputs[0], mix.inputs[2])
        shader = mix.outputs[0]
        if alpha and image is not None:
            # keep cut-out alpha when mixing with translucency
            tp = nb.node('ShaderNodeBsdfTransparent')
            mix2 = nb.node('ShaderNodeMixShader')
            nb.link(tx.outputs['Alpha'], mix2.inputs[0])
            nb.link(tp.outputs[0], mix2.inputs[1])
            nb.link(mix.outputs[0], mix2.inputs[2])
            shader = mix2.outputs[0]
    nb.output(shader)
    return m


def screen(name, image=None, strength=4.0, color=(1, 1, 1), glass=True):
    """Emissive screen with image; faint glass reflection."""
    m, nb = _new(name)
    b = nb.bsdf()
    b.inputs['Base Color'].default_value = (0.005, 0.005, 0.006, 1)
    b.inputs['Roughness'].default_value = 0.22 if glass else 0.4
    b.inputs['Specular IOR Level'].default_value = 0.3
    if image is not None:
        tx = nb.node('ShaderNodeTexImage', name='screen_tex')
        tx.image = image if not isinstance(image, str) else bpy.data.images.load(image)
        tx.interpolation = 'Linear'
        tx.extension = 'CLIP'
        uv = nb.node('ShaderNodeTexCoord')
        nb.link(uv.outputs['UV'], tx.inputs['Vector'])
        nb.link(tx.outputs['Color'], b.inputs['Emission Color'])
    else:
        b.inputs['Emission Color'].default_value = (*color, 1)
    st = nb.value(strength, name='strength')
    nb.link(st, b.inputs['Emission Strength'])
    nb.output(b.outputs[0])
    return m


def emissive(name, color, strength=5.0):
    m, nb = _new(name)
    e = nb.node('ShaderNodeEmission')
    e.inputs['Color'].default_value = (*srgb(color), 1)
    st = nb.value(strength, name='strength')
    nb.link(st, e.inputs['Strength'])
    nb.output(e.outputs[0])
    return m


def metal(name, color='#b8b8b8', rough=0.3):
    m, nb = _new(name)
    b = nb.bsdf()
    b.inputs['Base Color'].default_value = (*srgb(color), 1)
    b.inputs['Metallic'].default_value = 1.0
    b.inputs['Roughness'].default_value = rough
    nb.output(b.outputs[0])
    return m


def set_strength(mat, s):
    nd = mat.node_tree.nodes.get('strength')
    if nd:
        nd.outputs[0].default_value = s


def tiles(name, c1='#e6e1d6', c2='#d9d3c6', grout='#b3ab9c', size=4.6, rough=0.35):
    """Ceramic floor tiles (square grid with grout)."""
    m, nb = _new(name)
    co = nb.coords(scale=100.0)
    br = nb.node('ShaderNodeTexBrick', offset=0.0, offset_frequency=1, squash=1.0, squash_frequency=1)
    nb.link(co.outputs[0], br.inputs['Vector'])
    br.inputs['Color1'].default_value = (*srgb(c1), 1)
    br.inputs['Color2'].default_value = (*srgb(c2), 1)
    br.inputs['Mortar'].default_value = (*srgb(grout), 1)
    br.inputs['Scale'].default_value = 1.0
    br.inputs['Mortar Size'].default_value = 0.09
    br.inputs['Mortar Smooth'].default_value = 0.2
    br.inputs['Brick Width'].default_value = size
    br.inputs['Row Height'].default_value = size
    dirt = nb.noise(co.outputs[0], 0.4, detail=4)
    f = nb.math('MULTIPLY_ADD', dirt.outputs['Fac'], 0.12, 0.92)
    col = nb.mixcol(f, (0, 0, 0, 1), br.outputs['Color'])
    bp = nb.node('ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.4
    bp.inputs['Distance'].default_value = 0.0006
    nb.link(nb.math('SUBTRACT', 1.0, br.outputs['Fac']), bp.inputs['Height'])
    b = nb.bsdf()
    nb.link(col, b.inputs['Base Color'])
    rr = nb.math('MULTIPLY_ADD', br.outputs['Fac'], 0.5, rough)
    nb.link(rr, b.inputs['Roughness'])
    nb.link(bp.outputs['Normal'], b.inputs['Normal'])
    nb.output(b.outputs[0])
    return m


def cork(name):
    m, nb = _new(name)
    co = nb.coords(scale=100.0)
    n1 = nb.noise(co.outputs[0], 3.0, detail=3, rough=0.7)
    vo = nb.voronoi(co.outputs[0], 6.0)
    spk = nb.maprange(vo.outputs['Distance'], 0.05, 0.25, 0.0, 1.0)
    f = nb.math('MULTIPLY', n1.outputs['Fac'], spk)
    col = nb.mixcol(nb.maprange(f, 0.1, 0.7, interp='LINEAR'), (*srgb('#7a5431'), 1), (*srgb('#c49565'), 1))
    bp = nb.node('ShaderNodeBump')
    bp.inputs['Strength'].default_value = 0.5
    bp.inputs['Distance'].default_value = 0.0008
    nb.link(f, bp.inputs['Height'])
    b = nb.bsdf()
    nb.link(col, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.9
    nb.link(bp.outputs['Normal'], b.inputs['Normal'])
    nb.output(b.outputs[0])
    return m


def sky(name):
    """Backdrop painted sky: vertical gradient, colours driven by nodes 'top'/'bot'/'strength'."""
    m, nb = _new(name)
    tc = nb.node('ShaderNodeTexCoord')
    sep = nb.node('ShaderNodeSeparateXYZ')
    nb.link(tc.outputs['UV'], sep.inputs[0])
    top = nb.node('ShaderNodeRGB', name='top')
    bot = nb.node('ShaderNodeRGB', name='bot')
    top.outputs[0].default_value = (0.3, 0.5, 0.8, 1)
    bot.outputs[0].default_value = (0.9, 0.8, 0.7, 1)
    t = nb.maprange(sep.outputs['Y'], 0.0, 1.0, interp='SMOOTHSTEP')
    col = nb.mixcol(t, bot.outputs[0], top.outputs[0])
    # soft painted clouds
    co = nb.coords(scale=100.0)
    cl = nb.noise(co.outputs[0], 0.03, detail=3, rough=0.55)
    cf = nb.maprange(cl.outputs['Fac'], 0.52, 0.7)
    cloudcol = nb.node('ShaderNodeRGB', name='cloud')
    cloudcol.outputs[0].default_value = (1, 1, 1, 1)
    col = nb.mixcol(nb.math('MULTIPLY', cf, 0.55), col, cloudcol.outputs[0])
    e = nb.node('ShaderNodeEmission')
    nb.link(col, e.inputs['Color'])
    st = nb.value(1.0, name='strength')
    nb.link(st, e.inputs['Strength'])
    nb.output(e.outputs[0])
    return m


def set_rgb(mat, node, col):
    nd = mat.node_tree.nodes.get(node)
    if nd:
        nd.outputs[0].default_value = (*col, 1)


def daynight_image(name, day_img, night_img):
    """Billboard (buildings across the road): day/night textures mixed by value 'night';
    lit windows glow at night."""
    m, nb = _new(name)
    uv = nb.node('ShaderNodeTexCoord')
    td = nb.node('ShaderNodeTexImage')
    td.image = day_img
    tn = nb.node('ShaderNodeTexImage')
    tn.image = night_img
    for t in (td, tn):
        nb.link(uv.outputs['UV'], t.inputs['Vector'])
        t.extension = 'CLIP'
    night = nb.value(0.0, name='night')
    col = nb.mixcol(night, td.outputs['Color'], tn.outputs['Color'])
    b = nb.bsdf()
    nb.link(col, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.9
    nb.link(tn.outputs['Color'], b.inputs['Emission Color'])
    es = nb.math('MULTIPLY', night, 2.2)
    nb.link(es, b.inputs['Emission Strength'])
    a = nb.mixcol(night, td.outputs['Alpha'], tn.outputs['Alpha'])
    nb.link(a, b.inputs['Alpha'])
    nb.output(b.outputs[0])
    return m


def set_value(mat, node, val):
    nd = mat.node_tree.nodes.get(node)
    if nd:
        nd.outputs[0].default_value = val
