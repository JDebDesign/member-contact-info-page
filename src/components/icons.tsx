import type { ReactNode } from 'react'

/** Inline icons so their strokes follow the active color mode instead of a baked-in color. */
function Svg({ size, color, children }: { size: number; color: string; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ color, flex: 'none' }}
    >
      {children}
    </svg>
  )
}

export function ChevronDownIcon() {
  return (
    <Svg size={16} color="var(--hcsc-color-text-primary)">
      <path d="M4 6L8 10L12 6" />
    </Svg>
  )
}

export function SeparatorIcon() {
  return (
    <Svg size={16} color="var(--hcsc-color-text-secondary)">
      <path d="M6 4L10 8L6 12" />
    </Svg>
  )
}

export function SearchIcon() {
  return (
    <Svg size={24} color="var(--hcsc-color-text-primary)">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16.5 16.5" />
    </Svg>
  )
}

export type NoticeIconType = 'info' | 'success' | 'warning' | 'error'

export function NoticeIcon({ type }: { type: NoticeIconType }) {
  switch (type) {
    case 'info':
      return (
        <Svg size={24} color="var(--hcsc-color-feedback-info-accent)">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11V16" />
          <path d="M12 8H12.01" />
        </Svg>
      )
    case 'success':
      return (
        <Svg size={24} color="var(--hcsc-color-feedback-success-fg)">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5L11 15.5L16 9.5" />
        </Svg>
      )
    case 'warning':
      return (
        <Svg size={24} color="var(--hcsc-color-text-primary)">
          <path d="M12 4L21 20H3L12 4Z" />
          <path d="M12 10V14" />
          <path d="M12 17H12.01" />
        </Svg>
      )
    case 'error':
      return (
        <Svg size={24} color="var(--hcsc-color-feedback-error-fg)">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9L15 15" />
          <path d="M15 9L9 15" />
        </Svg>
      )
  }
}

export function FieldErrorIcon() {
  return (
    <Svg size={20} color="var(--hcsc-color-feedback-error-fg)">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M7.5 7.5L12.5 12.5" />
      <path d="M12.5 7.5L7.5 12.5" />
    </Svg>
  )
}
