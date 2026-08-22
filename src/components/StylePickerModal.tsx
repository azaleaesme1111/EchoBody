// ── Slide Theme Types & Color Palettes ────────────────────────────────────────
// Color themes are decoupled from grade-level typography (see SlideViewer).
// Theme controls ONLY colors; typography/density is controlled by TypographyConfig.

export type ThemeId = 'warm-cream' | 'soft-sage' | 'ocean-breeze'

export interface SlideTheme {
  id: ThemeId
  name: string
  description: string
  // Tailwind CSS classes (browser preview)
  bg: string
  cardBg: string
  titleColor: string
  textColor: string
  accent: string
  accentLight: string
  border: string
  // PPTX export hex colors
  pptxBg: string
  pptxTitle: string
  pptxText: string
  pptxAccent: string
  pptxCardBg: string
}

export const THEMES: SlideTheme[] = [
  {
    id: 'warm-cream',
    name: 'Warm Cream',
    description: 'Warm Morandi tones — psychology & young learners',
    bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    titleColor: 'text-amber-900',
    textColor: 'text-amber-800',
    accent: 'text-rose-500',
    accentLight: 'bg-rose-100',
    border: 'border-amber-200',
    pptxBg: 'FAF6F0',
    pptxTitle: '78350F',
    pptxText: '92400E',
    pptxAccent: 'E11D48',
    pptxCardBg: 'FFFFFF',
  },
  {
    id: 'soft-sage',
    name: 'Soft Sage',
    description: 'Forest green calm — physiology & health boundaries',
    bg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    titleColor: 'text-emerald-900',
    textColor: 'text-emerald-800',
    accent: 'text-teal-600',
    accentLight: 'bg-teal-100',
    border: 'border-emerald-200',
    pptxBg: 'F0FDF4',
    pptxTitle: '064E3B',
    pptxText: '065F46',
    pptxAccent: '0D9488',
    pptxCardBg: 'FFFFFF',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Bright sky blue — youth social & online safety',
    bg: 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    titleColor: 'text-blue-900',
    textColor: 'text-blue-800',
    accent: 'text-indigo-500',
    accentLight: 'bg-indigo-100',
    border: 'border-blue-200',
    pptxBg: 'F0F9FF',
    pptxTitle: '1E3A5F',
    pptxText: '1E40AF',
    pptxAccent: '4F46E5',
    pptxCardBg: 'FFFFFF',
  },
]
