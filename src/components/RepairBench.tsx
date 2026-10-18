import { useState } from 'react'
import type { Save } from '../game'
import { catalog, installedUids, partByUid, repairCost, repairLabel, type PartKind } from '../parts'
import { playSnap } from '../sound'

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

  return (
    <section className="repair-bench" data-testid="repair-bench">
      <div className="repair-list">
        <h2>Repair bench</h2>
        <p className="fine">Each part wears out in its own way. Fix it before it dies. A dead part has to come off and be replaced.</p>
        <div className="catalog">
        {installed.map((part) => {
          const item = catalog(part.id)
          const cost = repairCost(part)
          const dead = part.durability <= 0
          const afford = cost > 0 && save.money >= cost
          return (
            <article key={part.uid} className="part-card slim">
              <header>
                <h3>{item.name}</h3>
                <p>{dead ? 'Too damaged to repair.' : item.blurb}</p>
              </header>
              <div className={`dur ${part.durability <= 30 ? 'bad' : part.durability < 70 ? 'worn' : ''}`}>
                <i style={{ width: `${part.durability}%` }} />
              </div>
              <p className="owned">{part.durability}% left</p>
              {dead ? (
                <button type="button" className="buy can-afford" data-testid={`replace-${part.uid}`} onClick={() => onUnequip(part.uid)}>
                  Remove the dead part
                </button>
              ) : cost === 0 ? (
                <p className="fine">This part is fine.</p>
              ) : (
                <button
                  type="button"
                  className={afford ? 'buy can-afford' : 'buy'}
                  disabled={!afford}
                  data-testid={`repair-${part.uid}`}
                  onClick={() => setJob(part.uid)}
                >
                  {repairLabel(item.kind)} · {cost}
                </button>
              )}
            </article>
          )
        })}
        </div>
      </div>
      <div className="job">
        {active && active.durability > 0 && active.durability < 100 ? (
          <RepairJob
            key={active.uid}
            kind={catalog(active.id).kind}
            name={catalog(active.id).name}
            muted={muted}
            onDone={() => {
              onRepair(active.uid)
              setJob(null)
            }}
          />
        ) : (
          <p className="fine">Pick a worn part. The bench shows you how that part is fixed.</p>
        )}
      </div>
    </section>
  )
}

function RepairJob({
  kind,
  name,
  muted,
  onDone,
}: {
  kind: PartKind
  name: string
  muted: boolean
  onDone: () => void
}) {
  const [step, setStep] = useState(0)
  const [bolts, setBolts] = useState([0, 0])

  function finish(next: number, goal: number) {
    if (!muted) playSnap()
    if (next >= goal) onDone()
    else setStep(next)
  }

  return (
    <div data-testid="repair-job">
      <h2>{repairLabel(kind)}</h2>
      <p className="fine">{jobCopy(kind, name)}</p>
      {kind === 'processor' && (
        <div className="slot-row">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              className={index === step ? 'slot plate lit' : 'slot plate'}
              data-testid={`trace-${index}`}
              onClick={() => {
                if (index !== step) return
                finish(step + 1, 3)
              }}
            >
              Trace {index + 1}
            </button>
          ))}
        </div>
      )}
      {kind === 'weapon' && (
        <div className="slot-row">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              className={index < step ? 'slot filled' : 'slot plate'}
              data-testid={`hone-${index}`}
              disabled={index !== step}
              onClick={() => finish(step + 1, 3)}
            >
              Nick {index + 1}
            </button>
          ))}
        </div>
      )}
      {kind === 'wheels' && (
        <div className="slot-row">
          {bolts.map((turns, index) => (
            <button
              key={index}
              type="button"
              className={turns >= 2 ? 'slot filled' : 'slot plate'}
              data-testid={`bolt-${index}`}
              disabled={turns >= 2}
              onClick={() => {
                const next = bolts.map((value, bolt) => (bolt === index ? value + 1 : value))
                if (!muted) playSnap()
                setBolts(next)
                if (next.every((value) => value >= 2)) onDone()
              }}
            >
              Bolt {index + 1} · {turns}/2
            </button>
          ))}
        </div>
      )}
      {kind === 'material' && (
        <div className="slot-row">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              className={index < step ? 'slot filled' : 'slot plate'}
              data-testid={`crack-${index}`}
              disabled={index !== step}
              onClick={() => finish(step + 1, 3)}
            >
              Crack {index + 1}
            </button>
          ))}
        </div>
      )}
      {kind === 'os' && (
        <div className="step-actions">
          {['Clear the bad sector', 'Rewrite the boot line', 'Close the kernel'].map((label, index) => (
            <button
              key={label}
              type="button"
              className={index < step ? 'buy' : 'buy can-afford'}
              data-testid={`patch-${index}`}
              disabled={index !== step}
              onClick={() => finish(step + 1, 3)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {kind === 'gpu' && (
        <button type="button" className="buy can-afford" data-testid="reseat" onClick={() => finish(step + 1, 2)}>
          {step === 0 ? 'Line the card up' : 'Press it into the slot'}
        </button>
      )}
    </div>
  )
}

function jobCopy(kind: PartKind, name: string): string {
  if (kind === 'processor') return `Follow the lit traces to recalibrate ${name}.`
  if (kind === 'weapon') return `Hone each nick on ${name}.`
  if (kind === 'wheels') return `Turn each bolt twice.`
  if (kind === 'material') return `Weld the cracks in ${name}.`
  if (kind === 'os') return `Run the patch, one line at a time.`
  return `Seat ${name} until it clicks.`
}
