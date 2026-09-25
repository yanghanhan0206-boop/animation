"""Edit decision list: the order and length of every shot in the film.
Both the sound track and the final compositing are laid out against this."""

EDL = [
    ('s01', 8.0),     # cold open: the phone at 02:13, title
    ('s02', 4.0),     # September calendar
    ('s03a', 5.0),    # morning stretch
    ('s03b', 4.0),    # click 投递
    ('s03c', 5.0),    # joy
    ('s04', 16.0),    # montage
    ('s05', 4.0),     # tear September
    ('s06', 10.0),    # notifications
    ('s07', 12.0),    # buried in envelopes
    ('s08a', 4.0),    # AI interview OTS
    ('s08b', 5.0),    # AI interview CU
    ('s08c', 5.0),    # the screen towers
    ('s09a', 8.0),    # the talent pool
    ('s09b', 9.0),    # sinking
    ('s10', 3.0),     # November
    ('s11a', 3.0),    # mom calling
    ('s11b', 3.5),    # hesitation
    ('s11c', 10.0),   # on the phone
    ('s11d', 5.5),    # the smile collapses
    ('s12', 18.0),    # the spiral
    ('black', 1.5),   # silence
    ('s13a', 6.5),    # 3 a.m., rain
    ('s13b', 5.0),    # the tear
    ('s13c', 6.5),    # 是我不够好吗？
    ('s14a', 4.0),    # dawn
    ('s14b', 5.5),    # mending the crack
    ('s14c', 4.0),    # the 301st application
    ('s14d', 5.0),    # a leaf, a buzz
    ('end', 13.0),    # end cards
]

FPS = 24


def starts():
    t, out = 0.0, {}
    for name, d in EDL:
        out[name] = t
        t += d
    return out


def total():
    return sum(d for _, d in EDL)


def at(name, offset=0.0):
    """Film time of `offset` seconds into shot `name`."""
    return starts()[name] + offset
