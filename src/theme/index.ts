// Exact colours supplied in the KAJORA brand identity moodboard.
export const brand = {
  forest: '#0F5132', sage: '#6B8F71', ivory: '#F6F1E7', gold: '#D4AF37', charcoal: '#1F1F1F',
} as const;

export const colors = {
  canvas: brand.ivory,
  paper: '#FFFDFA',
  ink: brand.charcoal,
  muted: '#62695F',
  green: brand.forest,
  greenDark: brand.forest,
  sageGreen: brand.sage,
  sage: '#DCE5D8',
  sageSoft: '#EAF0E5',
  gold: brand.gold,
  clay: brand.gold,
  claySoft: '#F5ECCE',
  ochre: brand.gold,
  sky: '#EAF0E5',
  line: '#D9DDCF',
  quiet: '#EDE9DF',
  white: '#FFFFFF',
  danger: '#93453D',
} as const;

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 36,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
} as const;

export const type = {
  small: 12,
  caption: 11,
  body: 14,
  title: 17,
  display: 27,
} as const;

export const contentWidth = 680;
