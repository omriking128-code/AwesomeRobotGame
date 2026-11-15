import { useEffect, useMemo, useRef, useState } from 'react'
import type { Save } from '../game'
import { catalog, installedUids, partByUid, repairCost, repairLabel } from '../parts'
import { PartIcon } from '../pixel'
import { BenchCanvas } from './BenchCanvas'
import type { BenchSnapshot, HotSocket, Interact } from '../workbench/types'

export function RepairBench({
  save,
  onRepair,
  onUnequip,
}: {
  save: Save
  muted: boolean
  onRepair: (uid: string) => void
  onUnequip: (uid: string) => void
}) {
  const [job, setJob] = useState<string | null>(null)
  const [phase, setPhase] = useState(0)
  const [stroke, setStroke] = useState(0)
  const [bolts, setBolts] = useState(0)
  const [notice, setNotice] = useState('')
  const bar = useRef<HTMLElement>(null)
  const installed = installedUids(save.assembly)
    .map((uid) => partByUid(save.parts, uid))
    .filter((item) => item !== null)
  const active = partByUid(save.parts, job)

  function finish(uid: string) {
    if (save.money < repairCost(catalog(partByUid(save.parts, uid)?.id ?? 'punch').price, partByUid(save.parts, uid)?.durability ?? 0)) {
      setNotice('Not enough money for that repair.')
      return
    }
    onRepair(uid)
    setJob(null)
    setPhase(0)
    setStroke(0)
    setBolts(0)
    if (bar.current) bar.current.style.width = '0%'
  }

  useEffect(() => {
    if (!active || catalog(active.id).kind !== 'os' || phase < 1) return
    const timer = window.setTimeout(() => finish(active.uid), 2000)
    return () => window.clearTimeout(timer)
  }, [active?.uid, active ? catalog(active.id).kind : '', phase])

  const interact: Interact = !active
    ? { type: 'idle' }
    : interactFor(catalog(active.id).kind, phase, stroke, active.id)
  const hot: HotSocket[] = !active
    ? [{ id: 'mat', drag: 'repair' }, { id: 'bin', drag: 'scrap' }]
    : hotFor(interact)
  const denyUids = installed
    .filter((part) => {
      const cost = repairCost(catalog(part.id).price, part.durability)
      return part.durability > 0 && part.durability < 100 && save.money < cost
    })
    .map((part) => part.uid)

  const snapshot = useMemo<BenchSnapshot>(() => ({
    mode: 'repair',
    parts: save.parts,
    assembly: save.assembly,
    interact,
    tray: [],
    hot,
    denyUids,
    focusId: active?.id ?? null,
  }), [save.parts, save.assembly, interact, hot, denyUids, active?.id])

  const copy = describe(active?.id ?? null, active ? catalog(active.id).kind : null, phase, stroke, active ? repairCost(catalog(active.id).price, active.durability) : 0)

  return (
    <section className="bench-screen repair" data-testid="repair-bench">
      <BenchCanvas
        snapshot={snapshot}
        handlers={{
          onDrop: (drop) => {
            if (drop.drag === 'scrap' && drop.uid) {
              onUnequip(drop.uid)
              if (job === drop.uid) setJob(null)
              return
            }
            if (drop.drag === 'repair' && drop.uid) {
              setNotice('')
              setJob(drop.uid)
              setPhase(0)
              setStroke(0)
              setBolts(0)
              if (bar.current) bar.current.style.width = '0%'
              return
            }
            if (!active) return
            if (drop.drag === 'cooler') finish(active.uid)
            if (drop.drag === 'os') setPhase(1)
            if (drop.drag === 'gpu-card' && phase === 0) setPhase(1)
            if (drop.drag === 'gpu-card' && phase === 2) setPhase(3)
            if (drop.drag === 'cable') finish(active.uid)
          },
          onSmearDone: () => setPhase((current) => current + 1),
          onScrewDone: () => {
            setBolts((current) => {
              const next = current + 1
              if (next >= 2 && active) finish(active.uid)
              return next
            })
          },
          onStrokeDone: () => {
            if (stroke >= 2 && active) finish(active.uid)
            else setStroke((current) => current + 1)
          },
          onDenied: (uid) => {
            const part = partByUid(save.parts, uid)
            if (!part) return
            setNotice(`${catalog(part.id).name} needs ${repairCost(catalog(part.id).price, part.durability)} money before it will come off the chassis.`)
          },
          onProgress: (amount) => {
            if (bar.current) bar.current.style.width = `${Math.round(amount * 100)}%`
          },
        }}
      />
      <aside className="repair-roll">
        <h2>Repair bench</h2>
        <p>Pull a worn part off Rivet and do the job on the mat. A dead part goes in the scrap bin.</p>
        <ul>
          {installed.map((part) => {
            const item = catalog(part.id)
            const cost = repairCost(item.price, part.durability)
            const tone = part.durability <= 0 ? 'dead' : part.durability < 100 ? 'worn' : 'ok'
            return (
              <li key={part.uid} className={tone}>
                <PartIcon id={item.id} size={40} />
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {part.durability}% left
                    {cost > 0 ? ` · ${repairLabel(item.kind)} ${cost}` : part.durability <= 0 ? ' · scrap it' : ' · fine'}
                  </span>
                  <b><i style={{ width: `${part.durability}%` }} /></b>
                </div>
              </li>
            )
          })}
        </ul>
      </aside>
      <div className="bench-help">Drag empty bench to turn Rivet. Scroll to zoom.</div>
      <div className="bench-hud">
        <div className="bench-copy">
          <h2>{copy.title}</h2>
          <p>{copy.body}</p>
          {notice && <p className="notice">{notice}</p>}
          <div className="bench-meter" aria-hidden="true"><i ref={bar} /></div>
        </div>
      </div>
    </section>
  )
}

function interactFor(kind: string, phase: number, stroke: number, partId: string): Interact {
  if (kind === 'processor') {
    if (phase === 0) return { type: 'paste', tone: 'grime' }
    if (phase === 1) return { type: 'paste', tone: 'fresh' }
    return { type: 'mat-cooler' }
  }
  if (kind === 'wheels') return { type: 'screw' }
  if (kind === 'weapon') return { type: 'hone', index: stroke, partId }
  if (kind === 'material') return { type: 'weld', index: stroke, partId }
  if (kind === 'os') return phase === 0 ? { type: 'mat-os', partId } : { type: 'boot' }
  const gpuPhase = (['pull', 'scrub', 'seat', 'wire'] as const)[phase] ?? 'wire'
  return { type: 'mat-gpu', phase: gpuPhase, partId }
}

function hotFor(interact: Interact): HotSocket[] {
  if (interact.type === 'mat-cooler') return [{ id: 'mat-cooler', drag: 'cooler' }]
  if (interact.type === 'mat-os') return [{ id: 'mat-os', drag: 'os' }]
  if (interact.type === 'mat-gpu' && interact.phase === 'pull') return [{ id: 'gpu-out', drag: 'gpu-card' }]
  if (interact.type === 'mat-gpu' && interact.phase === 'seat') return [{ id: 'gpu-in', drag: 'gpu-card' }]
  if (interact.type === 'mat-gpu' && interact.phase === 'wire') return [{ id: 'gpu-port', drag: 'cable' }]
  return []
}

function describe(partId: string | null, kind: string | null, phase: number, stroke: number, cost: number) {
  if (!partId || !kind) return { title: 'Parts on the chassis', body: 'Grab a worn part and drop it on the blue mat. Dead parts drop in the scrap bin. The price is half the part, scaled by the damage.' }
  const name = catalog(partId).name
  const price = cost > 0 ? ` This costs ${cost}.` : ''
  if (kind === 'processor' && phase === 0) return { title: `Scrub ${name}`, body: `Rub the dried paste off the cap.${price}` }
  if (kind === 'processor' && phase === 1) return { title: `Paste ${name}`, body: `Spread a fresh coat across the metal.${price}` }
  if (kind === 'processor') return { title: `Seat the cooler`, body: `Drop the fin stack back onto the chip.${price}` }
  if (kind === 'wheels') return { title: `Tighten ${name}`, body: `Turn both lug nuts through a full circle.${price}` }
  if (kind === 'weapon') return { title: `Hone ${name}`, body: `Drag along edge ${stroke + 1} of 3, from the left end to the right.${price}` }
  if (kind === 'material') return { title: `Weld ${name}`, body: `Run the bead along crack ${stroke + 1} of 3.${price}` }
  if (kind === 'os' && phase === 0) return { title: `Reinstall ${name}`, body: `Slide the cartridge into the reader.${price}` }
  if (kind === 'os') return { title: `Reinstalling ${name}`, body: 'The reader is flashing the image. Give it a moment.' }
  if (phase === 0) return { title: `Pull ${name}`, body: `Drag the card out of the slot, onto the mat.${price}` }
  if (phase === 1) return { title: `Clean the contacts`, body: `Scrub the gold fingers until they shine.${price}` }
  if (phase === 2) return { title: `Reseat ${name}`, body: `Push the card back into the slot.${price}` }
  return { title: `Plug ${name} back in`, body: `Seat the power lead on the card.${price}` }
}
