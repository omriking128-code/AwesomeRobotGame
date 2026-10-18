import { useEffect, useRef, useState } from 'react'
import type { Save } from '../game'
import { catalog, installedUids, partByUid, repairCost, repairLabel, type PartKind } from '../parts'
import { DragAcross, SmearPad, SpinBolt, usePointerDrag } from './gestures'
import { playSnap } from '../sound'
import { DragChip, PartIcon } from '../pixel'

export function RepairBench({
  save,
  muted,
  onRepair,
  onUnequip,
}: {
  save: Save
  muted: boolean
  onRepair: (uid: string) => void
  onUnequip: (uid: string) => void
}) {
  const [job, setJob] = useState<string | null>(null)
  const installed = installedUids(save.assembly)
    .map((uid) => partByUid(save.parts, uid))
    .filter((item) => item !== null)
  const active = partByUid(save.parts, job)

  const { begin } = usePointerDrag({
    onDrop(drag, target, moved) {
      if (moved < 12 || !target) return
      if (drag.kind === 'job' && target.dataset.drop === 'mat') setJob(drag.uid)
      if (drag.kind === 'scrap' && target.dataset.drop === 'scrap') {
        onUnequip(drag.uid)
        if (job === drag.uid) setJob(null)
      }
    },
  })

  return (
    <section className="repair-bench" data-testid="repair-bench">
      <div className="repair-list">
        <h2>Repair bench</h2>
        <p className="fine">Drag a worn part onto the bench and do the job. You pay half the part’s price, scaled by the damage. A dead part goes in the scrap bin, then has to be bought again.</p>
        <div className="catalog">
          {installed.map((part) => {
            const item = catalog(part.id)
            const dead = part.durability <= 0
            const cost = repairCost(item.price, part.durability)
            const afford = save.money >= cost
            return (
              <article key={part.uid} className="part-card slim">
                <PartIcon id={item.id} />
                <div className="part-copy">
                <header>
                  <h3>{item.name}</h3>
                  <p>{dead ? 'Too damaged to repair. Drag it into the scrap bin.' : item.blurb}</p>
                </header>
                <div className={`dur ${part.durability <= 30 ? 'bad' : part.durability < 70 ? 'worn' : ''}`}>
                  <i style={{ width: `${part.durability}%` }} />
                </div>
                <p className="owned">{part.durability}% left{cost > 0 ? ` · repair ${cost}` : ''}</p>
                {dead ? (
                  <DragChip
                    icon={item.id}
                    testId={`scrap-${part.uid}`}
                    title="Drag to scrap"
                    hint={item.name}
                    onPointerDown={(event) => begin(event, { kind: 'scrap', uid: part.uid, name: item.name, icon: item.id })}
                  />
                ) : part.durability >= 100 ? (
                  <p className="fine">This part is fine.</p>
                ) : (
                  <DragChip
                    icon={item.id}
                    broke={!afford}
                    testId={`job-${part.uid}`}
                    title={`${repairLabel(item.kind)} · ${cost}`}
                    hint={afford ? 'Drag onto the bench' : 'Not enough money'}
                    onPointerDown={(event) => {
                      if (!afford) return
                      begin(event, { kind: 'job', uid: part.uid, name: item.name, icon: item.id })
                    }}
                  />
                )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <div className="job">
        <div className="repair-mat" data-testid="repair-mat" data-drop="mat">
          {active && active.durability > 0 && active.durability < 100 ? (
            <RepairJob
              key={active.uid}
              kind={catalog(active.id).kind}
              name={catalog(active.id).name}
              icon={active.id}
              cost={repairCost(catalog(active.id).price, active.durability)}
              muted={muted}
              onDone={() => {
                if (save.money < repairCost(catalog(active.id).price, active.durability)) return
                onRepair(active.uid)
                setJob(null)
              }}
            />
          ) : (
            <p className="fine">Drag a worn part here.</p>
          )}
        </div>
        <div className="scrap-bin" data-testid="scrap-bin" data-drop="scrap">Scrap bin</div>
      </div>
      <div id="drag-ghost" className="drag-ghost" hidden />
      <svg id="wire-live" className="wire-live" style={{ display: 'none' }} aria-hidden="true">
        <line x1="0" y1="0" x2="0" y2="0" />
      </svg>
    </section>
  )
}

function RepairJob({
  kind,
  name,
  icon,
  cost,
  muted,
  onDone,
}: {
  kind: PartKind
  name: string
  icon: string
  cost: number
  muted: boolean
  onDone: () => void
}) {
  const [phase, setPhase] = useState(0)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const { begin } = usePointerDrag({
    onDrop(drag, target, moved) {
      if (moved < 12 || !target) return
      if (drag.kind === 'cooler' && target.dataset.drop === 'cooler') onDoneRef.current()
      if (drag.kind === 'gpu-out' && target.dataset.drop === 'hand') setPhase(1)
      if (drag.kind === 'gpu-in' && target.dataset.drop === 'bay') setPhase(3)
      if (drag.kind === 'wire' && target.dataset.drop === 'contact') onDoneRef.current()
      if (drag.kind === 'os' && target.dataset.drop === 'reader') setPhase(1)
    },
  })

  useEffect(() => {
    if (kind !== 'os' || phase < 1) return
    const timer = window.setTimeout(() => onDoneRef.current(), 2000)
    return () => window.clearTimeout(timer)
  }, [kind, phase])

  if (kind === 'processor') {
    return (
      <div data-testid="repair-job">
        <h2>Clean {name}</h2>
        <p className="fine">Scrub the dried paste, spread a fresh coat, then seat the cooler. This costs {cost}.</p>
        {phase === 0 && <SmearPad testId="grime-pad" label="Scrub the old paste" tone="grime" onDone={() => setPhase(1)} />}
        {phase === 1 && <SmearPad testId="fresh-paste" label="Spread fresh paste" tone="paste" onDone={() => setPhase(2)} />}
        {phase === 2 && (
          <>
            <DragChip icon="cooler" testId="repair-cooler" title="Cooler" hint="Drag onto the chip" onPointerDown={(event) => begin(event, { kind: 'cooler', name: 'Cooler', icon: 'cooler' })} />
            <div className="socket inline" data-testid="repair-cooler-slot" data-drop="cooler">Drop cooler</div>
          </>
        )}
      </div>
    )
  }

  if (kind === 'wheels') {
    return (
      <WheelRepair name={name} cost={cost} muted={muted} onDone={onDone} />
    )
  }

  if (kind === 'weapon') {
    return (
      <div data-testid="repair-job">
        <h2>Hone {name}</h2>
        <p className="fine">Drag along the edge three times, from the left of each line to the right. This costs {cost}.</p>
        <HoneLines onDone={onDone} />
      </div>
    )
  }

  if (kind === 'material') {
    return (
      <div data-testid="repair-job">
        <h2>Weld {name}</h2>
        <p className="fine">Drag the welder along each crack, left to right. This costs {cost}.</p>
        <CrackLines onDone={onDone} />
      </div>
    )
  }

  if (kind === 'os') {
    return (
      <div data-testid="repair-job">
        <h2>Reinstall {name}</h2>
        <p className="fine">Slide the cartridge into the reader. It reinstalls on its own. This costs {cost}.</p>
        {phase === 0 && (
          <>
            <DragChip icon={icon} testId="os-cartridge" title={name} hint="Drag into the reader" onPointerDown={(event) => begin(event, { kind: 'os', name, icon })} />
            <div className="socket inline" data-testid="os-reader" data-drop="reader">Reader</div>
          </>
        )}
        {phase >= 1 && (
          <div className="boot-bar inline" data-testid="os-reload">
            <i />
            <span>Reinstalling</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div data-testid="repair-job">
      <h2>Reseat {name}</h2>
      <p className="fine">Pull the card, scrub the contacts, push it back in, and drag the wire on. This costs {cost}.</p>
      {phase === 0 && (
        <>
          <DragChip icon={icon} testId="gpu-card" title={name} hint="Drag it out of the bay" onPointerDown={(event) => begin(event, { kind: 'gpu-out', name, icon })} />
          <div className="socket inline" data-testid="gpu-hand" data-drop="hand">Pull here</div>
        </>
      )}
      {phase === 1 && <SmearPad testId="contact-pad" label="Scrub the contacts" tone="clean" onDone={() => setPhase(2)} />}
      {phase === 2 && (
        <>
          <DragChip icon={icon} testId="gpu-card-in" title={name} hint="Drag back into the bay" onPointerDown={(event) => begin(event, { kind: 'gpu-in', name, icon })} />
          <div className="socket inline" data-testid="gpu-bay" data-drop="bay">Bay</div>
        </>
      )}
      {phase === 3 && (
        <>
          <div className="wire-source inline" data-testid="repair-wire" onPointerDown={(event) => begin(event, { kind: 'wire', name: 'Wire' })}>
            Wire
          </div>
          <div className="port inline" data-testid="gpu-contact" data-drop="contact">Contact</div>
        </>
      )}
    </div>
  )
}

function WheelRepair({ name, cost, muted, onDone }: { name: string; cost: number; muted: boolean; onDone: () => void }) {
  const [done, setDone] = useState([false, false])
  const finished = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  useEffect(() => {
    if (!done.every(Boolean) || finished.current) return
    finished.current = true
    onDoneRef.current()
  }, [done])
  function mark(index: number) {
    if (!muted) playSnap()
    setDone((current) => {
      const next = current.slice()
      next[index] = true
      return next
    })
  }
  return (
    <div data-testid="repair-job">
      <h2>Tighten {name}</h2>
      <p className="fine">Spin each bolt in a full circle. This costs {cost}.</p>
      <div className="bolt-row">
        {!done[0] && <SpinBolt testId="repair-bolt-0" className="parked" onDone={() => mark(0)} />}
        {!done[1] && <SpinBolt testId="repair-bolt-1" className="parked" onDone={() => mark(1)} />}
      </div>
    </div>
  )
}

function HoneLines({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  if (step >= 3) return null
  return <DragAcross key={step} testId={`hone-${step}`} label={`Edge ${step + 1}`} onDone={() => (step === 2 ? onDone() : setStep(step + 1))} />
}

function CrackLines({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  if (step >= 3) return null
  return <DragAcross key={step} testId={`crack-${step}`} label={`Crack ${step + 1}`} onDone={() => (step === 2 ? onDone() : setStep(step + 1))} />
}
