import { useEffect, useRef, type ReactNode } from 'react'
import type { Assembly, OwnedPart } from '../parts'
import {
  BUILD_STEPS,
  catalog,
  currentStep,
  emptyAssembly,
  hardpoint,
  partByUid,
  processorSlots,
  robotLook,
  stepDone,
} from '../parts'
import { PlayerRig } from './PlayerRig'
import { SmearPad, SpinBolt, usePointerDrag } from './gestures'
import { playBoot, playSnap, playWire } from '../sound'

const ZONES: { id: string; bit: number; label: string }[] = [
  { id: 'chest', bit: 1, label: 'Chest' },
  { id: 'left', bit: 2, label: 'Left' },
  { id: 'right', bit: 4, label: 'Right' },
  { id: 'head', bit: 8, label: 'Head' },
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
  const partsRef = useRef(parts)
  const assemblyRef = useRef(assembly)
  const mutedRef = useRef(muted)
  const onChangeRef = useRef(onChange)
  partsRef.current = parts
  assemblyRef.current = assembly
  mutedRef.current = muted
  onChangeRef.current = onChange
  const bolts = useRef([assembly.wheelBolts > 0, assembly.wheelBolts > 1])

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
    if (!assembly.osUid || assembly.osInstalled) return
    const timer = window.setTimeout(() => {
      const current = assemblyRef.current
      if (!current.osUid || current.osInstalled) return
      commit({ ...current, osInstalled: true }, 'boot')
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [assembly.osUid, assembly.osInstalled])

  const { begin } = usePointerDrag({
    onMove(drag, target) {
      if (drag.kind !== 'skin' || target?.dataset.drop !== 'zone' || !target.dataset.zone) return
      const zone = ZONES.find((item) => item.id === target.dataset.zone)
      if (!zone) return
      const current = assemblyRef.current
      const base = current.materialUid === drag.uid ? current.covered : 0
      const covered = base | zone.bit
      if (current.materialUid === drag.uid && current.covered === covered) return
      const plates = [1, 2, 4, 8].filter((bit) => covered & bit).length
      commit({ ...current, materialUid: drag.uid, covered, plates })
    },
    onDrop(drag, target, moved) {
      if (moved < 12 || !target) return
      const drop = target.dataset.drop
      const current = assemblyRef.current
      if (drag.kind === 'processor' && drop === 'processor') {
        const count = catalog(partsRef.current.find((item) => item.uid === drag.uid)?.id ?? 'scrap-chip').slots
        const weaponUids = current.weaponUids.slice(0, count)
        commit({
          ...current,
          processorUid: drag.uid,
          paste: 0,
          cooled: false,
          weaponUids,
          wiredUids: current.wiredUids.filter((uid) => weaponUids.includes(uid)),
          weaponsPlaced: false,
        })
      }
      if (drag.kind === 'cooler' && drop === 'cooler') commit({ ...current, cooled: true })
      if (drag.kind === 'wheels' && drop === 'axle') {
        bolts.current = [false, false]
        commit({ ...current, wheelUid: drag.uid, wheelBolts: 0, wheelsMounted: false })
      }
      if (drag.kind === 'weapon' && drop === 'hardpoint') {
        const open = processorSlots(partsRef.current, current)
        if (current.weaponUids.includes(drag.uid) || current.weaponUids.length >= open) return
        const weaponUids = [...current.weaponUids, drag.uid]
        const owned = partsRef.current.filter((item) => catalog(item.id).kind === 'weapon').length
        const placed = weaponUids.length >= Math.min(open, owned) && weaponUids.length > 0
        commit({ ...current, weaponUids, wiredUids: weaponUids, weaponsPlaced: placed })
      }
      if (drag.kind === 'gpu' && drop === 'gpu') commit({ ...current, gpuUid: drag.uid, gpuSkipped: false, gpuWired: false })
      if (drag.kind === 'cover' && drop === 'gpu') commit({ ...current, gpuUid: null, gpuSkipped: true, gpuWired: false })
      if (drag.kind === 'wire' && drop === 'gpu-port') commit({ ...current, gpuWired: true }, 'wire')
      if (drag.kind === 'os' && drop === 'os') commit({ ...current, osUid: drag.uid, osInstalled: false })
      if (drag.kind === 'strip' && drop === 'strip') commit(emptyAssembly())
    },
  })

  const owned = (kind: string) => parts.filter((item) => catalog(item.id).kind === kind)
  const phase = !assembly.processorUid ? 'seat' : assembly.paste < 100 ? 'paste' : assembly.cooled ? 'done' : 'cool'
  const looseWeapons = owned('weapon').filter((item) => !assembly.weaponUids.includes(item.uid))
  const nextPoint = hardpoint(assembly.weaponUids.length, Math.max(slots, 1))

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
          {step === 'processor' && phase === 'seat' && (
            <div className="socket" data-testid="processor-socket" data-drop="processor">Drop processor</div>
          )}
          {step === 'processor' && phase === 'paste' && (
            <SmearPad testId="paste-pad" label="Smear paste" tone="paste" onDone={() => commit({ ...assemblyRef.current, paste: 100 })} />
          )}
          {step === 'processor' && phase === 'cool' && (
            <div className="socket" data-testid="cooler-socket" data-drop="cooler">Drop cooler</div>
          )}
          {step === 'wheels' && !assembly.wheelUid && <div className="axle" data-testid="axle" data-drop="axle">Drop wheels</div>}
          {step === 'wheels' && assembly.wheelUid && !assembly.wheelsMounted && (
            <>
              <SpinBolt testId="bolt-0" className="at-left" onDone={() => finishBolt(0)} />
              <SpinBolt testId="bolt-1" className="at-right" onDone={() => finishBolt(1)} />
            </>
          )}
          {step === 'weapons' && assembly.weaponUids.length < slots && (
            <div
              className="port"
              data-testid="hardpoint"
              data-drop="hardpoint"
              style={{ left: `${(nextPoint.x / 210) * 100}%`, top: `${(nextPoint.y / 220) * 100}%` }}
            >
              Drop weapon
            </div>
          )}
          {step === 'gpu' && !assembly.gpuUid && !assembly.gpuSkipped && (
            <div className="gpu-bay" data-testid="gpu-slot" data-drop="gpu">GPU bay</div>
          )}
          {step === 'gpu' && assembly.gpuUid && !assembly.gpuWired && (
            <>
              <div className="wire-source" data-testid="wire-source" onPointerDown={(event) => begin(event, { kind: 'wire', name: 'Wire' })}>
                Wire
              </div>
              <div className="port gpu-port" data-testid="gpu-port" data-drop="gpu-port">GPU</div>
            </>
          )}
          {step === 'os' && !assembly.osUid && <div className="os-slot" data-testid="os-slot" data-drop="os">OS slot</div>}
          {step === 'ready' && (
            <div className="strip-handle" data-testid="strip-handle" aria-label="Drag the core to the strip bin" onPointerDown={(event) => begin(event, { kind: 'strip', name: 'Core' })} />
          )}
          {step === 'shell' &&
            ZONES.map((zone) => (
              <div key={zone.id} className={`zone zone-${zone.id} ${assembly.covered & zone.bit ? 'done' : ''}`} data-testid={`zone-${zone.id}`} data-drop="zone" data-zone={zone.id}>
                {assembly.covered & zone.bit ? 'Covered' : zone.label}
              </div>
            ))}
        </div>
        {assembly.osUid && !assembly.osInstalled && (
          <div className="boot-bar stage-boot" data-testid="boot-bar">
            <i />
            <span>Booting</span>
          </div>
        )}
        {step === 'ready' && <p className="ready-banner">Rivet is online.</p>}
      </div>

      <div className="step-panel">
        {step === 'processor' && phase === 'seat' && (
          <StepCopy title="Drag the processor" body="Drop it in the socket on Rivet’s chest.">
            {owned('processor').length === 0 && <p className="fine">Buy a processor in the part shop.</p>}
            {owned('processor').map((item) => (
              <div key={item.uid} className="chip" data-testid={`drag-${item.id}`} onPointerDown={(event) => begin(event, { kind: 'processor', uid: item.uid, name: catalog(item.id).name })}>
                <strong>{catalog(item.id).name}</strong>
                <span>Drag onto the chest</span>
              </div>
            ))}
          </StepCopy>
        )}
        {step === 'processor' && phase === 'paste' && (
          <StepCopy title="Spread thermal paste" body="Hold on the chip and smear paste across it until the socket is covered.">
            <p className="fine">Keep the pointer down and drag over the whole chip.</p>
          </StepCopy>
        )}
        {step === 'processor' && phase === 'cool' && (
          <StepCopy title="Seat the cooler" body="Drag the cooler onto the pasted processor.">
            <div className="chip" data-testid="drag-cooler" onPointerDown={(event) => begin(event, { kind: 'cooler', name: 'Cooler' })}>
              <strong>Cooler</strong>
              <span>Drag it onto the chip</span>
            </div>
          </StepCopy>
        )}
        {step === 'wheels' && !assembly.wheelUid && (
          <StepCopy title="Bring the wheels" body="Drag a set of wheels onto the axle, then spin the bolts.">
            {owned('wheels').map((item) => (
              <div key={item.uid} className="chip" data-testid={`drag-${item.id}`} onPointerDown={(event) => begin(event, { kind: 'wheels', uid: item.uid, name: catalog(item.id).name })}>
                <strong>{catalog(item.id).name}</strong>
                <span>Drag onto the axle</span>
              </div>
            ))}
          </StepCopy>
        )}
        {step === 'wheels' && assembly.wheelUid && !assembly.wheelsMounted && (
          <StepCopy title="Spin the bolts" body="Grab each bolt and turn it in a full circle until it tightens.">
            <p className="fine">Two bolts, one on each wheel.</p>
          </StepCopy>
        )}
        {step === 'weapons' && (
          <StepCopy title="Drag the weapons on" body={`This processor has ${slots} ports. Drag a weapon onto the open hardpoint. Every weapon you own, up to that limit, has to go on.`}>
            {looseWeapons.length === 0 && <p className="fine">Buy a weapon in the part shop.</p>}
            {looseWeapons.map((item) => (
              <div key={item.uid} className="chip" data-testid={`drag-${item.id}`} onPointerDown={(event) => begin(event, { kind: 'weapon', uid: item.uid, name: catalog(item.id).name })}>
                <strong>{catalog(item.id).name}</strong>
                <span>Drag onto the hardpoint</span>
              </div>
            ))}
          </StepCopy>
        )}
        {step === 'gpu' && !assembly.gpuUid && !assembly.gpuSkipped && (
          <StepCopy title="Seat the GPU" body={owned('gpu').length ? 'Drag the card into the bay on Rivet’s side.' : 'No GPU in the bin. Drag the bay cover over the empty slot, or buy a card in the part shop.'}>
            {owned('gpu').map((item) => (
              <div key={item.uid} className="chip" data-testid={`drag-${item.id}`} onPointerDown={(event) => begin(event, { kind: 'gpu', uid: item.uid, name: catalog(item.id).name })}>
                <strong>{catalog(item.id).name}</strong>
                <span>Drag into the bay</span>
              </div>
            ))}
            {owned('gpu').length === 0 && (
              <div className="chip" data-testid="drag-bay-cover" onPointerDown={(event) => begin(event, { kind: 'cover', name: 'Bay cover' })}>
                <strong>Bay cover</strong>
                <span>Drag over the empty slot</span>
              </div>
            )}
          </StepCopy>
        )}
        {step === 'gpu' && assembly.gpuUid && !assembly.gpuWired && (
          <StepCopy title="Wire the GPU" body="Grab the wire on the processor and drag it onto the card.">
            <p className="fine">The wire has to land on the GPU.</p>
          </StepCopy>
        )}
        {step === 'os' && !assembly.osUid && (
          <StepCopy title="Slide in the OS" body="Drag the cartridge into the head. It boots itself.">
            {owned('os').map((item) => (
              <div key={item.uid} className="chip" data-testid={`drag-${item.id}`} onPointerDown={(event) => begin(event, { kind: 'os', uid: item.uid, name: catalog(item.id).name })}>
                <strong>{catalog(item.id).name}</strong>
                <span>Drag into the head</span>
              </div>
            ))}
          </StepCopy>
        )}
        {step === 'os' && assembly.osUid && !assembly.osInstalled && (
          <StepCopy title="Booting" body="The system is loading. Give it a couple of seconds.">
            <p className="fine">Power, memory, then the eye.</p>
          </StepCopy>
        )}
        {step === 'shell' && (
          <StepCopy title="Drag the frame on" body="Pick up a shell and drag it across the chest, both shoulders, and the head.">
            {owned('material').map((item) => (
              <div key={item.uid} className="chip" data-testid={`drag-${item.id}`} onPointerDown={(event) => begin(event, { kind: 'skin', uid: item.uid, name: catalog(item.id).name })}>
                <strong>{catalog(item.id).name}</strong>
                <span>Drag across the whole body</span>
              </div>
            ))}
          </StepCopy>
        )}
        {step === 'ready' && (
          <StepCopy title="Ready for the pit" body="Rivet is pasted, bolted, armed, and skinned. Drag the core into the bin if you want to take the build apart.">
            <div className="scrap-bin" data-testid="strip-bin" data-drop="strip">Strip bin</div>
          </StepCopy>
        )}
      </div>
      <div id="drag-ghost" className="drag-ghost" hidden />
      <svg id="wire-live" className="wire-live" style={{ display: 'none' }} aria-hidden="true">
        <line x1="0" y1="0" x2="0" y2="0" />
      </svg>
    </section>
  )

  function finishBolt(index: number) {
    bolts.current[index] = true
    if (bolts.current.every(Boolean)) commit({ ...assemblyRef.current, wheelBolts: 2, wheelsMounted: true })
  }
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
