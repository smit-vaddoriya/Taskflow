export const C = {
  // Backgrounds (darkest → lightest)
  bg0: '#0a0a0f',
  bg1: '#111116',
  bg2: '#17171d',
  bg3: '#1e1e25',
  bg4: '#26262f',

  // Borders
  b1: '#1e1e26',
  b2: '#28282f',
  b3: '#353540',

  // Text
  t1: '#ededf0',
  t2: '#a1a1aa',
  t3: '#62626e',
  t4: '#3a3a45',

  // Accent – violet (Linear-inspired)
  a1: '#7c3aed',   // main
  a2: '#8b5cf6',   // lighter
  a3: '#6d28d9',   // darker
  am: 'rgba(124,58,237,0.12)',  // muted bg
  ab: 'rgba(124,58,237,0.25)',  // border
  ag: '0 0 20px rgba(124,58,237,0.35)', // glow

  // Status
  green:  '#22c55e',
  greenM: 'rgba(34,197,94,0.1)',
  yellow: '#eab308',
  yellowM:'rgba(234,179,8,0.1)',
  red:    '#ef4444',
  redM:   'rgba(239,68,68,0.1)',
  blue:   '#3b82f6',
  blueM:  'rgba(59,130,246,0.1)',
  orange: '#f97316',
  orangeM:'rgba(249,115,22,0.1)',
  purple: '#a855f7',
  purpleM:'rgba(168,85,247,0.1)',

  // Shadows
  shadowCard: '0 1px 2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
  shadowElevated: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
  shadowModal: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)',
} as const

export const R = {
  xs: '6px', sm: '8px', md: '10px', lg: '12px', xl: '16px', '2xl': '20px', full: '9999px',
} as const

export const T = {
  xs:   { fontSize: '11px', lineHeight: '16px' },
  sm:   { fontSize: '12px', lineHeight: '18px' },
  base: { fontSize: '13px', lineHeight: '20px' },
  md:   { fontSize: '14px', lineHeight: '22px' },
  lg:   { fontSize: '16px', lineHeight: '24px' },
  xl:   { fontSize: '20px', lineHeight: '28px' },
  '2xl':{ fontSize: '24px', lineHeight: '32px' },
  '3xl':{ fontSize: '32px', lineHeight: '40px' },
} as const