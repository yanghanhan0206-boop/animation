// Gold line drawings, one stroke list each, in a 1000×1000 box. Strokes are drawn in
// order at constant pen speed, so the order is the order the "hand" draws them.

export type Drawing = {id: string; strokes: string[]};

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy}`;

const flame = (x: number, y: number, s = 1) =>
  `M${x} ${y} C${x - 9 * s} ${y - 12 * s} ${x - 6 * s} ${y - 24 * s} ${x} ${y - 36 * s} C${x + 6 * s} ${y - 24 * s} ${x + 9 * s} ${y - 12 * s} ${x} ${y}`;

const drop = (x: number, y: number, h: number) =>
  `M${x} ${y} V${y + h} M${x} ${y + h} L${x + 7} ${y + h + 13} L${x} ${y + h + 28} L${x - 7} ${y + h + 13} Z`;

/** The wedding she walked out of: a dress left on its hanger. */
export const DRESS: Drawing = {
  id: 'dress',
  strokes: [
    'M500 152 V132 C500 112 518 104 530 113 C542 122 536 139 521 140',
    'M368 208 L500 152 L632 208',
    'M424 196 C420 232 412 262 404 292',
    'M576 196 C580 232 588 262 596 292',
    'M404 292 C430 272 470 274 500 298 C530 274 570 272 596 292',
    'M404 292 C410 344 428 392 440 422',
    'M596 292 C590 344 572 392 560 422',
    'M440 422 C470 432 530 432 560 422',
    'M470 426 C456 444 468 458 486 448 M530 426 C544 444 532 458 514 448',
    'M440 422 C398 560 330 720 268 872',
    'M560 422 C602 560 670 720 732 872',
    'M268 872 C330 902 398 882 450 902 C502 920 560 892 612 906 C662 920 702 894 732 872',
    'M482 434 C470 584 432 742 404 888',
    'M518 434 C540 584 580 742 610 904',
    'M500 436 C500 604 506 762 500 912',
  ],
};

/** Her house: a crystal chandelier. */
export const CHANDELIER: Drawing = {
  id: 'chandelier',
  strokes: [
    'M500 40 V150',
    'M462 44 Q500 26 538 44',
    'M500 150 C482 172 518 196 500 218 C482 240 518 262 500 284',
    'M290 352 A210 36 0 1 0 710 352 A210 36 0 1 0 290 352',
    'M500 388 C430 432 336 424 312 352',
    'M500 388 C570 432 664 424 688 352',
    'M500 372 C460 392 418 384 404 340',
    'M500 372 C540 392 582 384 596 340',
    'M312 352 V300 M296 300 H328',
    'M404 340 V292 M390 292 H418',
    'M500 316 V270 M486 270 H514',
    'M596 340 V292 M582 292 H610',
    'M688 352 V300 M672 300 H704',
    flame(312, 296),
    flame(404, 288),
    flame(500, 266),
    flame(596, 288),
    flame(688, 296),
    drop(340, 384, 34),
    drop(392, 392, 64),
    drop(446, 396, 92),
    drop(554, 396, 92),
    drop(608, 392, 64),
    drop(660, 384, 34),
    'M500 388 C524 430 476 462 500 520',
    circle(500, 540, 20),
    drop(500, 560, 40),
  ],
};

/** The wedding she walked out of: a veil caught in the wind. */
export const VEIL: Drawing = {
  id: 'veil',
  strokes: [
    'M430 170 C462 148 538 148 570 170',
    'M446 168 C452 150 466 146 474 160 M486 156 C492 138 508 138 514 156 M526 160 C534 146 548 150 554 168',
    'M452 176 C392 290 318 430 262 600 C232 690 252 790 330 790 C398 790 420 728 478 760 C540 794 560 860 640 846 C730 830 770 740 744 640 C716 530 640 360 548 176',
    'M494 182 C470 360 436 560 452 768',
    'M512 182 C542 360 590 540 610 800',
    'M474 180 C430 330 360 500 322 700',
    'M530 180 C600 320 690 480 712 650',
    'M330 790 C346 806 362 814 382 812',
    'M640 846 C660 842 678 832 694 818',
  ],
};

/** The apartment door, light under it. */
export const DOOR: Drawing = {
  id: 'door',
  strokes: [
    'M330 900 V130 H670 V900',
    'M352 900 V152 H648 V900',
    'M396 212 H604 V478 H396 Z',
    'M396 536 H604 V836 H396 Z',
    'M452 168 H548 V200 H452 Z',
    circle(620, 516, 13),
    'M612 540 C616 556 624 556 628 540',
    'M240 900 H760',
    'M352 892 H648',
  ],
};

/** Two cups; the steam from each finds the other. */
export const CUPS: Drawing = {
  id: 'cups',
  strokes: [
    'M250 520 H470 L452 712 C448 738 430 750 404 750 H316 C290 750 272 738 268 712 Z',
    'M466 560 C540 556 548 650 458 660',
    'M200 770 C300 794 420 794 520 770',
    'M540 540 H740 L724 714 C720 738 704 748 680 748 H600 C576 748 560 738 556 714 Z',
    'M552 580 C484 576 476 664 560 672',
    'M500 784 C590 806 700 806 790 784',
    // Steam: one wisp from each cup; they cross once and rise apart, open-ended.
    'M360 482 C336 440 380 410 392 372 C404 334 470 318 512 290 C548 266 560 236 540 204',
    'M640 500 C664 460 620 430 606 392 C592 356 530 330 490 306 C452 282 444 252 466 222',
  ],
};

/** An umbrella, held for two. */
export const UMBRELLA: Drawing = {
  id: 'umbrella',
  strokes: [
    'M500 250 V230',
    'M220 470 C250 330 380 250 500 250 C620 250 750 330 780 470',
    'M220 470 Q276 434 332 470 Q388 434 444 470 Q500 434 556 470 Q612 434 668 470 Q724 434 780 470',
    'M500 250 C440 300 390 380 332 470',
    'M500 250 C470 320 452 390 444 470',
    'M500 250 C530 320 548 390 556 470',
    'M500 250 C560 300 610 380 668 470',
    'M500 250 V780 C500 826 438 826 438 784',
  ],
};

/** A packed suitcase by the door. */
export const SUITCASE: Drawing = {
  id: 'suitcase',
  strokes: [
    'M332 380 H668 C686 380 696 390 696 408 V752 C696 770 686 780 668 780 H332 C314 780 304 770 304 752 V408 C304 390 314 380 332 380 Z',
    'M448 380 V338 C448 324 456 316 470 316 H530 C544 316 552 324 552 338 V380',
    'M400 380 V780',
    'M600 380 V780',
    'M304 470 H696',
    circle(350, 800, 16),
    circle(650, 800, 16),
    'M560 556 H640 V606 H560 Z',
  ],
};

export const DRAWINGS = {DRESS, CHANDELIER, VEIL, DOOR, CUPS, UMBRELLA, SUITCASE};
