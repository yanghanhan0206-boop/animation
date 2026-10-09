// Colours, type and layout grid shared by every shot.

export const C = {
  bg: '#0B0F0D',
  gridDot: '#1E2924',
  accent: '#39FF14',
  white: '#F2F5F3',
  gray: '#7C8781',
  grayLight: '#A7B0AB',
  grayDark: '#3A4540',
  card: '#161C19',
  cardDeep: '#101512',
  cardBorder: '#2A332E',
  track: '#26302B',
} as const;

/** The accent at a given opacity. */
export const accentA = (a: number) => `rgba(57,255,20,${a})`;
export const whiteA = (a: number) => `rgba(242,245,243,${a})`;

export const FONT_CN = '"Noto Sans SC", sans-serif';
export const FONT_MONO = '"JetBrains Mono", "Noto Sans SC", monospace';

/**
 * Platform UI covers the top 250px and the bottom 450px; Douyin's like/comment column
 * also sits on the right edge, so key content stays inside x 110–970.
 */
export const L = {
  W: 1080,
  H: 1920,
  cx: 540,
  safeTop: 250,
  safeBottom: 1470,
  safeLeft: 110,
  safeRight: 970,
  /** Step progress bar. */
  headerY: 310,
  /** Main graphics band. */
  stageTop: 370,
  stageBottom: 1170,
  stageCy: 770,
  /** Subtitle band. */
  subTop: 1210,
  subBottom: 1450,
  subCy: 1330,
  /** Widest a subtitle line may get. */
  subMaxWidth: 820,
} as const;
