import React from 'react';
import {C} from '../theme';

// Flat geometric icons, all drawn in a 100×100 box. `cut` is the colour used for
// the punched-out details (eyes, lines); it should match whatever sits behind.

export type IconKind =
  | 'cat'
  | 'note'
  | 'bowl'
  | 'mountain'
  | 'ball'
  | 'book'
  | 'gamepad'
  | 'dumbbell'
  | 'heart'
  | 'play'
  | 'timer'
  | 'arrowUp'
  | 'notebook'
  | 'funnel'
  | 'bars'
  | 'loop'
  | 'bubble'
  | 'check';

/** Content categories used for "videos" in the feed, ring and cards. */
export const CONTENT_KINDS: IconKind[] = ['cat', 'note', 'bowl', 'mountain', 'ball', 'book', 'gamepad', 'dumbbell'];

interface IconProps {
  kind: IconKind;
  /** Centre of the icon. */
  x: number;
  y: number;
  size: number;
  color?: string;
  cut?: string;
  rotate?: number;
  opacity?: number;
  scaleX?: number;
  /** Timer only: hand angle in degrees. */
  hand?: number;
}

const Shape: React.FC<{kind: IconKind; color: string; cut: string; hand: number}> = ({kind, color, cut, hand}) => {
  switch (kind) {
    case 'cat':
      return (
        <>
          <path d="M21 46 L27 12 L47 31 Z" fill={color} />
          <path d="M79 46 L73 12 L53 31 Z" fill={color} />
          <circle cx={50} cy={56} r={31} fill={color} />
          <ellipse cx={39} cy={54} rx={4.4} ry={5.6} fill={cut} />
          <ellipse cx={61} cy={54} rx={4.4} ry={5.6} fill={cut} />
          <path d="M45.5 64 L54.5 64 L50 69.5 Z" fill={cut} />
        </>
      );
    case 'note':
      return (
        <>
          <ellipse cx={36} cy={72} rx={15} ry={12} fill={color} transform="rotate(-20 36 72)" />
          <rect x={44} y={16} width={8} height={58} rx={3} fill={color} />
          <path d="M52 16 C 68 20, 78 30, 74 50 C 70 38, 62 33, 52 33 Z" fill={color} />
        </>
      );
    case 'bowl':
      return (
        <>
          <path d="M14 50 H86 A36 30 0 0 1 14 50 Z" fill={color} />
          <rect x={36} y={80} width={28} height={7} rx={3.5} fill={color} />
          {[34, 50, 66].map((x) => (
            <path
              key={x}
              d={`M${x} 42 C ${x - 7} 34, ${x + 7} 28, ${x} 18`}
              stroke={color}
              strokeWidth={5.5}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </>
      );
    case 'mountain':
      return (
        <>
          <path d="M8 84 L40 32 L72 84 Z" fill={color} />
          <path d="M46 84 L68 50 L92 84 Z" fill={color} opacity={0.75} />
          <circle cx={74} cy={24} r={9} fill={color} />
        </>
      );
    case 'ball':
      return (
        <>
          <circle cx={50} cy={50} r={33} fill={color} />
          <path d="M17 50 H83" stroke={cut} strokeWidth={4.5} />
          <path d="M50 17 C 34 34, 34 66, 50 83" stroke={cut} strokeWidth={4.5} fill="none" />
          <path d="M50 17 C 66 34, 66 66, 50 83" stroke={cut} strokeWidth={4.5} fill="none" />
        </>
      );
    case 'book':
      return (
        <>
          <path d="M12 24 Q 31 17 47 26 V 82 Q 31 73 12 79 Z" fill={color} />
          <path d="M88 24 Q 69 17 53 26 V 82 Q 69 73 88 79 Z" fill={color} />
        </>
      );
    case 'gamepad':
      return (
        <>
          <rect x={10} y={32} width={80} height={40} rx={20} fill={color} />
          <rect x={22} y={48} width={20} height={7} rx={2.5} fill={cut} />
          <rect x={28.5} y={41.5} width={7} height={20} rx={2.5} fill={cut} />
          <circle cx={64} cy={46} r={5} fill={cut} />
          <circle cx={74} cy={57} r={5} fill={cut} />
        </>
      );
    case 'dumbbell':
      return (
        <>
          <rect x={8} y={36} width={12} height={28} rx={3} fill={color} />
          <rect x={21} y={28} width={11} height={44} rx={3} fill={color} />
          <rect x={32} y={45} width={36} height={10} rx={3} fill={color} />
          <rect x={68} y={28} width={11} height={44} rx={3} fill={color} />
          <rect x={80} y={36} width={12} height={28} rx={3} fill={color} />
        </>
      );
    case 'heart':
      return (
        <path
          d="M50 86 C 16 63, 8 45, 16 30 C 24 15, 43 16, 50 31 C 57 16, 76 15, 84 30 C 92 45, 84 63, 50 86 Z"
          fill={color}
        />
      );
    case 'play':
      return <path d="M34 22 L80 50 L34 78 Z" fill={color} stroke={color} strokeWidth={9} strokeLinejoin="round" />;
    case 'timer':
      return (
        <>
          <circle cx={50} cy={56} r={31} fill="none" stroke={color} strokeWidth={9} />
          <rect x={41} y={9} width={18} height={10} rx={3.5} fill={color} />
          <path
            d="M50 56 L50 36"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            transform={`rotate(${hand} 50 56)`}
          />
        </>
      );
    case 'arrowUp':
      return <path d="M50 12 L82 46 H61 V88 H39 V46 H18 Z" fill={color} />;
    case 'notebook':
      return (
        <>
          <rect x={24} y={12} width={60} height={78} rx={9} fill={color} />
          {[26, 46, 66].map((y) => (
            <rect key={y} x={14} y={y} width={20} height={8} rx={4} fill={color} />
          ))}
          {[30, 44, 58].map((y) => (
            <rect key={y} x={42} y={y} width={32} height={6} rx={3} fill={cut} />
          ))}
        </>
      );
    case 'funnel':
      return <path d="M10 16 H90 L59 54 V82 L41 92 V54 Z" fill={color} strokeLinejoin="round" />;
    case 'bars':
      return (
        <>
          <rect x={12} y={58} width={20} height={30} rx={4} fill={color} />
          <rect x={40} y={38} width={20} height={50} rx={4} fill={color} />
          <rect x={68} y={14} width={20} height={74} rx={4} fill={color} />
        </>
      );
    case 'loop':
      return (
        <>
          <path d="M78 50 A28 28 0 1 1 64 25.8" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />
          <path d="M78.5 34.2 L57.5 37.0 L70.5 14.6 Z" fill={color} strokeLinejoin="round" />
        </>
      );
    case 'bubble':
      return (
        <path
          d="M12 22 Q12 10 24 10 H76 Q88 10 88 22 V58 Q88 70 76 70 H42 L24 88 V70 Q12 70 12 58 Z"
          fill={color}
        />
      );
    case 'check':
      return (
        <path
          d="M18 52 L40 72 L82 28"
          stroke={color}
          strokeWidth={13}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );
    default:
      return null;
  }
};

/** An icon placed in an existing <svg>. */
export const Icon: React.FC<IconProps> = ({
  kind,
  x,
  y,
  size,
  color = C.white,
  cut = C.bg,
  rotate = 0,
  opacity = 1,
  scaleX = 1,
  hand = 0,
}) => {
  const s = size / 100;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s * scaleX} ${s}) translate(-50 -50)`}
      opacity={opacity}
    >
      <Shape kind={kind} color={color} cut={cut} hand={hand} />
    </g>
  );
};
