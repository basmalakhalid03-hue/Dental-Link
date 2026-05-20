import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';

// ── Status palette ────────────────────────────────────────────────────────────
export const STATUS_STYLE = {
  none:        { fill: '#FEFEFE', stroke: '#E2D9C8', hoverFill: '#F4EFE6' },
  PENDING:     { fill: '#FFFBEB', stroke: '#FBBF24', hoverFill: '#FEF3C7' },
  IN_PROGRESS: { fill: '#EFF6FF', stroke: '#60A5FA', hoverFill: '#DBEAFE' },
  COMPLETED:   { fill: '#F0FDF4', stroke: '#34D399', hoverFill: '#DCFCE7' },
  DELAYED:     { fill: '#FFF1F2', stroke: '#FB7185', hoverFill: '#FFE4E6' },
};

// ── Path generators ───────────────────────────────────────────────────────────
export const toothPath = (x, y, w, h, type, isUpper) => {
  if (type === 'canine') {
    const mid = x + w / 2;
    if (isUpper) {
      return `M${x+4} ${y} L${x+w-4} ${y} Q${x+w} ${y} ${x+w} ${y+4} L${x+w} ${y+h*0.52} L${mid} ${y+h} L${x} ${y+h*0.52} L${x} ${y+4} Q${x} ${y} ${x+4} ${y} Z`;
    }
    return `M${mid} ${y} L${x+w} ${y+h*0.48} L${x+w} ${y+h-4} Q${x+w} ${y+h} ${x+w-4} ${y+h} L${x+4} ${y+h} Q${x} ${y+h} ${x} ${y+h-4} L${x} ${y+h*0.48} Z`;
  }
  const rx = type === 'molar' ? 6 : type === 'premolar' ? 5 : 4;
  return `M${x+rx} ${y} L${x+w-rx} ${y} Q${x+w} ${y} ${x+w} ${y+rx} L${x+w} ${y+h-rx} Q${x+w} ${y+h} ${x+w-rx} ${y+h} L${x+rx} ${y+h} Q${x} ${y+h} ${x} ${y+h-rx} L${x} ${y+rx} Q${x} ${y} ${x+rx} ${y} Z`;
};

export const MolarCusps = memo(function MolarCusps({ x, y, w, h, isUpper, stroke }) {
  const midX = x + w / 2;
  const crossY = isUpper ? y + h * 0.58 : y + h * 0.42;
  return (
    <g stroke={stroke} strokeWidth={0.7} opacity={0.35} pointerEvents="none">
      <line x1={midX} y1={isUpper ? y + h - 2 : y + 2} x2={midX} y2={crossY} />
      <line x1={x + 3} y1={crossY} x2={x + w - 3} y2={crossY} />
      <line x1={x + 3} y1={isUpper ? y + h * 0.3 : y + h * 0.7} x2={x + w - 3} y2={isUpper ? y + h * 0.3 : y + h * 0.7} strokeOpacity={0.18} />
    </g>
  );
});

// ── Single memoized tooth — ZERO useState ────────────────────────────────────
// Hover → CSS only (.tooth-interactive:hover .tooth-body) — ZERO React re-renders
// Select → stroke/glow change only, no position animation
const Tooth = memo(function Tooth({
  tooth,
  status,
  isSelected,
  isHighlighted,
  interactive,
  onClick,
  onHoverChange,
}) {
  const style       = STATUS_STYLE[status] || STATUS_STYLE.none;
  const strokeColor = isSelected    ? '#2563eb'
                    : isHighlighted ? '#059669'
                    : style.stroke;
  const strokeW     = isSelected || isHighlighted ? 2.5 : 1.2;
  const numX        = tooth.x + tooth.w / 2;
  const numY        = tooth.isUpper ? tooth.y - 5 : tooth.y + tooth.h + 10;

  const handleClick = useCallback(() => { if (interactive) onClick(tooth.num); }, [interactive, onClick, tooth.num]);
  const handleEnter = useCallback(() => { onHoverChange?.(tooth.num, true);  }, [onHoverChange, tooth.num]);
  const handleLeave = useCallback(() => { onHoverChange?.(tooth.num, false); }, [onHoverChange, tooth.num]);

  return (
    <motion.g
      className={interactive ? 'tooth-interactive' : ''}
      style={{
        originX: `${tooth.x + tooth.w / 2}px`,
        originY: `${tooth.y + tooth.h / 2}px`,
        cursor:  interactive ? 'pointer' : 'default',
        '--fill':       style.fill,
        '--hover-fill': style.hoverFill,
        '--stroke-clr': strokeColor,
        filter: isSelected
          ? 'drop-shadow(0 0 10px rgba(37,99,235,0.65)) drop-shadow(0 4px 10px rgba(37,99,235,0.35))'
          : isHighlighted
          ? 'drop-shadow(0 0 8px rgba(5,150,105,0.55))'
          : 'none',
      }}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Pulsing selection ring — runs entirely in Framer animation layer */}
      {isSelected && interactive && (
        <motion.path
          d={toothPath(tooth.x, tooth.y, tooth.w, tooth.h, tooth.type, tooth.isUpper)}
          fill="none"
          stroke="#60A5FA"
          strokeWidth={3.5}
          animate={{ opacity: [0.9, 0.2, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Tooth body — fill via CSS custom property, zero React re-render on hover */}
      <path
        className="tooth-body"
        d={toothPath(tooth.x, tooth.y, tooth.w, tooth.h, tooth.type, tooth.isUpper)}
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeLinejoin="round"
      />

      {/* Enamel shine overlay — gradient white to transparent */}
      <path
        className="tooth-shine"
        d={toothPath(tooth.x, tooth.y, tooth.w, tooth.h, tooth.type, tooth.isUpper)}
        fill={tooth.isUpper ? 'url(#enamel-upper)' : 'url(#enamel-lower)'}
        stroke="none"
        pointerEvents="none"
      />

      {/* Molar cusp decoration */}
      {tooth.type === 'molar' && <MolarCusps {...tooth} stroke={strokeColor} />}

      {/* FDI number */}
      <text
        x={numX} y={numY}
        textAnchor="middle"
        fontSize={7}
        fill={isSelected ? '#1d4ed8' : '#94a3b8'}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={isSelected || isHighlighted ? '700' : '500'}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {tooth.num}
      </text>

      {/* Status indicator dot */}
      {status === 'COMPLETED'   && <circle cx={tooth.x + tooth.w - 3} cy={tooth.y + 3} r={3} fill="#10b981" stroke="white" strokeWidth={1} style={{ pointerEvents: 'none' }} />}
      {status === 'DELAYED'     && <circle cx={tooth.x + tooth.w - 3} cy={tooth.y + 3} r={3} fill="#f43f5e" stroke="white" strokeWidth={1} style={{ pointerEvents: 'none' }} />}
      {status === 'IN_PROGRESS' && !isHighlighted && (
        <circle cx={tooth.x + tooth.w - 3} cy={tooth.y + 3} r={3} fill="#3b82f6" stroke="white" strokeWidth={1} style={{ pointerEvents: 'none' }} />
      )}
    </motion.g>
  );
});

export default Tooth;
