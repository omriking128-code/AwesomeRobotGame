import { useLayoutEffect, useRef, useState, useEffect, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { PART_ART } from './part-art'

export const INK: Record<string, string> = {
  o: '#140e0a',
  k: '#241910',
  d: '#4a3a2c',
  m: '#8d7560',
  l: '#e6d3b4',
  w: '#f7f1e6',
  a: '#ffb020',
  A: '#a85a00',
  E: '#ff5a1f',
  g: '#6ec85a',
  G: '#1f6b32',
  b: '#6eb0e0',
  B: '#1d4e78',
  r: '#e4453a',
  R: '#7a1c16',
  y: '#ffe566',
  Y: '#c49212',
  p: '#d2a6ea',
  n: '#5c3d78',
  s: '#d5dee6',
  S: '#5c6c7c',
  c: '#7dfff2',
  C: '#147066',
}

export function cropArt(rows: readonly string[]): string[] {
  let minX = 99
  let minY = 99
  let maxX = 0
  let maxY = 0
  let any = false
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== '.' && row[x] !== ' ') {
        any = true
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  })
  if (!any) return rows.map((row) => row)
  return rows.slice(minY, maxY + 1).map((row) => row.slice(minX, maxX + 1))
}

export function blit(
  ctx: CanvasRenderingContext2D,
  rows: readonly string[],
  x: number,
  y: number,
  scale: number,
  colors?: Record<string, string>,
  skip = '',
) {
  for (let py = 0; py < rows.length; py += 1) {
    const row = rows[py]
    for (let px = 0; px < row.length; px += 1) {
      const ch = row[px]
      if (ch === '.' || ch === ' ' || skip.includes(ch)) continue
      const fill = colors?.[ch] ?? INK[ch]
      if (!fill) continue
      ctx.fillStyle = fill
      ctx.fillRect(x + px * scale, y + py * scale, scale, scale)
    }
  }
}

export function PixelStage({
  draw,
  className,
}: {
  draw: (ctx: CanvasRenderingContext2D) => void
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    draw(ctx)
  })
  return <canvas ref={ref} className={className ?? 'robot-svg'} width={210} height={220} aria-hidden="true" />
}

export function useBlink(): boolean {
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const id = window.setInterval(() => {
      frame = (frame + 1) % 22
      const next = frame >= 20
      setBlink((current) => (current === next ? current : next))
    }, 140)
    return () => window.clearInterval(id)
  }, [])
  return blink
}

function framed(rows: readonly string[]) {
  const cropped = cropArt(rows)
  const w = cropped[0]?.length ?? 1
  const h = cropped.length
  const side = Math.max(w, h) + 2
  const ox = Math.floor((side - w) / 2)
  const oy = Math.floor((side - h) / 2)
  return { cropped, side, ox, oy }
}

export function PartIcon({ id, size = 64 }: { id: string; size?: number }) {
  const rows = PART_ART[id]
  if (!rows) return null
  const { cropped, side, ox, oy } = framed(rows)
  const rects: ReactNode[] = []
  cropped.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const fill = INK[row[x]]
      if (!fill) continue
      rects.push(<rect key={`${x}-${y}`} x={x + ox} y={y + oy} width={1} height={1} fill={fill} />)
    }
  })
  return (
    <svg className="part-icon" viewBox={`0 0 ${side} ${side}`} width={size} height={size} aria-hidden="true" shapeRendering="crispEdges">
      <rect width={side} height={side} fill="#120e0b" />
      {rects}
    </svg>
  )
}

export function iconMarkup(id: string): string {
  const rows = PART_ART[id]
  if (!rows) return ''
  const { cropped, side, ox, oy } = framed(rows)
  let body = `<rect width="${side}" height="${side}" fill="#120e0b"/>`
  cropped.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const fill = INK[row[x]]
      if (!fill) continue
      body += `<rect x="${x + ox}" y="${y + oy}" width="1" height="1" fill="${fill}"/>`
    }
  })
  return `<svg viewBox="0 0 ${side} ${side}" width="32" height="32" shape-rendering="crispEdges">${body}</svg>`
}

export function DragChip({
  icon,
  title,
  hint,
  testId,
  broke,
  onPointerDown,
}: {
  icon?: string
  title: string
  hint: string
  testId?: string
  broke?: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  return (
    <div className={broke ? 'chip broke' : 'chip'} data-testid={testId} onPointerDown={onPointerDown}>
      {icon ? <PartIcon id={icon} size={48} /> : null}
      <span className="chip-copy">
        <strong>{title}</strong>
        <span>{hint}</span>
      </span>
    </div>
  )
}
