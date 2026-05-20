import { useState, useMemo, useCallback, useRef, memo, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Tooth from './Tooth';

// ── Tooth geometry — 25 % larger, built ONCE at module level ─────────────────
const UPPER_SIZES = [[25,29],[21,25],[19,35],[26,25],[25,24],[33,23],[30,21],[26,19]];
const LOWER_SIZES = [[21,29],[19,25],[16,33],[24,24],[23,23],[30,23],[28,21],[24,18]];
const TYPE_MAP    = ['incisor','incisor','canine','premolar','premolar','molar','molar','molar'];

const TEETH_DATA = (() => {
  const GAP = 3, CENTER = 270, UPPER_GUM = 134, LOWER_GUM = 156;
  const teeth = [];
  let x;
  // Q1 – upper right (11-18)
  x = CENTER - 2;
  for (let i = 0; i < 8; i++) {
    const [w, h] = UPPER_SIZES[i];
    x -= w;
    teeth.push({ num: 10 + i + 1, x, y: UPPER_GUM - h, w, h, type: TYPE_MAP[i], isUpper: true });
    x -= GAP;
  }
  // Q2 – upper left (21-28)
  x = CENTER + 2;
  for (let i = 0; i < 8; i++) {
    const [w, h] = UPPER_SIZES[i];
    teeth.push({ num: 20 + i + 1, x, y: UPPER_GUM - h, w, h, type: TYPE_MAP[i], isUpper: true });
    x += w + GAP;
  }
  // Q4 – lower right (41-48)
  x = CENTER - 2;
  for (let i = 0; i < 8; i++) {
    const [w, h] = LOWER_SIZES[i];
    x -= w;
    teeth.push({ num: 40 + i + 1, x, y: LOWER_GUM, w, h, type: TYPE_MAP[i], isUpper: false });
    x -= GAP;
  }
  // Q3 – lower left (31-38)
  x = CENTER + 2;
  for (let i = 0; i < 8; i++) {
    const [w, h] = LOWER_SIZES[i];
    teeth.push({ num: 30 + i + 1, x, y: LOWER_GUM, w, h, type: TYPE_MAP[i], isUpper: false });
    x += w + GAP;
  }
  return teeth;
})();

// ── CSS injected into SVG — hover fill change, zero React re-renders ──────────
const SVG_STYLE = `
  .tooth-body {
    fill: var(--fill, #FEFEFE);
    transition: fill 0.2s ease;
  }
  .tooth-interactive:hover .tooth-body {
    fill: var(--hover-fill, #F4EFE6);
  }
  .tooth-shine {
    opacity: 0.6;
    transition: opacity 0.2s ease;
  }
  .tooth-interactive:hover .tooth-shine {
    opacity: 0.3;
  }
`;

// ── Status color map ──────────────────────────────────────────────────────────
const TOOLTIP_STATUS_CLS = {
  COMPLETED:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  DELAYED:     'bg-rose-50 text-rose-700 border-rose-200',
  PENDING:     'bg-amber-50 text-amber-700 border-amber-200',
};

// ── Tooltip bar — isolated state, never re-renders TeethDiagram or Tooth ──────
const TooltipBar = forwardRef(function TooltipBar({ interactive }, ref) {
  const { t } = useTranslation();
  const [info, setInfo] = useState(null);
  useImperativeHandle(ref, () => ({ setInfo }), []);

  return (
    <div className="h-10 flex items-center justify-center mb-2">
      <AnimatePresence mode="wait">
        {info ? (
          <motion.div
            key={`t-${info.num}`}
            initial={{ opacity: 0, y: -6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-lg shadow-slate-200/70"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-4 rounded-full bg-blue-400 opacity-80" />
              <span className="text-xs font-bold text-slate-800 tracking-wide">
                {t('teeth.toothNumber')} {info.num}
              </span>
            </div>
            {info.status !== 'none' ? (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide ${TOOLTIP_STATUS_CLS[info.status] || ''}`}>
                {t(`status.${info.status}`)}
              </span>
            ) : interactive ? (
              <span className="text-[10px] text-slate-400 font-medium">{t('teeth.clickToSelect')}</span>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-300 select-none font-medium">
              {interactive ? t('teeth.hoverHint') : ''}
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── Main diagram — memoized, hover causes ZERO re-renders anywhere ────────────
const TeethDiagram = memo(function TeethDiagram({
  selectedTeeth = [],
  onSelectTooth = null,
  caseTeeth     = [],   // teeth belonging to this case (highlighted in read-only view)
  teethCases    = [],
  readOnly      = false,
  compact       = false,
}) {
  const { t } = useTranslation();

  const tooltipRef      = useRef(null);
  const caseMapRef      = useRef({});
  const caseTeethRef    = useRef(caseTeeth);
  caseTeethRef.current  = caseTeeth;

  const caseMap = useMemo(() => {
    const m = {};
    teethCases.forEach(({ toothNumber, status }) => { if (toothNumber) m[toothNumber] = status; });
    caseMapRef.current = m;
    return m;
  }, [teethCases]);

  const handleToothClick = useCallback((num) => {
    if (!onSelectTooth) return;
    onSelectTooth((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  }, [onSelectTooth]);

  // Tooltip updated via ref — TeethDiagram NEVER re-renders on hover
  const handleHoverChange = useCallback((num, entering) => {
    if (!entering) { tooltipRef.current?.setInfo(null); return; }
    const status = caseTeethRef.current.includes(num)
      ? 'IN_PROGRESS'
      : (caseMapRef.current[num] || 'none');
    tooltipRef.current?.setInfo({ num, status });
  }, []);

  const interactive = !readOnly && !!onSelectTooth;
  const svgH        = compact ? 230 : 290;

  // Arch-shaped gum path helpers (UPPER_GUM=134, LOWER_GUM=156)
  const upperGumPath = 'M58 128 C190 120, 350 120, 482 128 L482 142 C350 134, 190 134, 58 142 Z';
  const lowerGumPath = 'M58 162 C190 170, 350 170, 482 162 L482 148 C350 156, 190 156, 58 148 Z';
  // Arch guide lines
  const upperArchLine = 'M58 100 C190 88, 350 88, 482 100';
  const lowerArchLine = 'M58 188 C190 200, 350 200, 482 188';

  return (
    <div className="w-full select-none">
      {/* Tooltip — fully isolated state */}
      <TooltipBar ref={tooltipRef} interactive={interactive} />

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 540 224"
          className="w-full max-w-2xl mx-auto block"
          style={{ height: svgH }}
        >
          <defs>
            {/* Background gradient — warm pearl */}
            <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#FEFEFE" />
              <stop offset="100%" stopColor="#F7F4EF" />
            </linearGradient>

            {/* Enamel shine gradients */}
            <linearGradient id="enamel-upper" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="white" stopOpacity="0.6" />
              <stop offset="45%"  stopColor="white" stopOpacity="0.15" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="enamel-lower" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="white" stopOpacity="0.6" />
              <stop offset="45%"  stopColor="white" stopOpacity="0.15" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Gum gradients */}
            <linearGradient id="gum-upper-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#FDA4AF" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FECDD3" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="gum-lower-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%"   stopColor="#FDA4AF" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FECDD3" stopOpacity="0.18" />
            </linearGradient>

            {/* Subtle dot grid */}
            <pattern id="dot-grid" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="9" cy="9" r="0.9" fill="#CBD5E1" opacity="0.35" />
            </pattern>

            {/* Clip for rounded background */}
            <clipPath id="bg-clip">
              <rect width="540" height="224" rx="20" />
            </clipPath>

            {/* Inner shadow filter */}
            <filter id="inner-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>

          {/* CSS for zero-JS hover fills */}
          <style>{SVG_STYLE}</style>

          {/* Background layers */}
          <rect width="540" height="224" fill="url(#bg-grad)" rx="20" />
          <rect width="540" height="224" fill="url(#dot-grid)" clipPath="url(#bg-clip)" />

          {/* Border */}
          <rect width="540" height="224" fill="none" stroke="#E8E0D4" strokeWidth="1.5" rx="20" />

          {/* Subtle arch guide lines — like a medical illustration */}
          <path d={upperArchLine} fill="none" stroke="#E2D9CE" strokeWidth="1" strokeDasharray="3,5" opacity="0.6" />
          <path d={lowerArchLine} fill="none" stroke="#E2D9CE" strokeWidth="1" strokeDasharray="3,5" opacity="0.6" />

          {/* Arch-shaped gum bands */}
          <path d={upperGumPath} fill="url(#gum-upper-grad)" />
          <path d={lowerGumPath} fill="url(#gum-lower-grad)" />

          {/* Gum band edge highlights */}
          <path d="M58 128 C190 120, 350 120, 482 128" fill="none" stroke="#FCA5A5" strokeWidth="1" opacity="0.5" />
          <path d="M58 162 C190 170, 350 170, 482 162" fill="none" stroke="#FCA5A5" strokeWidth="1" opacity="0.5" />

          {/* Central vertical divider */}
          <line x1="270" y1="14" x2="270" y2="210" stroke="#E8E0D4" strokeWidth="1" strokeDasharray="5,5" />

          {/* Midline horizontal accent */}
          <line x1="62" y1="145" x2="478" y2="145" stroke="#F9A8D4" strokeWidth="0.8" strokeDasharray="2,6" opacity="0.55" />

          {/* Quadrant labels — elegant small caps */}
          {[
            { x: 66,  y: 15,  label: t('teeth.upperRight'), anchor: 'start' },
            { x: 474, y: 15,  label: t('teeth.upperLeft'),  anchor: 'end'   },
            { x: 66,  y: 222, label: t('teeth.lowerRight'), anchor: 'start' },
            { x: 474, y: 222, label: t('teeth.lowerLeft'),  anchor: 'end'   },
          ].map(({ x, y, label, anchor }) => (
            <text key={label} x={x} y={y} textAnchor={anchor} fontSize={7.5}
              fill="#B0A899" fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="600" letterSpacing="0.4">
              {label}
            </text>
          ))}

          {/* Teeth — hover = CSS only, select = Framer animate (y-lift) */}
          {TEETH_DATA.map((tooth) => (
            <Tooth
              key={tooth.num}
              tooth={tooth}
              status={caseTeeth.includes(tooth.num) ? 'IN_PROGRESS' : (caseMap[tooth.num] || 'none')}
              isSelected={selectedTeeth.includes(tooth.num)}
              isHighlighted={caseTeeth.includes(tooth.num)}
              interactive={interactive}
              onClick={handleToothClick}
              onHoverChange={handleHoverChange}
            />
          ))}
        </svg>
      </div>

      {/* Premium legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-3 px-2">
        {[
          { label: t('teeth.noCase'),        dot: '#D6CFBE', bg: '#FEFEFE', border: '#EDE8DE', text: '#8C7F6E' },
          { label: t('status.PENDING'),      dot: '#FBBF24', bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
          { label: t('status.IN_PROGRESS'),  dot: '#60A5FA', bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
          { label: t('status.COMPLETED'),    dot: '#34D399', bg: '#F0FDF4', border: '#A7F3D0', text: '#065F46' },
          { label: t('status.DELAYED'),      dot: '#FB7185', bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239' },
        ].map(({ label, dot, bg, border, text }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold"
            style={{ backgroundColor: bg, borderColor: border, color: text }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
});

export default TeethDiagram;
