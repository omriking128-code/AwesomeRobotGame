import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import type { Assembly, OwnedPart } from '../parts'
import {
  BUILD_STEPS,
  catalog,
  currentStep,
  partByUid,
  processorSlots,
  robotLook,
  stepDone,
} from '../parts'
import { PlayerRig } from './PlayerRig'
import { playBoot, playSnap, playWire } from '../sound'

type DragState =
  | { kind: 'processor'; uid: string; name: string; x: number; y: number; startX: number; startY: number; over: boolean }
  | { kind: 'wire'; x: number; y: number; ox: number; oy: number; startX: number; startY: number; overUid: string | null }

const PORTS = [
  { x: 176, y: 100 },
  { x: 160, y: 80 },
  { x: 34, y: 106 },
  { x: 34, y: 80 },
]

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
  const dragRef = useRef<DragState | null>(null)
  const partsRef = useRef(parts)
  const assemblyRef = useRef(assembly)
  const mutedRef = useRef(muted)
  const onChangeRef = useRef(onChange)
  partsRef.current = parts
  assemblyRef.current = assembly
  mutedRef.current = muted
  onChangeRef.current = onChange

  function publish(next: DragState | null) {
    dragRef.current = next
    const ghost = document.getElementById('drag-ghost')
    const line = document.getElementById('wire-live')
    if (!next) {
      ghost?.setAttribute('hidden', '')
      if (line) line.style.display = 'none'
      document.querySelectorAll('.socket.over, .port.over').forEach((node) => node.classList.remove('over'))
      return
    }
    if (ghost) {
      ghost.hidden = false
      ghost.style.left = `${next.x}px`
      ghost.style.top = `${next.y}px`
      ghost.textContent = next.kind === 'processor' ? next.name : ''
      ghost.className = next.kind === 'processor' ? 'drag-ghost chip-ghost' : 'drag-ghost wire-ghost'
    }
    if (line && next.kind === 'wire') {
      line.style.display = 'block'
      const drawn = line.querySelector('line')
      drawn?.setAttribute('x1', String(next.ox))
      drawn?.setAttribute('y1', String(next.oy))
      drawn?.setAttribute('x2', String(next.x))
      drawn?.setAttribute('y2', String(next.y))
    } else if (line) {
      line.style.display = 'none'
    }
    document.querySelectorAll('.socket').forEach((node) => {
      node.classList.toggle('over', next.kind === 'processor' && next.over)
    })
    document.querySelectorAll<HTMLElement>('.port').forEach((node) => {
      node.classList.toggle('over', next.kind === 'wire' && node.dataset.port === next.overUid && !node.classList.contains('done'))
    })
  }

  function play(sound: 'snap' | 'wire' | 'boot') {
    if (mutedRef.current) return
    if (sound === 'wire') playWire()
    else if (sound === 'boot') playBoot()
    else playSnap()
  }

  function commit(next: Assembly, sound: 'snap' | 'wire' | 'boot' = 'snap') {
    play(sound)
    onChangeRef.current(next)
  }

  useEffect(() => {
    function move(event: PointerEvent) {
      const current = dragRef.current
      if (!current) return
      const drop = dropAt(event.clientX, event.clientY)
      if (current.kind === 'processor') {
        publish({ ...current, x: event.clientX, y: event.clientY, over: drop?.dataset.drop === 'processor' })
      } else {
        publish({ ...current, x: event.clientX, y: event.clientY, overUid: drop?.dataset.port ?? null })
      }
    }
    function up(event: PointerEvent) {
      const current = dragRef.current
      if (!current) return
      const drop = dropAt(event.clientX, event.clientY)
      const moved = Math.hypot(event.clientX - current.startX, event.clientY - current.startY)
      publish(null)
      if (moved < 12) return
      if (current.kind === 'processor' && drop?.dataset.drop === 'processor') {
        const item = partByUid(partsRef.current, current.uid)
        if (!item) return
        const count = catalog(item.id).slots
        const weaponUids = assemblyRef.current.weaponUids.slice(0, count)
        commit({
          ...assemblyRef.current,
          processorUid: item.uid,
          weaponUids,
          wiredUids: assemblyRef.current.wiredUids.filter((uid) => weaponUids.includes(uid)),
        })
      }
      if (current.kind === 'wire' && drop?.dataset.port) {
        const uid = drop.dataset.port
        const bench = assemblyRef.current
        if (!bench.weaponUids.includes(uid) || bench.wiredUids.includes(uid)) return
        commit({ ...bench, wiredUids: [...bench.wiredUids, uid] }, 'wire')
      }
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

  function beginProcessor(event: ReactPointerEvent, item: OwnedPart) {
    event.preventDefault()
    publish({
      kind: 'processor',
      uid: item.uid,
      name: catalog(item.id).name,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      over: false,
    })
  }

  function beginWire(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    publish({
      kind: 'wire',
      x: event.clientX,
      y: event.clientY,
      ox: rect.left + rect.width / 2,
      oy: rect.top + rect.height / 2,
      startX: event.clientX,
      startY: event.clientY,
      overUid: null,
    })
  }

  function snap(next: Assembly, sound: 'snap' | 'wire' | 'boot' = 'snap') {
    play(sound)
    onChange(next)
  }

  const processors = parts.filter((item) => catalog(item.id).kind === 'processor')
  const wired = assembly.weaponUids.filter((uid) => assembly.wiredUids.includes(uid))

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
        <div className="rig-frame">
          <PlayerRig look={look} />
          <svg className="cable-layer" viewBox="0 0 210 220" aria-hidden="true">
            {wired.map((uid) => {
              const index = assembly.weaponUids.indexOf(uid)
              const spot = portSpot(index, assembly.weaponUids.length)
              return <line key={uid} x1="107" y1="124" x2={spot.x} y2={spot.y} />
            })}
          </svg>
          {step === 'processor' && (
            <div className="socket" data-testid="processor-socket" data-drop="processor">
              Drop here
            </div>
          )}
          {step === 'wire' && (
            <>
              <button type="button" className="wire-source" data-testid="wire-source" onPointerDown={beginWire}>
                Wire
              </button>
              {assembly.weaponUids.map((uid, index) => {
                const item = partByUid(parts, uid)
                const done = assembly.wiredUids.includes(uid)
                const spot = portSpot(index, assembly.weaponUids.length)
                return (
                  <div
                    key={uid}
                    className={done ? 'port done' : 'port'}
                    data-testid={`port-${uid}`}
                    data-port={done ? undefined : uid}
                    style={{ left: `${(spot.x / 210) * 100}%`, top: `${(spot.y / 220) * 100}%` }}
                  >
                    {item ? catalog(item.id).name : 'Port'}
                  </div>
                )
              })}
            </>
          )}
        </div>
        {step === 'ready' && <p className="ready-banner">Rivet is online.</p>}
      </div>

      <div className="step-panel">
        {step === 'processor' && (
          <StepCopy title="Drag the processor" body="Pick up a processor and drop it in the socket on Rivet’s chest. It sets speed, intelligence, and how many weapons can be wired.">
            {processors.length === 0 && <p className="fine">You have no processor. Open the part shop and buy one.</p>}
            {processors.map((item) => (
              <div
                key={item.uid}
                className="chip"
                data-testid={`drag-${item.id}`}
                onPointerDown={(event) => beginProcessor(event, item)}
              >
                <strong>{catalog(item.id).name}</strong>
                <span>{catalog(item.id).slots} weapon ports · drag onto the chest</span>
              </div>
            ))}
          </StepCopy>
        )}
        {step === 'wheels' && (
          <StepCopy title="Mount the wheels" body="Bolt them to the axles. Better wheels, more speed.">
            {owned(parts, 'wheels').map((item) => (
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
          <StepCopy title="Drag the wires" body="Grab the wire on the processor and drag it onto each weapon. A weapon with no wire cannot fire.">
            <ul className="wire-list">
              {assembly.weaponUids.map((uid) => {
                const item = partByUid(parts, uid)
                const done = assembly.wiredUids.includes(uid)
                return (
                  <li key={uid} className={done ? 'done' : ''}>
                    {done ? 'Wired' : 'Drag a wire here'} · {item ? catalog(item.id).name : 'Weapon'}
                  </li>
                )
              })}
            </ul>
          </StepCopy>
        )}
        {step === 'gpu' && (
          <StepCopy title="Install the GPU" body="Optional. A GPU gives a small boost to every stat. You can leave the slot empty.">
            {owned(parts, 'gpu').map((item) => (
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
            {owned(parts, 'os').map((item) => (
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
        {step === 'shell' && <ShellStep parts={parts} assembly={assembly} onChange={(next) => snap(next)} />}
        {step === 'ready' && (
          <StepCopy title="Ready for the pit" body="Rivet is wired, skinned, and booted. You can strip the frame if you want to rebuild with new parts.">
            <button type="button" className="ghost wide" data-testid="strip" onClick={() => onChange({ ...assembly, processorUid: null, wheelUid: null, materialUid: null, osUid: null, gpuUid: null, gpuSkipped: false, weaponUids: [], wiredUids: [], weaponsPlaced: false, wheelsMounted: false, osInstalled: false, plates: 0 })}>
              Strip the frame
            </button>
          </StepCopy>
        )}
      </div>
      <div id="drag-ghost" className="drag-ghost" hidden />
      <svg id="wire-live" className="wire-live" style={{ display: 'none' }} aria-hidden="true">
        <line x1="0" y1="0" x2="0" y2="0" />
      </svg>
    </section>
  )
}

function dropAt(x: number, y: number): HTMLElement | null {
  const node = document.elementFromPoint(x, y)
  if (!(node instanceof Element)) return null
  const hit = node.closest('[data-drop], [data-port]')
  return hit instanceof HTMLElement ? hit : null
}

function portSpot(index: number, count: number): { x: number; y: number } {
  if (index < PORTS.length && count <= PORTS.length) return PORTS[index]
  const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2
  return { x: 105 + Math.cos(angle) * 78, y: 118 + Math.sin(angle) * 72 }
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
