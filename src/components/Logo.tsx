interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const SIZE_CONFIG = {
  sm: { icon: 20, stroke: 2, text: 'text-lg', gap: 'gap-2' },
  md: { icon: 32, stroke: 2, text: 'text-2xl', gap: 'gap-2.5' },
  lg: { icon: 96, stroke: 1.5, text: 'text-4xl', gap: 'gap-3' },
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const cfg = SIZE_CONFIG[size]

  return (
    <div className={`inline-flex items-center ${cfg.gap}`}>
      <svg
        width={cfg.icon}
        height={cfg.icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 3 fluid wave lines tilted ~18° — flat minimalist, uniform stroke, round caps */}
        <g transform="rotate(18, 12, 12)" stroke="#8B5CF6" strokeWidth={cfg.stroke} strokeLinecap="round">
          <path d="M-1 6C3 3 7 9 12 6S21 3 25 6" opacity="0.45" />
          <path d="M-1 12C3 9 7 15 12 12S21 9 25 12" opacity="0.7" />
          <path d="M-1 18C3 15 7 21 12 18S21 15 25 18" />
        </g>
      </svg>
      {showText && (
        <span className={`font-bold text-violet-700 ${cfg.text}`}>EchoBody</span>
      )}
    </div>
  )
}
