import type { Assembly, OwnedPart } from '../parts'

export type TrayItem = {
  key: string
  drag: string
  uid?: string
  bit?: number
  partId?: string
  label: string
}

export type HotSocket = {
  id: string
  drag: string
  bit?: number
}

export type Interact =
  | { type: 'idle' }
  | { type: 'place' }
  | { type: 'paste'; tone: 'fresh' | 'grime' | 'clean' }
  | { type: 'screw' }
  | { type: 'cable' }
  | { type: 'boot' }
  | { type: 'ready' }
  | { type: 'hone'; index: number; partId: string }
  | { type: 'weld'; index: number; partId: string }
  | { type: 'mat-cooler' }
  | { type: 'mat-os'; partId: string }
  | { type: 'mat-gpu'; phase: 'pull' | 'scrub' | 'seat' | 'wire'; partId: string }

export type BenchSnapshot = {
  mode: 'pit' | 'build' | 'repair'
  parts: OwnedPart[]
  assembly: Assembly
  interact: Interact
  tray: TrayItem[]
  hot: HotSocket[]
  denyUids: string[]
  focusId: string | null
}

export type BenchDrop = {
  drag: string
  uid?: string
  bit?: number
  partId?: string
}

export type BenchHandlers = {
  onDrop?: (drop: BenchDrop) => void
  onSmearDone?: () => void
  onScrewDone?: (index: number) => void
  onStrokeDone?: () => void
  onDenied?: (uid: string) => void
  onProgress?: (amount: number) => void
}

export type Tag = {
  drag?: string
  uid?: string
  bit?: number
  partId?: string
  label?: string
  screw?: number
  paint?: boolean
  stroke?: boolean
  denied?: boolean
  role?: string
  anchor?: string
}
