import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft, ChevronRight, X, Maximize2, Minimize2,
  Palette, Download, Printer, ChevronDown,
} from 'lucide-react'
import pptxgen from 'pptxgenjs'
import type { SlideTheme } from './StylePickerModal'
import { THEMES } from './StylePickerModal'

// ── Types ────────────────────────────────────────────────────────────────────

export type LayoutType =
  | 'hero' | 'three_cards' | 'scenario' | 'compare' | 'before_after'
  | 'big_number' | 'question' | 'process' | 'scale' | 'reflection'
  | 'takeaways' | 'visual_explanation'

export interface SlideData {
  layoutType: LayoutType
  title: string
  subtitle?: string
  keywords?: string[]
  bullets?: string[]
  notes?: string
  cards?: { icon: string; cardTitle: string; description: string }[]
  scenario?: string
  question?: string
  options?: string[]
  leftLabel?: string; leftItems?: string[]
  rightLabel?: string; rightItems?: string[]
  before?: string; after?: string; bridge?: string
  number?: string; label?: string; actions?: string[]
  prompts?: string[]
  steps?: string[]
  levels?: { emoji: string; label: string }[]
  points?: { icon: string; text: string }[]
  centerLabel?: string; branches?: string[]
  prompt?: string
}

export type GradeLevel = 'low' | 'mid' | 'high'

export interface TypographyConfig {
  level: GradeLevel
  titleFont: string
  bodyFont: string
  titleSize: number
  bodySize: number
  cardRadius: number
  cardPadding: number
  iconStyle: 'playful' | 'standard' | 'minimal'
}

// ── Typography Presets (decoupled from color themes) ─────────────────────────

export const TYPOGRAPHY: Record<GradeLevel, TypographyConfig> = {
  low: {
    level: 'low', titleFont: 'Fredoka', bodyFont: 'Comic Neue',
    titleSize: 36, bodySize: 20, cardRadius: 0.3, cardPadding: 0.4, iconStyle: 'playful',
  },
  mid: {
    level: 'mid', titleFont: 'Inter', bodyFont: 'Inter',
    titleSize: 32, bodySize: 18, cardRadius: 0.2, cardPadding: 0.35, iconStyle: 'standard',
  },
  high: {
    level: 'high', titleFont: 'Inter', bodyFont: 'Inter',
    titleSize: 30, bodySize: 17, cardRadius: 0.12, cardPadding: 0.3, iconStyle: 'minimal',
  },
}

// ── Google Fonts ─────────────────────────────────────────────────────────────

const FONT_LINK = `@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Comic+Neue:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');`

// ── PPTX Export ──────────────────────────────────────────────────────────────

function exportPptx(slides: SlideData[], theme: SlideTheme, typo: TypographyConfig) {
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'
  const p = typo.cardPadding

  const drawCard = (s: any, x: number, y: number, w: number, h: number) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w, h, rectRadius: typo.cardRadius,
      fill: { color: theme.pptxCardBg },
      shadow: { type: 'outer', blur: 8, offset: 2, color: '000000', opacity: 0.10 },
      line: { color: theme.pptxAccent, width: 0.5, transparency: 90 },
    })
  }

  const addTitle = (s: any, title: string) => {
    s.addText(title, {
      x: 0.8, y: 0.4, w: 11.5, h: 0.9,
      fontSize: typo.titleSize, bold: true, color: theme.pptxTitle, fontFace: typo.titleFont,
    })
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.35, w: 1.8, h: 0.05, rectRadius: 0.025,
      fill: { color: theme.pptxAccent },
    })
  }

  const txt = (s: any, text: string, x: number, y: number, w: number, h: number, opts?: any) => {
    s.addText(text, {
      x, y, w, h, fontSize: typo.bodySize, color: theme.pptxText,
      fontFace: typo.bodyFont, valign: 'middle', ...opts,
    })
  }

  slides.forEach((slide, i) => {
    const s = pptx.addSlide()
    s.background = { color: theme.pptxBg }
    const lt = slide.layoutType || 'three_cards'

    if (lt === 'hero' || i === 0) {
      s.addShape(pptx.ShapeType.roundRect, {
        x: 9, y: -1.5, w: 5.5, h: 5.5, rectRadius: 1.5,
        fill: { color: theme.pptxAccent, transparency: 90 },
      })
      s.addText(slide.title, {
        x: 1.5, y: 1.8, w: 10.3, h: 2.0,
        fontSize: typo.titleSize + 8, bold: true, color: theme.pptxTitle,
        fontFace: typo.titleFont, align: 'center', valign: 'middle',
      })
      s.addShape(pptx.ShapeType.roundRect, {
        x: 5.2, y: 4.0, w: 3.0, h: 0.08, rectRadius: 0.04,
        fill: { color: theme.pptxAccent },
      })
      if (slide.subtitle) txt(s, slide.subtitle, 2, 4.3, 9.3, 0.6, { align: 'center', fontSize: typo.bodySize + 2 })
      const kw = slide.keywords || []
      if (kw.length > 0) {
        const tW = 2.5, gap = 0.3
        const total = kw.length * tW + (kw.length - 1) * gap
        const sx = (13.33 - total) / 2
        kw.forEach((k, j) => {
          drawCard(s, sx + j * (tW + gap), 5.2, tW, 0.8)
          txt(s, k, sx + j * (tW + gap) + p, 5.2, tW - p * 2, 0.8, { align: 'center' })
        })
      }
    } else if (lt === 'three_cards') {
      addTitle(s, slide.title)
      const cards = slide.cards || []
      const cW = 3.6, gap = 0.25, sx = 0.8
      cards.slice(0, 3).forEach((c, j) => {
        const cx = sx + j * (cW + gap)
        drawCard(s, cx, 1.7, cW, 5.3)
        txt(s, c.icon || '', cx, 2.0, cW, 0.7, { fontSize: 32, align: 'center' })
        txt(s, c.cardTitle, cx + p, 2.8, cW - p * 2, 0.6, { fontSize: typo.bodySize + 2, bold: true, align: 'center' })
        txt(s, c.description, cx + p, 3.5, cW - p * 2, 3.0, { align: 'center', valign: 'top' })
      })
    } else if (lt === 'scenario') {
      addTitle(s, slide.title)
      drawCard(s, 0.8, 1.7, 6.5, 5.3)
      txt(s, slide.scenario || '', 0.8 + p, 1.7 + p, 6.5 - p * 2, 2.8, { valign: 'top' })
      if (slide.question) txt(s, slide.question, 0.8 + p, 4.5, 6.5 - p * 2, 0.8, { bold: true, fontSize: typo.bodySize + 1 })
      const opts = slide.options || []
      const oH = Math.min(1.1, 5.3 / Math.max(opts.length, 1))
      opts.slice(0, 4).forEach((o, j) => {
        drawCard(s, 7.6, 1.7 + j * (oH + 0.15), 5.0, oH)
        txt(s, o, 7.6 + p, 1.7 + j * (oH + 0.15), 5.0 - p * 2, oH, { align: 'center' })
      })
    } else if (lt === 'compare') {
      addTitle(s, slide.title)
      drawCard(s, 0.8, 1.7, 5.6, 5.3)
      txt(s, slide.leftLabel || '', 0.8 + p, 1.9, 5.6 - p * 2, 0.6, { bold: true, fontSize: typo.bodySize + 3, align: 'center', color: theme.pptxAccent })
      ;(slide.leftItems || []).forEach((item, j) => {
        txt(s, `• ${item}`, 0.8 + p * 1.5, 2.7 + j * 0.8, 5.6 - p * 3, 0.7, { valign: 'top' })
      })
      drawCard(s, 6.9, 1.7, 5.6, 5.3)
      txt(s, slide.rightLabel || '', 6.9 + p, 1.9, 5.6 - p * 2, 0.6, { bold: true, fontSize: typo.bodySize + 3, align: 'center', color: theme.pptxAccent })
      ;(slide.rightItems || []).forEach((item, j) => {
        txt(s, `• ${item}`, 6.9 + p * 1.5, 2.7 + j * 0.8, 5.6 - p * 3, 0.7, { valign: 'top' })
      })
    } else if (lt === 'before_after') {
      addTitle(s, slide.title)
      drawCard(s, 0.8, 2.0, 4.5, 4.0)
      txt(s, slide.before || '', 0.8 + p, 2.0, 4.5 - p * 2, 4.0, { align: 'center', fontSize: typo.bodySize + 4, bold: true })
      txt(s, '→', 5.8, 3.2, 1.8, 1.5, { fontSize: 48, align: 'center', color: theme.pptxAccent, bold: true })
      drawCard(s, 8.0, 2.0, 4.5, 4.0)
      txt(s, slide.after || '', 8.0 + p, 2.0, 4.5 - p * 2, 4.0, { align: 'center', fontSize: typo.bodySize + 4, bold: true })
      if (slide.bridge) txt(s, slide.bridge, 2, 6.3, 9.3, 0.6, { align: 'center', italic: true })
    } else if (lt === 'big_number') {
      addTitle(s, slide.title)
      txt(s, slide.number || '', 0.8, 1.8, 11.7, 2.5, { fontSize: 80, bold: true, align: 'center', color: theme.pptxAccent })
      if (slide.label) txt(s, slide.label, 0.8, 4.2, 11.7, 0.6, { align: 'center', fontSize: typo.bodySize + 2 })
      const acts = slide.actions || []
      const aW = (11.7 - (acts.length - 1) * 0.25) / acts.length
      acts.slice(0, 4).forEach((a, j) => {
        const ax = 0.8 + j * (aW + 0.25)
        drawCard(s, ax, 5.2, aW, 1.8)
        txt(s, a, ax + p, 5.2, aW - p * 2, 1.8, { align: 'center' })
      })
    } else if (lt === 'question') {
      addTitle(s, slide.title)
      txt(s, slide.question || '', 1.5, 2.2, 10.3, 2.0, { fontSize: typo.titleSize + 4, bold: true, align: 'center', color: theme.pptxTitle })
      const pr = slide.prompts || []
      const pW = (10.3 - (pr.length - 1) * 0.25) / pr.length
      pr.slice(0, 3).forEach((pr2, j) => {
        const px = 1.5 + j * (pW + 0.25)
        drawCard(s, px, 4.8, pW, 2.0)
        txt(s, pr2, px + p, 4.8, pW - p * 2, 2.0, { align: 'center' })
      })
    } else if (lt === 'process') {
      addTitle(s, slide.title)
      const stps = slide.steps || []
      const n = stps.length
      const stW = Math.min(2.5, (11.7 - (n - 1) * 0.6) / n)
      const total = n * stW + (n - 1) * 0.6
      const sx = (13.33 - total) / 2
      stps.forEach((st, j) => {
        const stx = sx + j * (stW + 0.6)
        drawCard(s, stx, 3.0, stW, 2.5)
        txt(s, st, stx, 3.0, stW, 2.5, { align: 'center', fontSize: typo.bodySize })
        if (j < n - 1) txt(s, '→', stx + stW, 3.5, 0.6, 1.5, { fontSize: 32, align: 'center', color: theme.pptxAccent, bold: true })
      })
    } else if (lt === 'scale') {
      addTitle(s, slide.title)
      const lvls = slide.levels || []
      const lW = (11.7 - (lvls.length - 1) * 0.15) / lvls.length
      lvls.forEach((lv, j) => {
        const lx = 0.8 + j * (lW + 0.15)
        drawCard(s, lx, 2.8, lW, 3.5)
        txt(s, lv.emoji, lx, 3.0, lW, 1.2, { fontSize: 36, align: 'center' })
        txt(s, lv.label, lx, 4.3, lW, 1.5, { align: 'center', fontSize: typo.bodySize - 2 })
      })
    } else if (lt === 'reflection') {
      txt(s, slide.title, 0.8, 0.8, 11.5, 0.9, { fontSize: typo.titleSize, bold: true, color: theme.pptxTitle, fontFace: typo.titleFont })
      txt(s, slide.prompt || slide.question || '', 1.5, 2.5, 10.3, 3.0, {
        fontSize: typo.titleSize + 2, bold: true, align: 'center', valign: 'middle', color: theme.pptxTitle,
      })
    } else if (lt === 'takeaways') {
      addTitle(s, slide.title)
      const pts = slide.points || []
      const pH = Math.min(1.5, 5.3 / Math.max(pts.length, 1))
      pts.slice(0, 4).forEach((pt, j) => {
        drawCard(s, 0.8, 1.7 + j * (pH + 0.15), 11.7, pH)
        txt(s, pt.icon || '✦', 0.8 + p, 1.7 + j * (pH + 0.15), 0.8, pH, { fontSize: 24, align: 'center' })
        txt(s, pt.text, 1.8, 1.7 + j * (pH + 0.15), 10.5, pH, { valign: 'middle' })
      })
    } else if (lt === 'visual_explanation') {
      addTitle(s, slide.title)
      drawCard(s, 4.5, 2.5, 4.3, 2.0)
      txt(s, slide.centerLabel || '', 4.5, 2.5, 4.3, 2.0, { align: 'center', bold: true, fontSize: typo.bodySize + 4, color: theme.pptxAccent })
      const brs = slide.branches || []
      const positions = [[0.8, 1.8], [9.0, 1.8], [0.8, 5.2], [9.0, 5.2]]
      brs.slice(0, 4).forEach((br, j) => {
        const [bx, by] = positions[j]
        drawCard(s, bx, by, 3.5, 1.5)
        txt(s, br, bx, by, 3.5, 1.5, { align: 'center' })
      })
    } else {
      // Fallback: generic card layout
      addTitle(s, slide.title)
      const items = slide.bullets || slide.points?.map(p2 => p2.text) || []
      if (items.length === 1) {
        drawCard(s, 2.2, 2.5, 9.0, 4.0)
        txt(s, items[0], 2.2 + p * 2, 2.5 + p * 2, 9.0 - p * 4, 4.0 - p * 4, { align: 'center', fontSize: typo.bodySize + 4 })
      } else {
        items.forEach((b, j) => {
          const col = j % 2, row = Math.floor(j / 2)
          drawCard(s, 0.8 + col * 6.1, 1.7 + row * 2.8, 5.8, 2.5)
          txt(s, b, 0.8 + col * 6.1 + p, 1.7 + row * 2.8 + p, 5.8 - p * 2, 2.5 - p * 2, { valign: 'middle' })
        })
      }
    }

    if (slide.notes) s.addNotes(slide.notes)
    s.addText(`${i + 1} / ${slides.length}`, {
      x: 11.5, y: 7.0, w: 1.5, h: 0.4,
      fontSize: 10, color: theme.pptxText, align: 'right', fontFace: typo.bodyFont, transparency: 50,
    })
  })

  pptx.writeFile({ fileName: 'lesson-plan.pptx' })
}

// ── Slide Card Component ─────────────────────────────────────────────────────

function SlideCard({ slide, theme, typo, index, total, isTitleSlide }: {
  slide: SlideData; theme: SlideTheme; typo: TypographyConfig; index: number; total: number; isTitleSlide: boolean
}) {
  const r = typo.iconStyle === 'playful' ? 'rounded-3xl' : 'rounded-xl'
  const cp = typo.iconStyle === 'playful' ? 'p-8' : typo.iconStyle === 'standard' ? 'p-7' : 'p-6'

  if (isTitleSlide || slide.layoutType === 'hero') {
    return (
      <div className={`w-full h-full ${theme.bg} flex flex-col items-center justify-center ${typo.iconStyle === 'playful' ? 'p-12' : 'p-10'} text-center relative overflow-hidden`}>
        <div className={`absolute -top-20 -right-20 w-64 h-64 ${r} ${theme.accentLight} opacity-30 rotate-12`} />
        <div className={`absolute -bottom-16 -left-16 w-48 h-48 ${r} ${theme.accentLight} opacity-20 -rotate-12`} />
        <div className="relative z-10">
          <h1 className={`${theme.titleColor} font-bold mb-6 leading-tight`} style={{ fontSize: `${typo.titleSize + 8}px`, fontFamily: typo.titleFont }}>{slide.title}</h1>
          {slide.subtitle && <p className={`${theme.textColor} mb-4 max-w-xl mx-auto leading-relaxed`} style={{ fontSize: `${typo.bodySize + 2}px`, fontFamily: typo.bodyFont }}>{slide.subtitle}</p>}
          <div className={`w-24 h-1.5 ${r} ${theme.accentLight} mx-auto mb-6`} />
          {(slide.keywords || []).length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {slide.keywords!.map((k, i) => (
                <span key={i} className={`${theme.cardBg} ${theme.border} border ${r} px-5 py-2.5 ${theme.textColor} font-medium shadow-sm`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>{k}</span>
              ))}
            </div>
          )}
        </div>
        <div className={`absolute bottom-6 ${theme.textColor} text-sm opacity-50`}>{index + 1} / {total}</div>
      </div>
    )
  }

  const content = (() => {
    switch (slide.layoutType) {
      case 'three_cards': {
        const cards = slide.cards || []
        return (
          <div className={`flex-1 grid ${cards.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-4 auto-rows-fr`}>
            {cards.map((c, i) => (
              <div key={i} className={`${theme.cardBg} ${theme.border} border ${r} ${cp} shadow-lg flex flex-col items-center justify-center text-center`}>
                <span className="text-3xl mb-3">{c.icon}</span>
                <h3 className={`${theme.titleColor} font-bold mb-2`} style={{ fontSize: `${typo.bodySize + 2}px`, fontFamily: typo.titleFont }}>{c.cardTitle}</h3>
                <p className={`${theme.textColor} leading-relaxed`} style={{ fontSize: `${typo.bodySize - 1}px`, fontFamily: typo.bodyFont }}>{c.description}</p>
              </div>
            ))}
          </div>
        )
      }
      case 'scenario':
        return (
          <div className="flex-1 grid grid-cols-2 gap-5">
            <div className={`${theme.cardBg} ${theme.border} border ${r} ${cp} shadow-lg flex flex-col justify-center`}>
              <p className={`${theme.textColor} leading-relaxed mb-4`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>{slide.scenario}</p>
              {slide.question && <p className={`${theme.titleColor} font-semibold`} style={{ fontSize: `${typo.bodySize + 1}px`, fontFamily: typo.titleFont }}>{slide.question}</p>}
            </div>
            <div className="flex flex-col gap-3 justify-center">
              {(slide.options || []).map((o, i) => (
                <div key={i} className={`${theme.cardBg} ${theme.border} border ${r} p-4 shadow-md ${theme.textColor} font-medium text-center`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>{o}</div>
              ))}
            </div>
          </div>
        )
      case 'compare':
        return (
          <div className="flex-1 grid grid-cols-2 gap-5">
            {[{ label: slide.leftLabel, items: slide.leftItems }, { label: slide.rightLabel, items: slide.rightItems }].map((side, si) => (
              <div key={si} className={`${theme.cardBg} ${theme.border} border ${r} ${cp} shadow-lg flex flex-col`}>
                <h3 className={`${theme.accent} font-bold text-center mb-4`} style={{ fontSize: `${typo.bodySize + 3}px`, fontFamily: typo.titleFont }}>{side.label}</h3>
                <div className="flex-1 flex flex-col justify-center space-y-3">
                  {(side.items || []).map((item, j) => (
                    <div key={j} className={`${theme.textColor} flex items-start gap-2`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>
                      <span className={theme.accent}>•</span>{item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      case 'before_after':
        return (
          <div className="flex-1 flex items-center gap-4">
            <div className={`flex-1 ${theme.cardBg} ${theme.border} border ${r} ${cp} shadow-lg flex items-center justify-center text-center`}>
              <p className={`${theme.titleColor} font-bold leading-relaxed`} style={{ fontSize: `${typo.bodySize + 6}px`, fontFamily: typo.titleFont }}>{slide.before}</p>
            </div>
            <span className={`text-4xl ${theme.accent} font-bold`}>→</span>
            <div className={`flex-1 ${theme.cardBg} ${theme.border} border ${r} ${cp} shadow-lg flex items-center justify-center text-center`}>
              <p className={`${theme.titleColor} font-bold leading-relaxed`} style={{ fontSize: `${typo.bodySize + 6}px`, fontFamily: typo.titleFont }}>{slide.after}</p>
            </div>
            {slide.bridge && <div className={`absolute bottom-8 left-0 right-0 text-center ${theme.textColor} italic`} style={{ fontSize: `${typo.bodySize - 1}px`, fontFamily: typo.bodyFont }}>{slide.bridge}</div>}
          </div>
        )
      case 'big_number':
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className={theme.accent} style={{ fontSize: '80px', fontFamily: typo.titleFont, fontWeight: 700, lineHeight: 1 }}>{slide.number}</div>
            {slide.label && <p className={`${theme.textColor} mt-3 mb-8`} style={{ fontSize: `${typo.bodySize + 2}px`, fontFamily: typo.bodyFont }}>{slide.label}</p>}
            <div className={`flex gap-4 flex-wrap justify-center`}>
              {(slide.actions || []).map((a, i) => (
                <div key={i} className={`${theme.cardBg} ${theme.border} border ${r} px-6 py-3 shadow-md`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>
                  <span className={`${theme.textColor} font-medium`}>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )
      case 'question':
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <p className={`${theme.titleColor} font-bold mb-8 leading-snug`} style={{ fontSize: `${typo.titleSize + 6}px`, fontFamily: typo.titleFont }}>{slide.question}</p>
            <div className="flex gap-4 flex-wrap justify-center">
              {(slide.prompts || []).map((pr, i) => (
                <div key={i} className={`${theme.cardBg} ${theme.border} border ${r} ${cp} shadow-lg max-w-xs`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>
                  <p className={theme.textColor}>{pr}</p>
                </div>
              ))}
            </div>
          </div>
        )
      case 'process': {
        const stps = slide.steps || []
        return (
          <div className="flex-1 flex items-center justify-center gap-2 px-4">
            {stps.map((st, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`${theme.cardBg} ${theme.border} border ${r} ${cp} shadow-lg flex items-center justify-center text-center min-w-[100px] max-w-[180px]`}>
                  <p className={`${theme.textColor} font-medium`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>{st}</p>
                </div>
                {i < stps.length - 1 && <span className={`text-2xl ${theme.accent} font-bold`}>→</span>}
              </div>
            ))}
          </div>
        )
      }
      case 'scale': {
        const lvls = slide.levels || []
        return (
          <div className="flex-1 flex flex-col items-center justify-center">
            {slide.title && <p className={`${theme.textColor} mb-6`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>{slide.title}</p>}
            <div className="flex items-end gap-3">
              {lvls.map((lv, i) => (
                <div key={i} className={`${theme.cardBg} ${theme.border} border ${r} p-4 shadow-md flex flex-col items-center gap-2`}>
                  <span className="text-3xl">{lv.emoji}</span>
                  <span className={`${theme.textColor} text-xs font-medium text-center`} style={{ fontFamily: typo.bodyFont }}>{lv.label}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'reflection':
        return (
          <div className="flex-1 flex items-center justify-center text-center px-12">
            <p className={`${theme.titleColor} font-bold leading-snug`} style={{ fontSize: `${typo.titleSize + 4}px`, fontFamily: typo.titleFont }}>{slide.prompt || slide.question}</p>
          </div>
        )
      case 'takeaways': {
        const pts = slide.points || []
        return (
          <div className="flex-1 flex flex-col justify-center gap-3">
            {pts.map((pt, i) => (
              <div key={i} className={`${theme.cardBg} ${theme.border} border ${r} p-5 shadow-lg flex items-center gap-4`}>
                <span className="text-2xl flex-shrink-0">{pt.icon}</span>
                <p className={`${theme.textColor} leading-relaxed`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>{pt.text}</p>
              </div>
            ))}
          </div>
        )
      }
      case 'visual_explanation': {
        const brs = slide.branches || []
        return (
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className={`${theme.cardBg} ${theme.border} border ${r} px-8 py-5 shadow-xl ${theme.accent} font-bold text-center`} style={{ fontSize: `${typo.bodySize + 4}px`, fontFamily: typo.titleFont }}>
              {slide.centerLabel}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-2xl">
              {brs.map((br, i) => (
                <div key={i} className={`${theme.cardBg} ${theme.border} border ${r} p-4 shadow-md text-center`}>
                  <p className={`${theme.textColor}`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>{br}</p>
                </div>
              ))}
            </div>
          </div>
        )
      }
      default: {
        const items = slide.bullets || []
        if (items.length <= 1) {
          return (
            <div className="flex-1 flex items-center justify-center px-2">
              <div className={`${theme.cardBg} ${theme.border} border ${r} ${typo.iconStyle === 'playful' ? 'p-12' : 'p-10'} shadow-lg w-full max-w-3xl flex flex-col justify-center items-center text-center`}>
                <p className={`${theme.textColor} leading-relaxed`} style={{ fontSize: `${typo.bodySize + 4}px`, fontFamily: typo.bodyFont }}>{items[0]}</p>
              </div>
            </div>
          )
        }
        return (
          <div className={`flex-1 grid grid-cols-1 md:grid-cols-2 ${typo.iconStyle === 'playful' ? 'gap-5' : 'gap-4'} auto-rows-fr`}>
            {items.map((b, i) => (
              <div key={i} className={`${theme.cardBg} ${theme.border} border ${r} ${cp} shadow-lg flex flex-col justify-center`}>
                <p className={`${theme.textColor} leading-relaxed`} style={{ fontSize: `${typo.bodySize}px`, fontFamily: typo.bodyFont }}>{b}</p>
              </div>
            ))}
          </div>
        )
      }
    }
  })()

  return (
    <div className={`w-full h-full ${theme.bg} ${typo.iconStyle === 'playful' ? 'p-8 md:p-12' : 'p-6 md:p-10'} flex flex-col relative overflow-hidden`}>
      <div className="mb-4">
        <h2 className={`${theme.titleColor} font-bold`} style={{ fontSize: `${typo.titleSize}px`, fontFamily: typo.titleFont }}>{slide.title}</h2>
        <div className={`w-16 h-1 ${r} ${theme.accentLight} mt-2`} />
      </div>
      {content}
      <div className={`flex items-center justify-between mt-3 ${theme.textColor} text-xs opacity-50`}>
        <span>EchoBody</span><span>{index + 1} / {total}</span>
      </div>
    </div>
  )
}

// ── Main SlideViewer ─────────────────────────────────────────────────────────

interface Props { slides: SlideData[]; theme: SlideTheme; typography: TypographyConfig; onClose: () => void }

export default function SlideViewer({ slides, theme: initialTheme, typography, onClose }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [theme, setTheme] = useState(initialTheme)
  const [presentMode, setPresentMode] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const total = slides.length

  const goNext = useCallback(() => setCurrentSlide(s => Math.min(s + 1, total - 1)), [total])
  const goPrev = useCallback(() => setCurrentSlide(s => Math.max(s - 1, 0)), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if (e.key === 'Escape') { if (presentMode) setPresentMode(false); else onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, presentMode, onClose])

  useEffect(() => {
    if (presentMode && containerRef.current) containerRef.current.requestFullscreen?.().catch(() => {})
    else if (!presentMode && document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
  }, [presentMode])

  const slide = slides[currentSlide]
  const levelLabel = typography.level === 'low' ? '🎨 Playful' : typography.level === 'mid' ? '📐 Standard' : '📐 Editorial'

  return (
    <>
      <style>{`${FONT_LINK}
        @media print {
          body > * { visibility: hidden; }
          .slide-print-area, .slide-print-area * { visibility: visible; }
          .slide-print-area { position: fixed; left: 0; top: 0; width: 100%; z-index: 99999; }
          .slide-print-page { page-break-after: always; width: 100vw; height: 100vh; }
          .slide-print-page:last-child { page-break-after: avoid; }
        }
      `}</style>
      <div ref={containerRef} className={`fixed inset-0 z-[120] flex flex-col bg-black ${presentMode ? '' : 'p-4 md:p-8'}`}>
        {!presentMode && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-sm rounded-t-2xl">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
              <span className="text-white font-medium text-sm">{currentSlide + 1} / {total}</span>
              <span className="text-gray-500 text-xs hidden sm:inline">{levelLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowThemePicker(!showThemePicker)} className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all">
                  <Palette size={16} /><span className="hidden sm:inline">{theme.name}</span><ChevronDown size={14} />
                </button>
                {showThemePicker && (
                  <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 min-w-[200px] z-10">
                    <div className="px-4 py-1.5 text-xs text-gray-500 uppercase tracking-wider">Color Theme</div>
                    {THEMES.map(t => (
                      <button key={t.id} onClick={() => { setTheme(t); setShowThemePicker(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${theme.id === t.id ? 'text-white' : 'text-gray-300'}`}>
                        <div><div>{t.name}</div><div className="text-xs text-gray-500">{t.description}</div></div>
                        {theme.id === t.id && <span className="text-emerald-400 ml-2">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-px h-5 bg-gray-700" />
              <button onClick={() => setPresentMode(true)} className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all" title="Present Mode">
                <Maximize2 size={16} /><span className="hidden sm:inline">Present</span>
              </button>
              <div className="w-px h-5 bg-gray-700" />
              <button onClick={() => exportPptx(slides, theme, typography)} className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all" title="Export as PPTX">
                <Download size={16} /><span className="hidden sm:inline">PPTX</span>
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all" title="Print / Save as PDF">
                <Printer size={16} /><span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
        )}
        <div className={`flex-1 flex items-center justify-center relative ${presentMode ? '' : 'bg-gray-950'}`}>
          {presentMode && (
            <button onClick={() => setPresentMode(false)} className="absolute top-4 right-4 z-20 text-white/40 hover:text-white/80 transition-colors"><Minimize2 size={20} /></button>
          )}
          <div className={`w-full ${presentMode ? 'h-full' : 'h-full max-w-5xl aspect-video'} rounded-${presentMode ? 'none' : '2xl'} overflow-hidden shadow-2xl relative`}>
            <SlideCard slide={slide} theme={theme} typo={typography} index={currentSlide} total={total} isTitleSlide={currentSlide === 0} />
          </div>
          {currentSlide > 0 && (
            <button onClick={goPrev} className={`absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all ${presentMode ? 'opacity-0 hover:opacity-100' : ''}`}>
              <ChevronLeft size={20} />
            </button>
          )}
          {currentSlide < total - 1 && (
            <button onClick={goNext} className={`absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all ${presentMode ? 'opacity-0 hover:opacity-100' : ''}`}>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
        {!presentMode && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900/80 backdrop-blur-sm rounded-b-2xl">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-violet-500' : 'w-3 bg-gray-600 hover:bg-gray-500'}`} />
            ))}
          </div>
        )}
      </div>
      <div className="slide-print-area hidden print:block">
        {slides.map((s, i) => (
          <div key={i} className="slide-print-page">
            <SlideCard slide={s} theme={theme} typo={typography} index={i} total={total} isTitleSlide={i === 0} />
          </div>
        ))}
      </div>
    </>
  )
}
