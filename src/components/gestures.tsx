import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export type PointerDrag = {
  kind: string
  uid: string
  name: string
  x: number
  y: number
  ox: number
  oy: number
}

type DragInternal = PointerDrag & { sx: number; sy: number }

export function usePointerDrag(handlers: {
  onDrop: (drag: PointerDrag, target: HTMLElement | null, moved: number) => void
  onMove?: (drag: PointerDrag, target: HTMLElement | null) => void
}) {
  const dragRef = useRef<DragInternal | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  const [drag, setDrag] = useState<PointerDrag | null>(null)

  useEffect(() => {
    function paint(current: DragInternal | null) {
      const ghost = document.getElementById('drag-ghost')
      const line = document.getElementById('wire-live')
      if (!current) {
        ghost?.setAttribute('hidden', '')
        if (line) line.style.display = 'none'
        document.querySelectorAll('.socket.over, .port.over, .zone.over').forEach((node) => node.classList.remove('over'))
        return
      }
      if (ghost) {
        ghost.hidden = false
        ghost.style.left = `${current.x}px`
        ghost.style.top = `${current.y}px`
        ghost.textContent = current.kind === 'wire' ? '' : current.name
        ghost.className = current.kind === 'wire' ? 'drag-ghost wire-ghost' : 'drag-ghost chip-ghost'
      }
      if (line && current.kind === 'wire') {
        line.style.display = 'block'
        const drawn = line.querySelector('line')
        drawn?.setAttribute('x1', String(current.ox))
        drawn?.setAttribute('y1', String(current.oy))
        drawn?.setAttribute('x2', String(current.x))
        drawn?.setAttribute('y2', String(current.y))
      } else if (line) {
        line.style.display = 'none'
      }
    }
    function move(event: PointerEvent) {
      const current = dragRef.current
      if (!current) return
      const next = { ...current, x: event.clientX, y: event.clientY }
      dragRef.current = next
      setDrag(next)
      paint(next)
      const target = dropAt(event.clientX, event.clientY)
      document.querySelectorAll<HTMLElement>('.socket, .port, .zone').forEach((node) => {
        node.classList.toggle('over', node === target)
      })
      handlersRef.current.onMove?.(next, target)
    }
    function up(event: PointerEvent) {
      const current = dragRef.current
      if (!current) return
      dragRef.current = null
      setDrag(null)
      paint(null)
      const moved = Math.hypot(event.clientX - current.sx, event.clientY - current.sy)
      handlersRef.current.onDrop(current, dropAt(event.clientX, event.clientY), moved)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])

  function begin(event: ReactPointerEvent, spec: { kind: string; uid?: string; name: string }) {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const next: DragInternal = {
      kind: spec.kind,
      uid: spec.uid ?? '',
      name: spec.name,
      x: event.clientX,
      y: event.clientY,
      ox: rect.left + rect.width / 2,
      oy: rect.top + rect.height / 2,
      sx: event.clientX,
      sy: event.clientY,
    }
    dragRef.current = next
    setDrag(next)
  }

  return { begin, drag }
}

export function dropAt(x: number, y: number): HTMLElement | null {
  const node = document.elementFromPoint(x, y)
  if (!(node instanceof Element)) return null
  const hit = node.closest('[data-drop]')
  return hit instanceof HTMLElement ? hit : null
}

export function SmearPad({
  testId,
  label,
  tone,
  onDone,
}: {
  testId: string
  label: string
  tone: 'paste' | 'grime' | 'clean'
  onDone: () => void
}) {
  const [cells, setCells] = useState<boolean[]>(() => Array(16).fill(false))
  const cellsRef = useRef(cells)
  const down = useRef(false)
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  cellsRef.current = cells

  function paint(clientX: number, clientY: number) {
    if (!down.current || done.current) return
    const pad = document.querySelector(`[data-testid="${testId}"]`)
    if (!(pad instanceof HTMLElement)) return
    const rect = pad.getBoundingClientRect()
    const x = Math.floor(((clientX - rect.left) / rect.width) * 4)
    const y = Math.floor(((clientY - rect.top) / rect.height) * 4)
    if (x < 0 || y < 0 || x > 3 || y > 3) return
    const index = y * 4 + x
    if (cellsRef.current[index]) return
    const next = cellsRef.current.slice()
    next[index] = true
    cellsRef.current = next
    setCells(next)
    if (next.filter(Boolean).length >= 12) {
      done.current = true
      down.current = false
      onDoneRef.current()
    }
  }

  useEffect(() => {
    function move(event: PointerEvent) {
      paint(event.clientX, event.clientY)
    }
    function up() {
      down.current = false
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [testId])

  return (
    <div
      className={`smear ${tone}`}
      data-testid={testId}
      onPointerDown={(event) => {
        event.preventDefault()
        down.current = true
        paint(event.clientX, event.clientY)
      }}
    >
      {cells.map((on, index) => (
        <i key={index} className={on ? 'on' : ''} />
      ))}
      <span>{label}</span>
    </div>
  )
}

export function SpinBolt({
  testId,
  className,
  onDone,
}: {
  testId: string
  className?: string
  onDone: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const spin = useRef<{ last: number; total: number } | null>(null)
  const [deg, setDeg] = useState(0)
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    function move(event: PointerEvent) {
      const current = spin.current
      const node = ref.current
      if (!current || !node || done.current) return
      const rect = node.getBoundingClientRect()
      const next = Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2))
      let delta = next - current.last
      if (delta > Math.PI) delta -= Math.PI * 2
      if (delta < -Math.PI) delta += Math.PI * 2
      current.total += delta
      current.last = next
      setDeg((current.total * 180) / Math.PI)
      if (Math.abs(current.total) >= Math.PI * 1.85) {
        done.current = true
        spin.current = null
        onDoneRef.current()
      }
    }
    function up() {
      spin.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`bolt ${className ?? ''}`}
      data-testid={testId}
      style={{ transform: `rotate(${deg}deg)` }}
      onPointerDown={(event) => {
        event.preventDefault()
        if (done.current || !ref.current) return
        const rect = ref.current.getBoundingClientRect()
        spin.current = {
          last: Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)),
          total: (deg * Math.PI) / 180,
        }
      }}
    >
      <b />
    </div>
  )
}

export function DragAcross({
  testId,
  label,
  onDone,
}: {
  testId: string
  label: string
  onDone: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const start = useRef<number | null>(null)
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    function move(event: PointerEvent) {
      const node = ref.current
      if (start.current === null || !node || done.current) return
      const rect = node.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      if (start.current < 0.28 && x > 0.78) {
        done.current = true
        start.current = null
        onDoneRef.current()
      }
    }
    function up() {
      start.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  return (
    <div
      ref={ref}
      className="drag-across"
      data-testid={testId}
      onPointerDown={(event) => {
        event.preventDefault()
        if (done.current || !ref.current) return
        const rect = ref.current.getBoundingClientRect()
        start.current = (event.clientX - rect.left) / rect.width
      }}
    >
      <i />
      <span>{label}</span>
    </div>
  )
}
