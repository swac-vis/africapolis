import { useState, useRef, useEffect } from 'react'

const TOOLTIP_DELAY_MS = 80

/** Fast tooltip (shows after 100ms hover, vs ~700ms for native title) */
export function InfoTooltip({ text, children, className = '' }) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef(null)

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), TOOLTIP_DELAY_MS)
  }
  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    setVisible(false)
  }

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  return (
    <span
      className={`info-tooltip ${className}`.trim()}
      onMouseEnter={show}
      onMouseLeave={hide}
      aria-label={text}
    >
      {children}
      {visible && text && <span className="info-tooltip__popup">{text}</span>}
    </span>
  )
}
