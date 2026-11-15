import { useEffect, useRef } from 'react'
import type { BenchHandlers, BenchSnapshot } from '../workbench/types'
import { BenchSession } from '../workbench/session'

export function BenchCanvas({
  snapshot,
  interactive = true,
  handlers,
}: {
  snapshot: BenchSnapshot
  interactive?: boolean
  handlers?: BenchHandlers
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef<BenchSession | null>(null)
  const handlersRef = useRef(handlers)
  const snapshotRef = useRef(snapshot)
  handlersRef.current = handlers
  snapshotRef.current = snapshot

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const session = new BenchSession(canvas, {
      onDrop: (drop) => handlersRef.current?.onDrop?.(drop),
      onSmearDone: () => handlersRef.current?.onSmearDone?.(),
      onScrewDone: (index) => handlersRef.current?.onScrewDone?.(index),
      onStrokeDone: () => handlersRef.current?.onStrokeDone?.(),
      onDenied: (uid) => handlersRef.current?.onDenied?.(uid),
      onProgress: (amount) => handlersRef.current?.onProgress?.(amount),
    })
    sessionRef.current = session
    session.setInteractive(interactive)
    session.setSnapshot(snapshotRef.current)
    return () => {
      session.dispose()
      sessionRef.current = null
    }
  }, [])

  useEffect(() => {
    sessionRef.current?.setInteractive(interactive)
  }, [interactive])

  useEffect(() => {
    sessionRef.current?.setSnapshot(snapshot)
  }, [snapshot])

  return <canvas ref={canvasRef} className="bench-canvas" data-testid="bench-canvas" />
}
