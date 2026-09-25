"""Everything printed or displayed inside the film - screens, calendar pages,
sticky notes, envelopes, book spines, signs - drawn here with PIL.

Pure PIL/numpy (no bpy), so the same code also feeds the 2D title cards.
All company names, people, schools and numbers are fictional.
"""
import math
import random
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

NOTO = '/usr/share/fonts/opentype/noto/'
WENKAI = '/usr/share/fonts/truetype/lxgw-wenkai/'


@lru_cache(maxsize=256)
def font(kind, size):
    size = int(size)
    if kind == 'sans':
        return ImageFont.truetype(NOTO + 'NotoSansCJK-Regular.ttc', size, index=2)
    if kind == 'sansb':
        return ImageFont.truetype(NOTO + 'NotoSansCJK-Bold.ttc', size, index=2)
    if kind == 'serif':
        return ImageFont.truetype(NOTO + 'NotoSerifCJK-Regular.ttc', size, index=2)
    if kind == 'serifb':
        return ImageFont.truetype(NOTO + 'NotoSerifCJK-Bold.ttc', size, index=2)
    if kind == 'hand':
        return ImageFont.truetype(WENKAI + 'LXGWWenKai-Regular.ttf', size)
    if kind == 'handb':
        return ImageFont.truetype(WENKAI + 'LXGWWenKai-Bold.ttf', size)
    if kind == 'handl':
        return ImageFont.truetype(WENKAI + 'LXGWWenKai-Light.ttf', size)
    if kind == 'mono':
        return ImageFont.truetype(NOTO + 'NotoSansCJK-Regular.ttc', size, index=5)
    raise ValueError(kind)


def rgb(h, a=255):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def T(d, xy, s, f, fill, anchor='la', **kw):
    d.text(xy, s, font=f, fill=fill, anchor=anchor, **kw)


def rrect(d, box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, r, fill=fill, outline=outline, width=width)


def text_w(s, f):
    return f.getlength(s)


def ellipsize(s, f, w):
    if text_w(s, f) <= w:
        return s
    while s and text_w(s + '…', f) > w:
        s = s[:-1]
    return s + '…'


def wrap(s, f, w):
    lines, cur = [], ''
    for ch in s:
        if ch == '\n':
            lines.append(cur)
            cur = ''
            continue
        if text_w(cur + ch, f) > w:
            lines.append(cur)
            cur = ch
        else:
            cur += ch
    if cur:
        lines.append(cur)
    return lines


def paper_grain(img, amount=10, seed=0, scale=1.0):
    """Mottled paper fibre noise on an RGB(A) image."""
    rng = np.random.default_rng(seed)
    a = np.asarray(img).astype(np.float32)
    h, w = a.shape[:2]
    n = rng.normal(0, 1, (max(2, int(h / 6 / scale)), max(2, int(w / 6 / scale)))).astype(np.float32)
    n = np.asarray(Image.fromarray(n).resize((w, h), Image.BICUBIC))
    f = rng.normal(0, 0.5, (h, w)).astype(np.float32)
    noise = (n * 0.7 + f * 0.3) * amount
    a[..., :3] = np.clip(a[..., :3] + noise[..., None], 0, 255)
    return Image.fromarray(a.astype(np.uint8), img.mode)


def cursor(d, x, y, s=1.0, pressed=False):
    pts = [(0, 0), (0, 26), (7, 20), (12, 31), (17, 29), (12, 18), (21, 18)]
    pts = [(x + px * s, y + py * s) for px, py in pts]
    d.polygon(pts, fill=(255, 255, 255, 255), outline=(20, 20, 20, 255))
    if pressed:
        d.ellipse((x - 16 * s, y - 16 * s, x + 16 * s, y + 16 * s), outline=(80, 140, 255, 200),
                  width=int(3 * s))


# =============================================================================
# LAPTOP SCREENS  (1280 x 800)
# =============================================================================
LW, LH = 1280, 800
BLUE = rgb('#2f6fed')
INK = rgb('#1f2430')
GREY = rgb('#7b8494')
LINE = rgb('#e3e6ec')


def _browser(title, url, bg='#f4f6fa'):
    im = Image.new('RGBA', (LW, LH), rgb(bg))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, LW, 44), fill=rgb('#dfe3ea'))
    rrect(d, (14, 8, 330, 44), 10, fill=rgb('#f4f6fa'))
    T(d, (34, 26), title, font('sans', 17), INK, 'lm')
    for i, c in enumerate(('#ff5f57', '#febc2e', '#28c840')):
        pass
    d.rectangle((0, 44, LW, 88), fill=rgb('#f4f6fa'))
    rrect(d, (120, 52, LW - 120, 80), 14, fill=rgb('#ffffff'), outline=rgb('#d5d9e0'))
    T(d, (144, 66), url, font('sans', 15), GREY, 'lm')
    d.line((0, 88, LW, 88), fill=rgb('#d5d9e0'), width=1)
    return im, d


def _badge(d, n):
    if n is None:
        return
    rrect(d, (LW - 300, 100, LW - 24, 176), 16, fill=rgb('#fff4e5'), outline=rgb('#ffcf8a'), width=2)
    T(d, (LW - 280, 138), '已投递', font('sansb', 26), rgb('#b86a00'), 'lm')
    T(d, (LW - 44, 138), str(n), font('sansb', 50), rgb('#e07b00'), 'rm')


def scr_resume(n=None):
    im = Image.new('RGBA', (LW, LH), rgb('#3b3f47'))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, LW, 50), fill=rgb('#2a2d33'))
    T(d, (24, 25), '个人简历_林小满_最终版(7).pdf', font('sans', 20), rgb('#e8eaee'), 'lm')
    T(d, (LW - 24, 25), '100%', font('sans', 18), rgb('#aab0bb'), 'rm')
    px0, py0, pw = 330, 70, 620
    d.rectangle((px0, py0, px0 + pw, LH + 40), fill=rgb('#ffffff'))
    x = px0 + 48
    T(d, (x, py0 + 46), '林小满', font('sansb', 44), INK, 'lm')
    T(d, (x, py0 + 96), '求职意向：市场专员 / 新媒体运营', font('sans', 17), GREY, 'lm')
    T(d, (x, py0 + 122), '电话 138****0527   邮箱 xm.lin@nzu.edu.cn', font('sans', 15), GREY, 'lm')
    d.rectangle((px0 + pw - 150, py0 + 26, px0 + pw - 50, py0 + 150), fill=rgb('#dfe6f0'))
    d.ellipse((px0 + pw - 124, py0 + 44, px0 + pw - 76, py0 + 92), fill=rgb('#b8c3d3'))
    d.pieslice((px0 + pw - 140, py0 + 96, px0 + pw - 60, py0 + 176), 180, 360, fill=rgb('#b8c3d3'))
    y = py0 + 176
    secs = [
        ('教育背景', ['南州大学 · 市场营销 · 本科      2023.09 – 2027.06',
                     'GPA 3.42 / 4.0   专业排名 21 / 96']),
        ('实习经历', ['某文化传媒有限公司 · 新媒体运营实习生   2025.07 – 2025.09',
                     '· 负责公众号选题与排版，单篇最高阅读 1.2 万',
                     '· 协助策划校园快闪活动 2 场']),
        ('校园经历', ['校学生会宣传部 · 副部长', '· 组织迎新晚会，统筹 40 人志愿者团队']),
        ('技能证书', ['CET-6   计算机二级   熟练使用 PS / PR / Excel']),
        ('自我评价', ['性格开朗，学习能力强，抗压能力强。']),
    ]
    for head, lines in secs:
        T(d, (x, y), head, font('sansb', 20), BLUE, 'lm')
        d.line((x, y + 18, px0 + pw - 48, y + 18), fill=rgb('#cfd8e8'), width=2)
        y += 40
        for ln in lines:
            T(d, (x, y), ln, font('sans', 15), INK, 'lm')
            y += 26
        y += 12
    return im


DOMAIN = {'星河科技': 'xinghe-tech', '远航集团': 'yuanhang-group', '蓝鲸互动': 'lanjing-hd',
          '北辰银行': 'beichen-bank', '青橙智能': 'qingcheng-ai', '万象传媒': 'wanxiang-media',
          '云启科技': 'yunqi-tech'}


def scr_job(company='星河科技', title='市场专员（管培生）', n=None, cur=None, pressed=False,
            dim=0.0):
    im, d = _browser(f'校园招聘 - {company}', f'campus.{DOMAIN.get(company, "jobs")}.cn/2027')
    # company header
    d.rectangle((0, 88, LW, 200), fill=rgb('#ffffff'))
    d.ellipse((60, 110, 130, 180), fill=BLUE)
    T(d, (95, 145), company[0], font('sansb', 38), (255, 255, 255, 255), 'mm')
    T(d, (152, 128), f'{company} · 2027届校园招聘', font('sansb', 30), INK, 'lm')
    T(d, (152, 168), '秋招进行中 · 网申截止 10月15日', font('sans', 18), GREY, 'lm')
    _badge(d, n)
    # job card
    rrect(d, (60, 224, LW - 60, LH - 30), 18, fill=rgb('#ffffff'), outline=LINE, width=2)
    T(d, (100, 270), title, font('sansb', 34), INK, 'lm')
    tags = ['北京', '本科及以上', '2027届', '薪资面议']
    tx = 100
    for tg in tags:
        w = text_w(tg, font('sans', 17)) + 28
        rrect(d, (tx, 305, tx + w, 339), 8, fill=rgb('#eef3ff'))
        T(d, (tx + 14, 322), tg, font('sans', 17), BLUE, 'lm')
        tx += w + 12
    T(d, (100, 380), '岗位职责', font('sansb', 21), INK, 'lm')
    for i, ln in enumerate(['1. 负责品牌线上推广与内容策划', '2. 协助完成市场调研与数据分析',
                            '3. 支持校园及线下活动落地执行']):
        T(d, (100, 414 + i * 30), ln, font('sans', 18), rgb('#4a5263'), 'lm')
    T(d, (100, 520), '任职要求', font('sansb', 21), INK, 'lm')
    for i, ln in enumerate(['1. 2027届本科及以上学历，985/211院校优先', '2. 有互联网大厂实习经历者优先',
                            '3. 抗压能力强，能适应快节奏工作']):
        T(d, (100, 554 + i * 30), ln, font('sans', 18), rgb('#4a5263'), 'lm')
    # apply button
    bx0, by0, bx1, by1 = LW - 380, LH - 150, LW - 100, LH - 70
    col = rgb('#1d56c9') if pressed else BLUE
    rrect(d, (bx0, by0 + (4 if pressed else 0), bx1, by1 + (4 if pressed else 0)), 16, fill=col)
    T(d, ((bx0 + bx1) / 2, (by0 + by1) / 2 + (4 if pressed else 0)), '投递简历', font('sansb', 34),
      (255, 255, 255, 255), 'mm')
    if dim > 0:
        ov = Image.new('RGBA', im.size, (10, 14, 24, int(160 * dim)))
        im = Image.alpha_composite(im, ov)
        d = ImageDraw.Draw(im)
    if cur is not None:
        cursor(d, cur[0], cur[1], 1.6, pressed)
    return im


def scr_success(company='星河科技', n=None, k=1.0):
    im = scr_job(company, n=n, dim=1.0)
    d = ImageDraw.Draw(im)
    s = 0.85 + 0.15 * k
    cx, cy = LW / 2, LH / 2 + 10
    w, h = 560 * s, 360 * s
    rrect(d, (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), 24, fill=rgb('#ffffff'))
    r = 52 * s
    d.ellipse((cx - r, cy - h / 2 + 50 * s, cx + r, cy - h / 2 + 50 * s + 2 * r), fill=rgb('#22b573'))
    ck = [(cx - 24 * s, cy - h / 2 + 102 * s), (cx - 6 * s, cy - h / 2 + 120 * s),
          (cx + 26 * s, cy - h / 2 + 86 * s)]
    d.line(ck, fill=(255, 255, 255, 255), width=int(10 * s), joint='curve')
    T(d, (cx, cy + 40 * s), '投递成功', font('sansb', int(40 * s)), INK, 'mm')
    T(d, (cx, cy + 92 * s), '感谢您的投递，请耐心等待筛选结果', font('sans', int(20 * s)), GREY, 'mm')
    return im


def scr_form(progress=1.0, n=None, company='远航集团'):
    im, d = _browser(f'网申 - {company}', f'hr.{DOMAIN.get(company, "jobs")}.com/apply/2027')
    _badge(d, n)
    steps = ['基本信息', '教育经历', '实习经历', '附加问题']
    for i, s in enumerate(steps):
        x = 140 + i * 230
        on = i <= int(progress * 3.999)
        d.ellipse((x - 18, 120, x + 18, 156), fill=BLUE if on else rgb('#cfd6e3'))
        T(d, (x, 138), str(i + 1), font('sansb', 20), (255, 255, 255, 255), 'mm')
        T(d, (x + 30, 138), s, font('sans', 19), INK if on else GREY, 'lm')
    fields = [('姓名', '林小满'), ('学校', '南州大学'), ('专业', '市场营销'), ('学历', '本科'),
              ('毕业时间', '2027年6月'), ('GPA', '3.42 / 4.0'),
              ('为什么选择我们？（500字）', '我从小就对贵公司的品牌充满向往……')]
    y = 210
    total = sum(len(v) for _, v in fields)
    shown = int(progress * total)
    for lab, val in fields:
        T(d, (140, y), lab, font('sans', 19), GREY, 'lm')
        big = lab.startswith('为什么')
        hh = 110 if big else 44
        rrect(d, (140, y + 20, LW - 140, y + 20 + hh), 10, fill=rgb('#ffffff'), outline=LINE, width=2)
        k = max(0, min(len(val), shown))
        shown -= len(val)
        T(d, (160, y + 42), val[:k], font('sans', 21), INK, 'lm')
        if 0 < k < len(val) or (k == len(val) and shown < 0 and shown > -3):
            tw = text_w(val[:k], font('sans', 21))
            d.line((162 + tw, y + 30, 162 + tw, y + 56), fill=BLUE, width=2)
        y += hh + 52
    return im


def scr_test(q=87, total=300, choice=None):
    im, d = _browser('在线测评', 'assess.talentq.cn/personality')
    T(d, (LW / 2, 150), '职业性格测评', font('sansb', 32), INK, 'mm')
    T(d, (LW / 2, 198), f'第 {q} / {total} 题', font('sans', 22), GREY, 'mm')
    d.rectangle((240, 230, LW - 240, 238), fill=rgb('#e3e6ec'))
    d.rectangle((240, 230, 240 + (LW - 480) * q / total, 238), fill=BLUE)
    T(d, (LW / 2, 320), '在团队中，你更倾向于：', font('sansb', 30), INK, 'mm')
    opts = ['A. 独立完成任务，对结果负责', 'B. 与他人协作，倾听不同意见',
            'C. 两者都可以，视情况而定', 'D. 我也不知道真实的自己是什么样']
    for i, o in enumerate(opts):
        y = 400 + i * 84
        sel = choice == i
        rrect(d, (260, y, LW - 260, y + 64), 14, fill=rgb('#eef3ff') if sel else rgb('#ffffff'),
              outline=BLUE if sel else LINE, width=2)
        T(d, (292, y + 32), o, font('sans', 23), INK, 'lm')
    return im


def scr_exam(secs=1799, n=None):
    im, d = _browser('笔试 · 行政职业能力测验', 'exam.recruit-online.cn/2027/aptitude')
    mm, ss = divmod(max(0, int(secs)), 60)
    rrect(d, (LW - 330, 104, LW - 40, 164), 12, fill=rgb('#fff0f0'), outline=rgb('#ffb3b3'), width=2)
    T(d, (LW - 185, 134), f'剩余 00:{mm:02d}:{ss:02d}', font('sansb', 28), rgb('#d93838'), 'mm')
    T(d, (80, 134), '第 23 / 120 题   数量关系', font('sansb', 24), INK, 'lm')
    q = '某单位秋季招聘，计划录用 30 人，共有 12000 人报名。若所有人机会均等，则每位报名者被录用的概率为：'
    for i, ln in enumerate(wrap(q, font('sans', 27), LW - 180)):
        T(d, (90, 230 + i * 44), ln, font('sans', 27), INK, 'lm')
    opts = ['A. 2.5%', 'B. 0.25%', 'C. 0.025%', 'D. 取决于你是不是 985']
    for i, o in enumerate(opts):
        y = 380 + i * 80
        rrect(d, (90, y, 700, y + 60), 12, fill=rgb('#ffffff'), outline=LINE, width=2)
        T(d, (116, y + 30), o, font('sans', 25), INK, 'lm')
    return im


INBOX = [
    ('星河科技', '感谢您的投递。很遗憾，您的简历未能通过筛选'),
    ('远航集团', '经慎重评估，您与该岗位暂不匹配'),
    ('蓝鲸互动', '很遗憾地通知您，本次招聘流程已结束'),
    ('北辰银行', '您的简历已进入我行人才库'),
    ('青橙智能', '岗位HC已满，感谢您的关注'),
    ('万象传媒', '感谢您参加笔试，很遗憾'),
    ('云启科技', '感谢您参与AI面试，综合评估后'),
    ('知行教育', '感谢您的投递，您的背景非常优秀，但'),
    ('海岳证券', '您好，本次校招已暂停'),
    ('明日出行', '感谢您的时间，我们决定推进其他候选人'),
    ('松果快消', '很遗憾，您未能进入下一轮'),
    ('长风物流', '感谢您的投递，岗位已关闭'),
]


def scr_inbox(n_mail=238, rows=INBOX, highlight=None):
    im, d = _browser('收件箱', 'mail.nzu.edu.cn/inbox')
    d.rectangle((0, 88, 240, LH), fill=rgb('#eaeef5'))
    T(d, (30, 130), f'收件箱  {n_mail}', font('sansb', 22), INK, 'lm')
    for i, s in enumerate(['星标邮件', '已发送', '草稿箱', '垃圾邮件']):
        T(d, (30, 180 + i * 44), s, font('sans', 19), GREY, 'lm')
    y = 100
    for i, (co, subj) in enumerate(rows):
        bg = rgb('#fff8e6') if highlight == i else rgb('#ffffff')
        d.rectangle((240, y, LW, y + 56), fill=bg)
        d.line((240, y + 56, LW, y + 56), fill=LINE)
        T(d, (270, y + 28), co, font('sansb', 19), INK, 'lm')
        T(d, (420, y + 28), ellipsize(subj + '……', font('sans', 19), LW - 580), font('sans', 19),
          rgb('#4a5263'), 'lm')
        T(d, (LW - 30, y + 28), f'10/{28 - i}', font('sans', 16), GREY, 'rm')
        y += 57
    return im


def scr_ai(t=0.0, secs=60, eye=1.0, pupil=(0.0, 0.0), stats=None, warn=None, end=False):
    """AI video interview. t = 0..1 progress. eye = openness/size of the AI eye."""
    im = Image.new('RGBA', (LW, LH), rgb('#0b1020'))
    d = ImageDraw.Draw(im)
    T(d, (40, 40), '云启科技 · AI 视频面试', font('sansb', 26), rgb('#cfe0ff'), 'lm')
    d.ellipse((LW - 180, 30, LW - 162, 48), fill=rgb('#ff3b3b'))
    T(d, (LW - 150, 40), 'REC', font('sansb', 20), rgb('#ff6b6b'), 'lm')
    if end:
        T(d, (LW / 2, LH / 2 - 40), '面试已结束', font('sansb', 56), rgb('#e6eeff'), 'mm')
        T(d, (LW / 2, LH / 2 + 40), '感谢您的参与 · 结果将在 3 个工作日内通知', font('sans', 26),
          rgb('#8fa3c7'), 'mm')
        return im
    # the eye
    cx, cy = 520, 360
    R = 190 * (0.8 + 0.4 * eye)
    glow = Image.new('RGBA', (LW, LH), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(6):
        rr = R + 30 + i * 22
        gd.ellipse((cx - rr, cy - rr * 0.62, cx + rr, cy + rr * 0.62), outline=(80, 150, 255, 70 - i * 10),
                   width=6)
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    im = Image.alpha_composite(im, glow)
    d = ImageDraw.Draw(im)
    d.ellipse((cx - R, cy - R * 0.6, cx + R, cy + R * 0.6), fill=rgb('#dce9ff'))
    ir = R * 0.46
    px, py = cx + pupil[0] * R * 0.35, cy + pupil[1] * R * 0.2
    d.ellipse((px - ir, py - ir, px + ir, py + ir), fill=rgb('#2a6bff'))
    for k in range(24):
        a = k / 24 * 2 * math.pi
        d.line((px + math.cos(a) * ir * 0.45, py + math.sin(a) * ir * 0.45,
                px + math.cos(a) * ir * 0.95, py + math.sin(a) * ir * 0.95), fill=rgb('#5d8fff'), width=3)
    pr = ir * 0.42
    d.ellipse((px - pr, py - pr, px + pr, py + pr), fill=rgb('#050810'))
    d.ellipse((px - pr * 0.9 + pr * 0.5, py - pr * 0.9, px - pr * 0.9 + pr * 1.0, py - pr * 0.4),
              fill=(255, 255, 255, 230))
    # question + timer
    T(d, (cx, 640), '请用 60 秒介绍你自己，并说明你为什么适合这个岗位。', font('sans', 27),
      rgb('#e6eeff'), 'mm')
    s = max(0, int(secs))
    col = rgb('#ff4d4d') if s <= 10 else rgb('#e6eeff')
    T(d, (cx, 710), f'00:{s:02d}', font('sansb', 44), col, 'mm')
    d.rectangle((cx - 300, 748, cx + 300, 754), fill=rgb('#1c2745'))
    d.rectangle((cx - 300, 748, cx - 300 + 600 * (1 - s / 60.0), 754), fill=rgb('#ff4d4d') if s <= 10
                else rgb('#4d8bff'))
    # analysis panel
    x0 = 900
    rrect(d, (x0, 110, LW - 36, LH - 40), 18, fill=rgb('#111a31'), outline=rgb('#22305a'), width=2)
    T(d, (x0 + 28, 150), '实时评估', font('sansb', 26), rgb('#cfe0ff'), 'lm')
    stats = stats or {}
    rows = [('表情自信度', stats.get('conf', 0.41)), ('眼神接触', stats.get('eye', 0.3)),
            ('语速稳定性', stats.get('pace', 0.35)), ('关键词匹配', stats.get('kw', 0.23))]
    y = 205
    for lab, val in rows:
        T(d, (x0 + 28, y), lab, font('sans', 20), rgb('#8fa3c7'), 'lm')
        T(d, (LW - 60, y), f'{int(val * 100)}%', font('sansb', 20),
          rgb('#ff6b6b') if val < 0.4 else rgb('#cfe0ff'), 'rm')
        rrect(d, (x0 + 28, y + 20, LW - 60, y + 30), 5, fill=rgb('#1c2745'))
        rrect(d, (x0 + 28, y + 20, x0 + 28 + (LW - 88 - x0) * val, y + 30), 5,
              fill=rgb('#ff6b6b') if val < 0.4 else rgb('#4d8bff'))
        y += 70
    tags = stats.get('tags', ['表情紧张', '语速偏快'])
    y += 10
    for tg in tags:
        rrect(d, (x0 + 28, y, x0 + 28 + text_w(tg, font('sans', 19)) + 30, y + 38), 10,
              fill=rgb('#3a1620'), outline=rgb('#ff4d4d'))
        T(d, (x0 + 43, y + 19), tg, font('sans', 19), rgb('#ff8a8a'), 'lm')
        y += 50
    total = stats.get('score', 61)
    T(d, (x0 + 28, LH - 90), '综合评分', font('sans', 20), rgb('#8fa3c7'), 'lm')
    T(d, (LW - 60, LH - 90), str(total), font('sansb', 48), rgb('#ff6b6b') if total < 70 else
      rgb('#cfe0ff'), 'rm')
    if warn:
        rrect(d, (cx - 250, 80, cx + 250, 130), 12, fill=rgb('#ff4d4d'))
        T(d, (cx, 105), warn, font('sansb', 24), (255, 255, 255, 255), 'mm')
    return im


def scr_off():
    return Image.new('RGBA', (LW, LH), (0, 0, 0, 255))


# =============================================================================
# PHONE SCREENS  (720 x 1560)
# =============================================================================
PW, PH = 720, 1560


def _wallpaper(dark=0.0, seed=2):
    im = Image.new('RGBA', (PW, PH))
    a = np.zeros((PH, PW, 4), np.float32)
    yy = np.linspace(0, 1, PH)[:, None]
    top = np.array([62, 82, 128])
    bot = np.array([222, 160, 110])
    col = top * (1 - yy[..., None]) + bot * yy[..., None]
    a[..., :3] = col * (1 - dark)
    a[..., 3] = 255
    im = Image.fromarray(a.astype(np.uint8), 'RGBA')
    d = ImageDraw.Draw(im)
    # a small ginkgo leaf drawn on the wallpaper
    cx, cy, r = PW * 0.7, PH * 0.8, 130
    leaf = (int(240 * (1 - dark)), int(190 * (1 - dark)), int(70 * (1 - dark)), 255)
    pts = [(cx, cy)]
    for k in range(41):
        a = math.radians(205 + 130 * k / 40)
        rr = r * (1 - 0.28 * math.exp(-((k - 20) / 3.0) ** 2)) * (1 + 0.04 * math.sin(k * 1.7))
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    d.polygon(pts, fill=leaf)
    d.line((cx, cy - 4, cx + 14, cy + 170), fill=leaf, width=7)
    return im


def ph_lock(time_str='02:13', date_str='11月3日 星期二', notes=(), dark=0.35, lit=1.0, n_more=0):
    im = _wallpaper(dark)
    d = ImageDraw.Draw(im)
    T(d, (PW / 2, 150), date_str, font('sans', 34), (255, 255, 255, 235), 'mm')
    T(d, (PW / 2, 280), time_str, font('sansb', 170), (255, 255, 255, 245), 'mm')
    y = 470
    for i, (app, title, body) in enumerate(notes):
        card = Image.new('RGBA', (PW - 60, 190), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card)
        rrect(cd, (0, 0, PW - 60, 184), 34, fill=(245, 245, 248, 225))
        rrect(cd, (26, 26, 82, 82), 14, fill=rgb('#3c82f6'))
        cd.rectangle((36, 42, 72, 68), outline=(255, 255, 255, 255), width=3)
        cd.line((36, 42, 54, 58, 72, 42), fill=(255, 255, 255, 255), width=3)
        T(cd, (100, 54), app, font('sans', 26), rgb('#6b7280'), 'lm')
        T(cd, (PW - 90, 54), '刚刚' if i == 0 else f'{i * 3}分钟前', font('sans', 24), rgb('#9ca3af'), 'rm')
        T(cd, (30, 110), ellipsize(title, font('sansb', 30), PW - 130), font('sansb', 30), rgb('#111827'), 'lm')
        T(cd, (30, 152), ellipsize(body, font('sans', 27), PW - 130), font('sans', 27), rgb('#374151'), 'lm')
        im.alpha_composite(card, (30, y))
        y += 204
        if y > PH - 260:
            break
    if n_more:
        T(d, (PW / 2, min(y + 26, PH - 90)), f'还有 {n_more} 条通知', font('sans', 26),
          (255, 255, 255, 220), 'mm')
    d.rounded_rectangle((PW / 2 - 120, PH - 40, PW / 2 + 120, PH - 30), 5, fill=(255, 255, 255, 200))
    if lit < 1.0:
        ov = Image.new('RGBA', im.size, (0, 0, 0, int(255 * (1 - lit))))
        im = Image.alpha_composite(im, ov)
    return im


def ph_call(name='妈妈', t=0.0, connected_secs=None):
    im = _wallpaper(0.55)
    im = im.filter(ImageFilter.GaussianBlur(20))
    d = ImageDraw.Draw(im)
    r = 110
    d.ellipse((PW / 2 - r, 260 - r, PW / 2 + r, 260 + r), fill=rgb('#f3d9b1'))
    T(d, (PW / 2, 262), name[0], font('sansb', 110), rgb('#9a6b36'), 'mm')
    T(d, (PW / 2, 470), name, font('sansb', 76), (255, 255, 255, 255), 'mm')
    if connected_secs is None:
        T(d, (PW / 2, 560), '手机 · 来电', font('sans', 32), (255, 255, 255, 210), 'mm')
        pulse = 0.5 + 0.5 * math.sin(t * 2 * math.pi)
        for cx, col, lab in ((190, '#ff3b30', '拒绝'), (530, '#34c759', '接听')):
            rr = 72 + (10 * pulse if lab == '接听' else 0)
            d.ellipse((cx - rr, 1290 - rr, cx + rr, 1290 + rr), fill=rgb(col))
            T(d, (cx, 1410), lab, font('sans', 30), (255, 255, 255, 235), 'mm')
            if lab == '拒绝':
                d.line((cx - 30, 1290, cx + 30, 1290), fill=(255, 255, 255, 255), width=12)
            else:
                d.arc((cx - 30, 1260, cx + 30, 1320), 200, 340, fill=(255, 255, 255, 255), width=12)
    else:
        m, s = divmod(int(connected_secs), 60)
        T(d, (PW / 2, 560), f'{m:02d}:{s:02d}', font('sans', 38), (255, 255, 255, 230), 'mm')
        for i, lab in enumerate(['静音', '拨号键盘', '免提']):
            cx = 170 + i * 190
            d.ellipse((cx - 62, 1000 - 62, cx + 62, 1000 + 62), fill=(255, 255, 255, 60))
            T(d, (cx, 1100), lab, font('sans', 26), (255, 255, 255, 220), 'mm')
        d.ellipse((PW / 2 - 72, 1290 - 72, PW / 2 + 72, 1290 + 72), fill=rgb('#ff3b30'))
        d.line((PW / 2 - 30, 1290, PW / 2 + 30, 1290), fill=(255, 255, 255, 255), width=12)
    return im


MOMENTS = [
    ('王同学', 'offer get！感恩一路帮助我的人', '#e8a33d', 'offer'),
    ('室友阿杰', '上岸了！！！三年没白熬', '#4c9be8', 'land'),
    ('学委', '三方已签，江湖再见～', '#d65b5b', 'sign'),
    ('陈一鸣', '拿到SP了，秋招圆满结束', '#58b37e', 'offer'),
    ('表姐', '入职第一天，工牌好看吗', '#9b6bd6', 'badge'),
    ('张可', '谢谢自己没有放弃', '#e07a9a', 'sun'),
]


def _pic(kind, w, h, color):
    im = Image.new('RGBA', (w, h), rgb(color))
    d = ImageDraw.Draw(im)
    if kind == 'offer':
        rrect(d, (w * 0.18, h * 0.12, w * 0.82, h * 0.9), 8, fill=(255, 255, 255, 255))
        T(d, (w / 2, h * 0.28), 'OFFER', font('sansb', int(h * 0.16)), rgb('#333333'), 'mm')
        for k in range(4):
            d.line((w * 0.28, h * (0.45 + k * 0.1), w * 0.72, h * (0.45 + k * 0.1)), fill=rgb('#bbbbbb'), width=3)
    elif kind == 'land':
        d.polygon([(0, h), (w * 0.35, h * 0.35), (w * 0.6, h * 0.7), (w * 0.8, h * 0.45), (w, h)],
                  fill=(255, 255, 255, 120))
        d.ellipse((w * 0.62, h * 0.12, w * 0.82, h * 0.32), fill=(255, 240, 180, 255))
    elif kind == 'sign':
        rrect(d, (w * 0.15, h * 0.2, w * 0.85, h * 0.85), 8, fill=(255, 255, 255, 255))
        d.line((w * 0.3, h * 0.65, w * 0.45, h * 0.55, w * 0.55, h * 0.7, w * 0.72, h * 0.5), fill=rgb('#1f3a93'), width=5)
    elif kind == 'badge':
        rrect(d, (w * 0.3, h * 0.15, w * 0.7, h * 0.88), 10, fill=(255, 255, 255, 255))
        d.ellipse((w * 0.42, h * 0.25, w * 0.58, h * 0.45), fill=rgb('#cccccc'))
    else:
        d.ellipse((w * 0.3, h * 0.2, w * 0.7, h * 0.8), fill=(255, 230, 150, 255))
    return im


def ph_moments(scroll=0.0):
    im = Image.new('RGBA', (PW, PH), rgb('#ffffff'))
    d = ImageDraw.Draw(im)
    y0 = 40 - scroll
    # cover
    cover = _wallpaper(0.2).resize((PW, 460)).crop((0, 0, PW, 460))
    im.alpha_composite(cover, (0, int(y0)))
    T(d, (PW - 190, y0 + 420), '林小满', font('sansb', 34), (255, 255, 255, 255), 'rm')
    rrect(d, (PW - 170, y0 + 370, PW - 40, y0 + 500), 16, fill=rgb('#f0c060'))
    y = y0 + 560
    for i in range(12):
        name, txt, col, kind = MOMENTS[i % len(MOMENTS)]
        if y > PH:
            break
        if y + 400 > 0:
            rrect(d, (36, y, 136, y + 100), 14, fill=rgb(col))
            T(d, (86, y + 50), name[0], font('sansb', 48), (255, 255, 255, 255), 'mm')
            T(d, (160, y + 26), name, font('sansb', 32), rgb('#576b95'), 'lm')
            T(d, (160, y + 80), txt, font('sans', 32), rgb('#111111'), 'lm')
            pic = _pic(kind, 300, 300, col)
            im.alpha_composite(pic, (160, int(y + 120)))
            T(d, (160, y + 460), f'{(i + 1) * 7}分钟前', font('sans', 24), rgb('#9aa0a6'), 'lm')
        y += 520
        d.line((36, y - 26, PW - 36, y - 26), fill=rgb('#eeeeee'), width=2)
    return im


def ph_black():
    return Image.new('RGBA', (PW, PH), (0, 0, 0, 255))


# =============================================================================
# PAPER PROPS
# =============================================================================
MONTHS = {9: ('九月', 'SEPTEMBER', 1, 30), 10: ('十月', 'OCTOBER', 3, 31), 11: ('十一月', 'NOVEMBER', 6, 30)}


def ink_circle(d, cx, cy, rx, ry, col, width=6, seed=0, turns=1.15):
    rng = random.Random(seed)
    pts = []
    a0 = rng.uniform(0, 6.28)
    n = 60
    for k in range(n + 1):
        a = a0 + turns * 2 * math.pi * k / n
        wob = 1 + 0.06 * math.sin(a * 3 + seed) + rng.uniform(-0.01, 0.01)
        pts.append((cx + math.cos(a) * rx * wob, cy + math.sin(a) * ry * wob))
    d.line(pts, fill=col, width=width, joint='curve')


def ink_x(d, cx, cy, r, col, width=6, seed=0):
    rng = random.Random(seed)
    j = lambda: rng.uniform(-r * 0.15, r * 0.15)
    d.line((cx - r + j(), cy - r + j(), cx + r + j(), cy + r + j()), fill=col, width=width)
    d.line((cx + r + j(), cy - r + j(), cx - r + j(), cy + r + j()), fill=col, width=width)


def calendar(month=9, marks='start', seed=0):
    W, H = 800, 1000
    im = Image.new('RGBA', (W, H), rgb('#f7f3ea'))
    d = ImageDraw.Draw(im)
    cn, en, first_wd, ndays = MONTHS[month]
    # binding
    d.rectangle((0, 0, W, 60), fill=rgb('#b6403a'))
    for k in range(12):
        x = 50 + k * 64
        d.ellipse((x - 9, 18, x + 9, 36), fill=rgb('#2b2b2b'))
    T(d, (60, 120), '2026', font('sans', 34), rgb('#8a8378'), 'lm')
    T(d, (60, 205), cn, font('serifb', 96), rgb('#2b2622'), 'lm')
    T(d, (W - 60, 214), en, font('sans', 30), rgb('#8a8378'), 'rm')
    heads = ['日', '一', '二', '三', '四', '五', '六']
    x0, y0, cw, ch = 60, 300, (W - 120) / 7, 104
    for i, h in enumerate(heads):
        T(d, (x0 + cw * i + cw / 2, y0), h, font('sansb', 28), rgb('#b6403a') if i in (0, 6) else
          rgb('#5a534b'), 'mm')
    wd = (first_wd + 1) % 7   # python weekday (Mon=0) -> Sunday-first column
    red = (205, 40, 40, 255)
    for day in range(1, ndays + 1):
        idx = wd + day - 1
        r, c = divmod(idx, 7)
        cx = x0 + cw * c + cw / 2
        cy = y0 + 70 + r * ch
        T(d, (cx, cy), str(day), font('sans', 36), rgb('#b6403a') if c in (0, 6) else rgb('#2b2622'), 'mm')
        if marks == 'x' and day <= 31:
            ink_x(d, cx, cy, 26, red, 5, seed=day + month * 40)
        if marks == 'q' and day <= 12:
            ink_x(d, cx, cy, 24, red, 5, seed=day + month * 40)
        if marks == 'start' and day == 1:
            ink_circle(d, cx, cy, 40, 34, red, 6, seed=3)
    if marks == 'start':
        T(d, (x0 + cw * 3.0, 122), '秋招开始！冲！', font('handb', 40), red, 'lm')
        ax, ay = x0 + cw * 2.5, y0 + 70
        d.line([(x0 + cw * 3.0 + 10, 150), (x0 + cw * 2.9, 220), (ax + 18, ay - 44)], fill=red, width=5,
               joint='curve')
        d.line([(ax + 18, ay - 44), (ax + 30, ay - 66)], fill=red, width=5)
        d.line([(ax + 18, ay - 44), (ax + 2, ay - 62)], fill=red, width=5)
    if marks == 'x':
        T(d, (W - 90, H - 110), '？', font('handb', 60), red, 'mm')
    d.line((60, H - 60, W - 60, H - 60), fill=rgb('#d8d0c2'), width=2)
    T(d, (W / 2, H - 34), '金九银十 · 好运常在', font('serif', 26), rgb('#9a9185'), 'mm')
    return paper_grain(im, 6, seed=month)


STICKY_COL = {'y': '#f7e27a', 'p': '#f4a9b8', 'b': '#a9d8f4', 'g': '#b9e6a5', 'o': '#f8c58a'}


def sticky(lines, color='y', seed=0, strike=None, size=256):
    im = Image.new('RGBA', (size, size), rgb(STICKY_COL.get(color, color)))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, size, size * 0.12), fill=tuple(int(c * 0.93) for c in rgb(STICKY_COL.get(color, color))[:3]) + (255,))
    n = len(lines)
    fs = int(size * (0.2 if n <= 2 else 0.15))
    y = size * 0.52 - (n - 1) * fs * 0.62
    for i, ln in enumerate(lines):
        T(d, (size / 2, y + i * fs * 1.25), ln, font('handb', fs), (40, 38, 50, 255), 'mm')
        if strike and i in strike:
            w = text_w(ln, font('handb', fs))
            d.line((size / 2 - w / 2 - 6, y + i * fs * 1.25, size / 2 + w / 2 + 6, y + i * fs * 1.25 - 4),
                   fill=(200, 40, 40, 255), width=max(3, size // 60))
    return paper_grain(im, 5, seed=seed)


def envelope(seed=0, company=None):
    W, H = 512, 320
    rng = random.Random(seed)
    base = rng.choice(['#efe6d2', '#f3efe6', '#e8dcc2', '#f1ece0'])
    im = Image.new('RGBA', (W, H), rgb(base))
    d = ImageDraw.Draw(im)
    # flap shadow lines
    d.line((0, 0, W / 2, H * 0.55, W, 0), fill=tuple(int(c * 0.9) for c in rgb(base)[:3]) + (255,), width=3)
    for k in range(3):
        d.line((70, 200 + k * 30, 70 + rng.uniform(180, 300), 200 + k * 30), fill=(120, 110, 100, 255), width=3)
    # postage stamp
    d.rectangle((W - 110, 24, W - 30, 118), fill=rgb('#d9e4ef'), outline=rgb('#8aa0b8'), width=2)
    # red seal
    sc = Image.new('RGBA', (220, 220), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sc)
    red = (196, 30, 36, 235)
    sd.ellipse((10, 10, 210, 210), outline=red, width=10)
    sd.ellipse((28, 28, 192, 192), outline=red, width=3)
    T(sd, (110, 112), '很遗憾', font('serifb', 50), red, 'mm')
    if company:
        T(sd, (110, 58), company, font('sans', 22), red, 'mm')
    # ink gaps
    a = np.asarray(sc).copy()
    mask = np.random.default_rng(seed).random(a.shape[:2]) < 0.18
    a[mask, 3] = (a[mask, 3] * 0.3).astype(np.uint8)
    sc = Image.fromarray(a, 'RGBA').rotate(rng.uniform(-25, 25), resample=Image.BICUBIC)
    im.alpha_composite(sc, (int(W * 0.44 + rng.uniform(-20, 20)), int(40 + rng.uniform(-10, 10))))
    return paper_grain(im, 6, seed=seed)


def book_spine(title, color, seed=0, w=128, h=640):
    im = Image.new('RGBA', (w, h), rgb(color))
    d = ImageDraw.Draw(im)
    light = tuple(min(255, int(c * 1.25)) for c in rgb(color)[:3]) + (255,)
    d.rectangle((0, 40, w, 52), fill=light)
    d.rectangle((0, h - 60, w, h - 48), fill=light)
    fs = int(w * 0.46)
    y = 90
    for ch in title:
        T(d, (w / 2, y), ch, font('sansb', fs), (255, 255, 255, 240), 'mm')
        y += fs * 1.08
    return paper_grain(im, 8, seed=seed)


def noodle_label(seed=0):
    W, H = 1024, 256
    im = Image.new('RGBA', (W, H), rgb('#f4efe4'))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 70), fill=rgb('#c8261e'))
    d.rectangle((0, H - 50, W, H), fill=rgb('#c8261e'))
    for k in range(2):
        x = 60 + k * 512
        T(d, (x, 130), '好面', font('serifb', 80), rgb('#c8261e'), 'lm')
        T(d, (x + 190, 110), '红烧牛肉面', font('sansb', 40), rgb('#3a2a1a'), 'lm')
        T(d, (x + 190, 160), '大桶 · 加量不加价', font('sans', 26), rgb('#6a5a4a'), 'lm')
        d.ellipse((x + 420, 96, x + 500, 176), fill=rgb('#e0a040'))
    return paper_grain(im, 6, seed=seed)


def notebook(text='', progress=1.0, seed=0, strike=False):
    W, H = 700, 900
    im = Image.new('RGBA', (W, H), rgb('#fbf8f0'))
    d = ImageDraw.Draw(im)
    for k in range(18):
        y = 120 + k * 44
        d.line((40, y, W - 40, y), fill=rgb('#c9d6e8'), width=2)
    d.line((110, 0, 110, H), fill=rgb('#e8a0a0'), width=2)
    n = int(len(text) * progress)
    f = font('hand', 62)
    x, y = 140, 120 - 30
    shown = text[:n]
    lines = shown.split('\n')
    for i, ln in enumerate(lines):
        T(d, (x, y + i * 88 + 30), ln, f, (38, 40, 70, 255), 'ls')
    if strike:
        w = text_w(text.split('\n')[0], f)
        d.line((x - 10, y + 12, x + w + 10, y + 4), fill=(38, 40, 70, 255), width=6)
    return paper_grain(im, 5, seed=seed)


def strip(word, seed=0, color=None):
    rng = random.Random(seed)
    f = font('handb', 110) if rng.random() < 0.5 else font('sansb', 100)
    w = int(text_w(word, f) + 90)
    H = 170
    base = color or rng.choice(['#f5f1e6', '#fbf6e9', '#f0ece3', '#f6efe0', '#ffffff'])
    im = Image.new('RGBA', (w, H), rgb(base))
    d = ImageDraw.Draw(im)
    ink = rng.choice([(30, 30, 36, 255), (160, 30, 30, 255), (40, 40, 70, 255)])
    T(d, (w / 2, H / 2 + 4), word, f, ink, 'mm')
    return paper_grain(im, 8, seed=seed)


def moment_card(name, text, color, seed=0):
    W, H = 640, 200
    im = Image.new('RGBA', (W, H), rgb('#ffffff'))
    d = ImageDraw.Draw(im)
    rrect(d, (24, 30, 164, 170), 16, fill=rgb(color))
    T(d, (94, 100), name[0], font('sansb', 70), (255, 255, 255, 255), 'mm')
    T(d, (190, 62), name, font('sansb', 38), rgb('#576b95'), 'lm')
    T(d, (190, 130), ellipsize(text, font('sans', 40), W - 210), font('sans', 40), rgb('#111111'), 'lm')
    return paper_grain(im, 4, seed=seed)


def sign(title='人才库', sub='TALENT POOL · 请保持安静，耐心等待'):
    W, H = 1024, 512
    im = Image.new('RGBA', (W, H), rgb('#f6f4ee'))
    d = ImageDraw.Draw(im)
    rrect(d, (16, 16, W - 16, H - 16), 30, outline=rgb('#1f6f8b'), width=14)
    T(d, (W / 2, H / 2 - 40), title, font('sansb', 190), rgb('#1f6f8b'), 'mm')
    T(d, (W / 2, H - 90), sub, font('sans', 44), rgb('#4b8aa0'), 'mm')
    return paper_grain(im, 5, seed=11)


def photo():
    W, H = 300, 360
    im = Image.new('RGBA', (W, H), rgb('#fbfaf6'))
    d = ImageDraw.Draw(im)
    d.rectangle((20, 20, W - 20, H - 80), fill=rgb('#9cc6e0'))
    d.polygon([(20, H - 80), (110, 150), (170, 220), (230, 130), (W - 20, H - 80)], fill=rgb('#6f9a6a'))
    d.rectangle((20, H - 120, W - 20, H - 80), fill=rgb('#e3c46b'))
    T(d, (W / 2, H - 40), '家', font('handb', 40), rgb('#555555'), 'mm')
    return paper_grain(im, 6, seed=4)


def countdown_sheet():
    W, H = 400, 520
    im = Image.new('RGBA', (W, H), rgb('#ffffff'))
    d = ImageDraw.Draw(im)
    T(d, (W / 2, 70), '毕业倒计时', font('sansb', 48), rgb('#333333'), 'mm')
    T(d, (W / 2, 250), '278', font('sansb', 170), rgb('#c62828'), 'mm')
    T(d, (W / 2, 390), '天', font('sansb', 50), rgb('#333333'), 'mm')
    T(d, (W / 2, 470), '2027.06.30', font('sans', 32), rgb('#777777'), 'mm')
    return paper_grain(im, 5, seed=5)


def buildings(night=True, seed=1):
    """Silhouette of dorm blocks across the road, RGBA with lit windows at night."""
    W, H = 2048, 800
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    rng = random.Random(seed)
    x = 0
    while x < W:
        bw = rng.randint(260, 460)
        bh = rng.randint(380, 700)
        top = H - bh
        col = (38, 44, 64, 255) if night else (176, 170, 160, 255)
        d.rectangle((x, top, x + bw, H), fill=col)
        for yy in range(top + 40, H - 30, 58):
            for xx in range(x + 24, x + bw - 30, 52):
                if night:
                    on = rng.random() < 0.55
                    c = (255, 214, 140, 255) if on else (54, 60, 84, 255)
                    if on and rng.random() < 0.25:
                        c = (200, 225, 255, 255)
                else:
                    c = (140, 150, 160, 255)
                d.rectangle((xx, yy, xx + 26, yy + 32), fill=c)
        x += bw + rng.randint(20, 80)
    return im


def keyboard():
    W, H = 1024, 400
    im = Image.new('RGBA', (W, H), rgb('#9aa0a8'))
    d = ImageDraw.Draw(im)
    rows = [14, 14, 13, 12, 11]
    kh = 62
    for r, n in enumerate(rows):
        y = 20 + r * (kh + 10)
        kw = (W - 40 - (n - 1) * 8) / n
        for k in range(n):
            x = 20 + k * (kw + 8)
            rrect(d, (x, y, x + kw, y + kh), 8, fill=rgb('#2c2f35'))
    rrect(d, (260, 20 + 5 * 72 - 8, W - 260, 20 + 5 * 72 + 30), 8, fill=rgb('#2c2f35'))
    return im


def wood_grain_sticker():
    """tiny round sticker on the laptop lid: a hand-drawn ginkgo"""
    W = 256
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((8, 8, W - 8, W - 8), fill=rgb('#f6efe0'))
    cx, cy, r = W / 2, W * 0.58, 80
    pts = [(cx, cy)]
    for k in range(41):
        a = math.radians(205 + 130 * k / 40)
        rr = r * (1 - 0.28 * math.exp(-((k - 20) / 3.0) ** 2))
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    d.polygon(pts, fill=rgb('#e7b53a'))
    d.line((cx, cy, cx + 6, cy + 70), fill=rgb('#c99a2a'), width=6)
    return im


def envelope_collage(size=2048, n=150, seed=5):
    """A heap of rejection envelopes seen from above (texture for the paper mound)."""
    rng = random.Random(seed)
    im = Image.new('RGBA', (size, size), rgb('#d9cfbb'))
    cos = ['星河科技', '远航集团', '蓝鲸互动', '北辰银行', '青橙智能', '万象传媒', '云启科技', '知行教育']
    small = [envelope(seed=k, company=cos[k % 8]).resize((250, 156), Image.BICUBIC) for k in range(8)]
    for k in range(n):
        e = small[rng.randrange(8)].rotate(rng.uniform(0, 360), expand=True, resample=Image.BICUBIC)
        # soft shadow
        sh = Image.new('RGBA', e.size, (0, 0, 0, 0))
        sh.putalpha(e.getchannel('A').point(lambda a: int(a * 0.35)))
        x, y = rng.randrange(-120, size - 80), rng.randrange(-120, size - 80)
        im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)), (x + 6, y + 8)) if x + 6 >= 0 and y + 8 >= 0 else None
        if x >= 0 and y >= 0:
            im.alpha_composite(e, (x, y))
        else:
            im.paste(e, (x, y), e)
    return im
