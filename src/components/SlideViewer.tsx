import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft, ChevronRight, X, Maximize2, Minimize2,
  Palette, Download, Printer, ChevronDown,
} from 'lucide-react'
import pptxgen from 'pptxgenjs'
import type { SlideTheme } from './StylePickerModal'
import { THEMES } from './StylePickerModal'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SlideData {
  title: string
  bullets: string[]
  notes?: string
}

export type GradeLevel = 'low' | 'high'

export interface TypographyConfig {
  level: GradeLevel
  titleFont: string
  bodyFont: string
  titleSize: number
  bodySize: number
  cardRadius: number      // pptxgenjs rectRadius
  cardPadding: number     // inches
  iconStyle: 'playful' | 'minimal'
}

// ── Typography Presets (decoupled from color themes) ─────────────────────────

export const TYPOGRAPHY: Record<GradeLevel, TypographyConfig> = {
  low: {
    level: 'low',
    titleFont: 'Fredoka',
    bodyFont: 'Comic Neue',
    titleSize: 36,
    bodySize: 20,
    cardRadius: 0.3,
    cardPadding: 0.4,
    iconStyle: 'playful',
  },
  high: {
    level: 'high',
    titleFont: 'Inter',
    bodyFont: 'Inter',
    titleSize: 30,
    bodySize: 17,
    cardRadius: 0.12,
    cardPadding: 0.3,
    iconStyle: 'minimal',
  },
}

// ── Icon mapping ─────────────────────────────────────────────────────────────

const PLAYFUL_ICONS = ['🎯', '📋', '📦', '🎬', '💬', '🎮', '📝', '🌟', '💡', '🔑']
const MINIMAL_ICONS = ['◆', '◇', '●', '○', '■', '□', '▲', '△', '★', '☆']

function getIcon(index: number, style: 'playful' | 'minimal') {
  const icons = style === 'playful' ? PLAYFUL_ICONS : MINIMAL_ICONS
  return icons[index % icons.length]
}

// ── Google Fonts loader ──────────────────────────────────────────────────────

const FONT_LINK = `@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Comic+Neue:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');`

// ── PPTX Export ──────────────────────────────────────────────────────────────

function exportPptx(slides: SlideData[], theme: SlideTheme, typo: TypographyConfig) {
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'

  const drawCard = (s: any, x: number, y: number, w: number, h: number) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w, h,
      rectRadius: typo.cardRadius,
      fill: { color: theme.pptxCardBg },
      shadow: { type: 'outer', blur: 8, offset: 2, color: '000000', opacity: 0.10 },
      line: { color: theme.pptxAccent, width: 0.5, transparency: 90 },
    })
  }

  const p = typo.cardPadding

  slides.forEach((slide, i) => {
    const s = pptx.addSlide()
    s.background = { color: theme.pptxBg }

    if (i === 0) {
      // ── Title Slide ──────────────────────────────────────────────
      // Decorative shapes
      s.addShape(pptx.ShapeType.roundRect, {
        x: 9.0, y: -1.5, w: 5.5, h: 5.5,
        rectRadius: 1.5,
        fill: { color: theme.pptxAccent, transparency: 90 },
      })
      s.addShape(pptx.ShapeType.roundRect, {
        x: -2.0, y: 4.5, w: 5, h: 5,
        rectRadius: 1.2,
        fill: { color: theme.pptxAccent, transparency: 92 },
      })

      // Title
      s.addText(slide.title, {
        x: 1.5, y: 1.8, w: 10.3, h: 2.0,
        fontSize: typo.titleSize + 4, bold: true,
        color: theme.pptxTitle,
        fontFace: typo.titleFont,
        align: 'center', valign: 'middle',
      })

      // Accent bar
      s.addShape(pptx.ShapeType.roundRect, {
        x: 5.2, y: 4.0, w: 3.0, h: 0.08,
        rectRadius: 0.04,
        fill: { color: theme.pptxAccent },
      })

      // Subtitle tags in cards
      if (slide.bullets.length > 0) {
        const tagW = 2.8
        const gap = 0.3
        const totalW = slide.bullets.length * tagW + (slide.bullets.length - 1) * gap
        const startX = (13.33 - totalW) / 2
        slide.bullets.forEach((b, j) => {
          const tx = startX + j * (tagW + gap)
          drawCard(s, tx, 4.5, tagW, 0.9)
          s.addText(b, {
            x: tx + p, y: 4.5, w: tagW - p * 2, h: 0.9,
            fontSize: typo.bodySize, color: theme.pptxText,
            fontFace: typo.bodyFont, align: 'center', valign: 'middle',
          })
        })
      }
    } else {
      // ── Content Slides — Bento Grid ──────────────────────────────
      // Title
      s.addText(slide.title, {
        x: 0.8, y: 0.4, w: 11.5, h: 0.9,
        fontSize: typo.titleSize, bold: true,
        color: theme.pptxTitle,
        fontFace: typo.titleFont,
      })

      // Accent underline
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: 1.35, w: 1.8, h: 0.05,
        rectRadius: 0.025,
        fill: { color: theme.pptxAccent },
      })

      const bulletCount = slide.bullets.length
      if (bulletCount > 0) {
        const cardAreaY = 1.7
        const cardAreaH = slide.notes ? 4.2 : 5.2
        const gap = 0.25
        const fullW = 11.7

        if (bulletCount <= 2) {
          const cardW = (fullW - gap) / 2
          slide.bullets.forEach((b, j) => {
            const cx = 0.8 + j * (cardW + gap)
            drawCard(s, cx, cardAreaY, cardW, cardAreaH)
            s.addText(b, {
              x: cx + p, y: cardAreaY + p, w: cardW - p * 2, h: cardAreaH - p * 2,
              fontSize: typo.bodySize + 2, color: theme.pptxText,
              fontFace: typo.bodyFont, valign: 'middle',
            })
          })
        } else {
          const halfW = (fullW - gap) / 2
          const rowH = (cardAreaH - gap) / 2

          slide.bullets.forEach((b, j) => {
            let cx: number, cy: number, cw: number, ch: number
            if (j === 0) {
              // Full-width hero card
              cx = 0.8; cy = cardAreaY; cw = fullW; ch = rowH
            } else {
              const col = (j - 1) % 2
              const row = Math.floor((j - 1) / 2)
              cx = 0.8 + col * (halfW + gap)
              cy = cardAreaY + rowH + gap + row * (rowH - gap * 0.5)
              cw = halfW
              ch = rowH - gap * 0.5
            }
            drawCard(s, cx, cy, cw, ch)
            s.addText(b, {
              x: cx + p, y: cy + p * 0.7, w: cw - p * 2, h: ch - p * 1.4,
              fontSize: j === 0 ? typo.bodySize + 2 : typo.bodySize,
              color: theme.pptxText,
              fontFace: typo.bodyFont, valign: 'middle',
            })
          })
        }
      }

      // Notes card
      if (slide.notes) {
        const notesW = 4.5
        const notesH = 1.2
        const notesX = 13.33 - notesW - 0.8
        const notesY = 7.5 - notesH - 0.4
        drawCard(s, notesX, notesY, notesW, notesH)
        s.addText('Notes', {
          x: notesX + 0.2, y: notesY + 0.1, w: 1.2, h: 0.3,
          fontSize: 9, bold: true, color: theme.pptxAccent,
          fontFace: typo.titleFont,
        })
        s.addText(slide.notes, {
          x: notesX + 0.2, y: notesY + 0.35, w: notesW - 0.4, h: notesH - 0.5,
          fontSize: 11, color: theme.pptxText,
          fontFace: typo.bodyFont,
        })
      }
    }

    if (slide.notes) s.addNotes(slide.notes)

    // Slide number
    s.addText(`${i + 1} / ${slides.length}`, {
      x: 11.5, y: 7.0, w: 1.5, h: 0.4,
      fontSize: 10, color: theme.pptxText,
      align: 'right', fontFace: typo.bodyFont, transparency: 50,
    })
  })

  pptx.writeFile({ fileName: 'lesson-plan.pptx' })
}

// ── Print / PDF ──────────────────────────────────────────────────────────────

function handlePrint() {
  window.print()
}

// ── Slide Card Component ─────────────────────────────────────────────────────

function SlideCard({
  slide, theme, typo, index, total, isTitleSlide,
}: {
  slide: SlideData; theme: SlideTheme; typo: TypographyConfig; index: number; total: number; isTitleSlide: boolean
}) {
  const icon = getIcon(index, typo.iconStyle)
  const radius = typo.iconStyle === 'playful' ? 'rounded-3xl' : 'rounded-xl'
  const cardPad = typo.iconStyle === 'playful' ? 'p-8' : 'p-6'

  if (isTitleSlide) {
    return (
      <div className={`w-full h-full ${theme.bg} flex flex-col items-center justify-center ${typo.iconStyle === 'playful' ? 'p-12' : 'p-10'} text-center relative overflow-hidden`}>
        {/* Decorative shapes */}
        <div className={`absolute -top-20 -right-20 w-64 h-64 ${radius} ${theme.accentLight} opacity-30 rotate-12`} />
        <div className={`absolute -bottom-16 -left-16 w-48 h-48 ${radius} ${theme.accentLight} opacity-20 -rotate-12`} />

        <div className="relative z-10">
          {typo.iconStyle === 'playful' && <div className="text-5xl mb-6">{icon}</div>}
          <h1
            className={`${theme.titleColor} font-bold mb-6 leading-tight`}
            style={{ fontSize: `${typo.titleSize + 8}px`, fontFamily: typo.titleFont }}
          >
            {slide.title}
          </h1>
          <div className={`w-24 h-1.5 ${radius} ${theme.accentLight} mx-auto mb-6`} />
          {slide.bullets.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {slide.bullets.map((b, i) => (
                <span
                  key={i}
                  className={`${theme.cardBg} ${theme.border} border ${radius} ${cardPad} ${theme.textColor} font-medium shadow-sm`}
                  style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={`absolute bottom-6 ${theme.textColor} text-sm opacity-50`}>
          {index + 1} / {total}
        </div>
      </div>
    )
  }

  // Normal slide — Bento Grid layout
  return (
    <div className={`w-full h-full ${theme.bg} ${typo.iconStyle === 'playful' ? 'p-8 md:p-12' : 'p-6 md:p-10'} flex flex-col relative overflow-hidden`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`${typo.iconStyle === 'playful' ? 'text-3xl' : 'text-lg'} ${theme.accent}`}
          >
            {icon}
          </span>
          <h2
            className={`${theme.titleColor} font-bold`}
            style={{ fontSize: `${typo.titleSize}px`, fontFamily: typo.titleFont }}
          >
            {slide.title}
          </h2>
        </div>
        <div className={`w-16 h-1 ${radius} ${theme.accentLight}`} />
      </div>

      {/* Bento Grid Content */}
      <div className={`flex-1 grid grid-cols-1 md:grid-cols-2 ${typo.iconStyle === 'playful' ? 'gap-5' : 'gap-4'} auto-rows-fr`}>
        {/* Main bullets card */}
        <div className={`${theme.cardBg} ${theme.border} border ${radius} ${cardPad} shadow-lg ${slide.bullets.length > 3 ? 'md:col-span-2' : ''}`}>
          <ul className={`space-y-${typo.iconStyle === 'playful' ? '4' : '3'}`}>
            {slide.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`w-2 h-2 ${radius} ${theme.accentLight} mt-2 flex-shrink-0`} />
                <span
                  className={`${theme.textColor} leading-relaxed`}
                  style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}
                >
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Notes card — only if notes exist and bullets <= 3 */}
        {slide.notes && slide.bullets.length <= 3 && (
          <div className={`${theme.cardBg} ${theme.border} border ${radius} ${cardPad} shadow-lg flex flex-col justify-center`}>
            <div className={`${theme.accent} text-xs font-semibold uppercase tracking-wider mb-2`}
              style={{ fontFamily: typo.titleFont }}
            >
              Speaker Notes
            </div>
            <p
              className={`${theme.textColor} leading-relaxed opacity-80`}
              style={{ fontSize: `${typo.bodySize - 2}px`, fontFamily: typo.bodyFont }}
            >
              {slide.notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between mt-4 ${theme.textColor} text-xs opacity-50`}>
        <span>EchoBody</span>
        <span>{index + 1} / {total}</span>
      </div>
    </div>
  )
}

// ── Main SlideViewer ─────────────────────────────────────────────────────────

interface Props {
  slides: SlideData[]
  theme: SlideTheme
  typography: TypographyConfig
  onClose: () => void
}

export default function SlideViewer({ slides, theme: initialTheme, typography, onClose }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [theme, setTheme] = useState(initialTheme)
  const [presentMode, setPresentMode] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const total = slides.length

  const goNext = useCallback(() => setCurrentSlide(s => Math.min(s + 1, total - 1)), [total])
  const goPrev = useCallback(() => setCurrentSlide(s => Math.max(s - 1, 0)), [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if (e.key === 'Escape') {
        if (presentMode) setPresentMode(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, presentMode, onClose])

  // Fullscreen API for present mode
  useEffect(() => {
    if (presentMode && containerRef.current) {
      containerRef.current.requestFullscreen?.().catch(() => {})
    } else if (!presentMode && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [presentMode])

  const slide = slides[currentSlide]

  return (
    <>
      {/* Google Fonts + Print styles */}
      <style>{`
        ${FONT_LINK}
        @media print {
          body > * { visibility: hidden; }
          .slide-print-area, .slide-print-area * { visibility: visible; }
          .slide-print-area {
            position: fixed; left: 0; top: 0; width: 100%; z-index: 99999;
          }
          .slide-print-page {
            page-break-after: always;
            width: 100vw; height: 100vh;
          }
          .slide-print-page:last-child { page-break-after: avoid; }
        }
      `}</style>

      <div
        ref={containerRef}
        className={`fixed inset-0 z-[120] flex flex-col bg-black ${presentMode ? '' : 'p-4 md:p-8'}`}
      >
        {/* Toolbar — hidden in present mode */}
        {!presentMode && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-sm rounded-t-2xl">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" title="Close">
                <X size={20} />
              </button>
              <span className="text-white font-medium text-sm">
                {currentSlide + 1} / {total}
              </span>
              <span className="text-gray-500 text-xs hidden sm:inline">
                {typography.level === 'low' ? '🎨 Playful' : '📐 Clean'} Layout
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme (color) switcher — typography stays fixed */}
              <div className="relative">
                <button
                  onClick={() => setShowThemePicker(!showThemePicker)}
                  className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <Palette size={16} />
                  <span className="hidden sm:inline">{theme.name}</span>
                  <ChevronDown size={14} />
                </button>

                {showThemePicker && (
                  <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 min-w-[200px] z-10">
                    <div className="px-4 py-1.5 text-xs text-gray-500 uppercase tracking-wider">Color Theme</div>
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setTheme(t); setShowThemePicker(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${
                          theme.id === t.id ? 'text-white' : 'text-gray-300'
                        }`}
                      >
                        <div>
                          <div>{t.name}</div>
                          <div className="text-xs text-gray-500">{t.description}</div>
                        </div>
                        {theme.id === t.id && <span className="text-emerald-400 ml-2">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-5 bg-gray-700" />

              {/* Present mode */}
              <button
                onClick={() => setPresentMode(true)}
                className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                title="Present Mode"
              >
                <Maximize2 size={16} />
                <span className="hidden sm:inline">Present</span>
              </button>

              <div className="w-px h-5 bg-gray-700" />

              {/* Export PPTX */}
              <button
                onClick={() => exportPptx(slides, theme, typography)}
                className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                title="Export as PPTX"
              >
                <Download size={16} />
                <span className="hidden sm:inline">PPTX</span>
              </button>

              {/* Print / PDF */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                title="Print / Save as PDF"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Slide Canvas */}
        <div className={`flex-1 flex items-center justify-center relative ${presentMode ? '' : 'bg-gray-950'}`}>
          {/* Present mode: exit hint */}
          {presentMode && (
            <button
              onClick={() => setPresentMode(false)}
              className="absolute top-4 right-4 z-20 text-white/40 hover:text-white/80 transition-colors"
            >
              <Minimize2 size={20} />
            </button>
          )}

          <div className={`w-full ${presentMode ? 'h-full' : 'h-full max-w-5xl aspect-video'} rounded-${presentMode ? 'none' : '2xl'} overflow-hidden shadow-2xl relative`}>
            <SlideCard
              slide={slide}
              theme={theme}
              typo={typography}
              index={currentSlide}
              total={total}
              isTitleSlide={currentSlide === 0}
            />
          </div>

          {/* Navigation arrows */}
          {currentSlide > 0 && (
            <button
              onClick={goPrev}
              className={`absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all ${presentMode ? 'opacity-0 hover:opacity-100' : ''}`}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {currentSlide < total - 1 && (
            <button
              onClick={goNext}
              className={`absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all ${presentMode ? 'opacity-0 hover:opacity-100' : ''}`}
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Bottom bar — hidden in present mode */}
        {!presentMode && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900/80 backdrop-blur-sm rounded-b-2xl">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentSlide ? 'w-8 bg-violet-500' : 'w-3 bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Print-only: render all slides */}
      <div className="slide-print-area hidden print:block">
        {slides.map((s, i) => (
          <div key={i} className="slide-print-page">
            <SlideCard
              slide={s}
              theme={theme}
              typo={typography}
              index={i}
              total={total}
              isTitleSlide={i === 0}
            />
          </div>
        ))}
      </div>
    </>
  )
}
