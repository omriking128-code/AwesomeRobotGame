import type { ReactNode } from 'react'
import type { Assembly, OwnedPart } from '../parts'
import {
  BUILD_STEPS,
  catalog,
  currentStep,
  partByUid,
  processorSlots,
  robotLook,
  stepDone,
  type BuildStep,
} from '../parts'
import { PlayerRig } from './PlayerRig'
import { playBoot, playSnap, playWire } from '../sound'

export function BuildBench({
  parts,
  assembly,
  muted,
  onChange,
}: {
  parts: OwnedPart[]
  assembly: Assembly
  muted: boolean
  onChange: (assembly: Assembly) => void
}) {
  const step = currentStep(assembly)
  const look = robotLook(parts, assembly)
  const slots = processorSlots(parts, assembly)
  const ownedKind = (kind: string) => parts.filter((item) => catalog(item.id).kind === kind)

  function snap(next: Assembly, sound: 'snap' | 'wire' | 'boot' = 'snap') {
    if (!muted) {
      if (sound === 'wire') playWire()
      else if (sound === 'boot') playBoot()
      else playSnap()
    }
    onChange(next)
  }

  return (
    <section className="build" data-testid="build">
      <ol className="checklist">
        {BUILD_STEPS.map((item, index) => {
          const state = stepDone(assembly, item.id) ? 'done' : step === item.id ? 'now' : 'locked'
          return (
            <li key={item.id} className={state}>
              <span>{state === 'done' ? '✓' : index + 1}</span>
              {item.label}
            </li>
          )
        })}
      </ol>

      <div className="stage">
        <PlayerRig look={look} />
        {step === 'ready' && <p className="ready-banner">Rivet is online.</p>}
        {assembly.wiredUids.length > 0 && <div className="cables" aria-hidden="true">{assembly.wiredUids.map((uid) => <i key={uid} />)}</div>}
      </div>

      <div className="step-panel">
        {step === 'processor' && (
          <StepCopy title="Seat the processor" body="This brain sets Rivet’s speed, intelligence, and how many weapons can be wired.">
            {ownedKind('processor').map((item) => (
              <button key={item.uid} type="button" className="buy can-afford" data-testid={`seat-${item.id}`} onClick={() => snap({ ...assembly, processorUid: item.uid, weaponUids: assembly.weaponUids.slice(0, catalog(item.id).slots), wiredUids: assembly.wiredUids.filter((uid) => assembly.weaponUids.slice(0, catalog(item.id).slots).includes(uid)) })}>
                Seat {catalog(item.id).name}
              </button>
            ))}
          </StepCopy>
        )}
        {step === 'wheels' && (
          <StepCopy title="Mount the wheels" body="Bolt them to the axles. Better wheels, more speed.">
            {ownedKind('wheels').map((item) => (
              <button key={item.uid} type="button" className="buy can-afford" data-testid="mount-wheels" onClick={() => snap({ ...assembly, wheelUid: item.uid, wheelsMounted: true })}>
                Bolt on {catalog(item.id).name}
              </button>
            ))}
          </StepCopy>
        )}
        {step === 'weapons' && (
          <WeaponStep parts={parts} assembly={assembly} slots={slots} onChange={(next) => snap(next)} />
        )}
        {step === 'wire' && (
          <StepCopy title="Wire the weapons" body="Pull a wire from the processor to each weapon. Unwired weapons cannot fire.">
            {assembly.weaponUids.map((uid) => {
              const item = partByUid(parts, uid)
              const done = assembly.wiredUids.includes(uid)
              return (
                <button
                  key={uid}
                  type="button"
                  className={done ? 'buy' : 'buy can-afford'}
                  disabled={done}
                  data-testid={`wire-${uid}`}
                  onClick={() => snap({ ...assembly, wiredUids: [...assembly.wiredUids, uid] }, 'wire')}
                >
                  {done ? `${item ? catalog(item.id).name : 'Weapon'} wired` : `Wire ${item ? catalog(item.id).name : 'weapon'}`}
                </button>
              )
            })}
          </StepCopy>
        )}
        {step === 'gpu' && (
          <StepCopy title="Install the GPU" body="Optional. A GPU gives a small boost to every stat. You can leave the slot empty.">
            {ownedKind('gpu').map((item) => (
              <button key={item.uid} type="button" className="buy can-afford" data-testid="seat-gpu" onClick={() => snap({ ...assembly, gpuUid: item.uid, gpuSkipped: false })}>
                Seat {catalog(item.id).name}
              </button>
            ))}
            <button type="button" className="ghost wide" data-testid="skip-gpu" onClick={() => snap({ ...assembly, gpuUid: null, gpuSkipped: true })}>
              Leave the slot empty
            </button>
          </StepCopy>
        )}
        {step === 'os' && (
          <StepCopy title="Install the OS" body="Boot the system. A better OS makes Rivet more likely to hit and to dodge.">
            {ownedKind('os').map((item) => (
              <button
                key={item.uid}
                type="button"
                className="buy can-afford"
                data-testid="install-os"
                onClick={() => snap({ ...assembly, osUid: item.uid, osInstalled: true }, 'boot')}
              >
                Install {catalog(item.id).name}
              </button>
            ))}
            <ol className="boot-lines">
              <li>Power to the processor.</li>
              <li>Weapons answer the wire.</li>
              <li>Rivet opens its eye.</li>
            </ol>
          </StepCopy>
        )}
        {step === 'shell' && (
          <ShellStep parts={parts} assembly={assembly} onChange={(next) => snap(next)} />
        )}
        {step === 'ready' && (
          <StepCopy title="Ready for the pit" body="Rivet is wired, skinned, and booted. You can strip the frame if you want to rebuild with new parts.">
            <button type="button" className="ghost wide" data-testid="strip" onClick={() => onChange({ ...assembly, processorUid: null, wheelUid: null, materialUid: null, osUid: null, gpuUid: null, gpuSkipped: false, weaponUids: [], wiredUids: [], weaponsPlaced: false, wheelsMounted: false, osInstalled: false, plates: 0 })}>
              Strip the frame
            </button>
          </StepCopy>
        )}
      </div>
    </section>
  )
}

function owned(parts: OwnedPart[], kind: string): OwnedPart[] {
  return parts.filter((item) => catalog(item.id).kind === kind)
}

function WeaponStep({
  parts,
  assembly,
  slots,
  onChange,
}: {
  parts: OwnedPart[]
  assembly: Assembly
  slots: number
  onChange: (assembly: Assembly) => void
}) {
  const choices = owned(parts, 'weapon').filter((item) => !assembly.weaponUids.includes(item.uid))
  const open = Math.max(0, slots - assembly.weaponUids.length)
  return (
    <StepCopy title="Place the weapons" body={`This processor can control ${slots} weapons. Place at least one, then move on.`}>
      <div className="slot-row">
        {Array.from({ length: slots }, (_, index) => {
          const uid = assembly.weaponUids[index]
          const item = partByUid(parts, uid ?? null)
          return (
            <span key={index} className={uid ? 'slot filled' : 'slot'} data-testid={`slot-${index}`}>
              {item ? catalog(item.id).name : `Port ${index + 1}`}
            </span>
          )
        })}
      </div>
      {open > 0 &&
        choices.map((item) => (
          <button
            key={item.uid}
            type="button"
            className="buy can-afford"
            data-testid={`pick-${item.id}`}
            onClick={() => onChange({ ...assembly, weaponUids: [...assembly.weaponUids, item.uid] })}
          >
            Mount {catalog(item.id).name}
          </button>
        ))}
      <button
        type="button"
        className="ghost wide"
        data-testid="weapons-done"
        disabled={assembly.weaponUids.length === 0}
        onClick={() => onChange({ ...assembly, weaponsPlaced: true })}
      >
        Weapons are seated
      </button>
    </StepCopy>
  )
}

function ShellStep({
  parts,
  assembly,
  onChange,
}: {
  parts: OwnedPart[]
  assembly: Assembly
  onChange: (assembly: Assembly) => void
}) {
  const shells = owned(parts, 'material')
  const selected = assembly.materialUid
  const plates = ['Chest plate', 'Left pauldron', 'Right pauldron', 'Head cap']
  return (
    <StepCopy title="Cover the frame" body="Four plates close the shell. The material sets Rivet’s health and armor.">
      {shells.map((item) => (
        <button
          key={item.uid}
          type="button"
          className={selected === item.uid ? 'buy can-afford' : 'buy'}
          data-testid={`use-${item.id}`}
          onClick={() => onChange({ ...assembly, materialUid: item.uid, plates: selected === item.uid ? assembly.plates : 0 })}
        >
          Use {catalog(item.id).name}
        </button>
      ))}
      <div className="slot-row">
        {plates.map((label, index) => (
          <button
            key={label}
            type="button"
            className={assembly.plates > index ? 'slot filled' : 'slot plate'}
            data-testid={`plate-${index}`}
            disabled={!selected || assembly.plates !== index}
            onClick={() => onChange({ ...assembly, plates: index + 1 })}
          >
            {assembly.plates > index ? 'Set' : label}
          </button>
        ))}
      </div>
    </StepCopy>
  )
}

function StepCopy({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div>
      <h2>{title}</h2>
      <p className="fine">{body}</p>
      <div className="step-actions">{children}</div>
    </div>
  )
}
