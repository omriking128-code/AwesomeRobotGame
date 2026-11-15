import { useEffect, useMemo, useRef } from 'react'
import type { Assembly, OwnedPart } from '../parts'
import { BUILD_STEPS, catalog, currentStep, emptyAssembly, partByUid, processorSlots, stepDone } from '../parts'
import { playBoot, playSnap, playWire } from '../sound'
import { BenchCanvas } from './BenchCanvas'
import type { BenchSnapshot, HotSocket, Interact, TrayItem } from '../workbench/types'

const ZONES = [
  { bit: 1, label: 'Chest' },
  { bit: 2, label: 'Left' },
  { bit: 4, label: 'Right' },
  { bit: 8, label: 'Head' },
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
  const partsRef = useRef(parts)
  const assemblyRef = useRef(assembly)
  const mutedRef = useRef(muted)
  const onChangeRef = useRef(onChange)
  partsRef.current = parts
  assemblyRef.current = assembly
  mutedRef.current = muted
  onChangeRef.current = onChange
  const bolts = useRef([assembly.wheelBolts > 0, assembly.wheelBolts > 1])
  const bar = useRef<HTMLElement>(null)

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

  const plan = useMemo(() => planBench(parts, assembly), [parts, assembly])
  const copy = describe(parts, assembly)
  const phaseKey = `${step}:${assembly.paste}:${assembly.cooled}:${assembly.wheelUid ?? ''}:${assembly.wheelsMounted}`

  useEffect(() => {
    if (bar.current) bar.current.style.width = '0%'
  }, [phaseKey])

  const snapshot = useMemo<BenchSnapshot>(() => ({
    mode: 'build',
    parts,
    assembly,
    interact: plan.interact,
    tray: plan.tray,
    hot: plan.hot,
    denyUids: [],
    focusId: null,
  }), [parts, assembly, plan])

  return (
    <section className="bench-screen" data-testid="build">
      <BenchCanvas
        snapshot={snapshot}
        handlers={{
          onDrop: (drop) => {
            const current = assemblyRef.current
            const owned = partsRef.current
            if (drop.drag === 'processor' && drop.uid) {
              const count = catalog(owned.find((item) => item.uid === drop.uid)?.id ?? 'scrap-chip').slots
              const weaponUids = current.weaponUids.slice(0, count)
              bolts.current = [false, false]
              commit({
                ...current,
                processorUid: drop.uid,
                paste: 0,
                cooled: false,
                weaponUids,
                wiredUids: current.wiredUids.filter((uid) => weaponUids.includes(uid)),
                weaponsPlaced: false,
              })
            }
            if (drop.drag === 'cooler') commit({ ...current, cooled: true })
            if (drop.drag === 'wheels' && drop.uid) {
              bolts.current = [false, false]
              commit({ ...current, wheelUid: drop.uid, wheelBolts: 0, wheelsMounted: false })
            }
            if (drop.drag === 'weapon' && drop.uid) {
              const open = processorSlots(owned, current)
              if (current.weaponUids.includes(drop.uid) || current.weaponUids.length >= open) return
              const weaponUids = [...current.weaponUids, drop.uid]
              const ownedWeapons = owned.filter((item) => catalog(item.id).kind === 'weapon').length
              const placed = weaponUids.length >= Math.min(open, ownedWeapons) && weaponUids.length > 0
              commit({ ...current, weaponUids, wiredUids: weaponUids, weaponsPlaced: placed })
            }
            if (drop.drag === 'gpu' && drop.uid) commit({ ...current, gpuUid: drop.uid, gpuSkipped: false, gpuWired: false })
            if (drop.drag === 'cover') commit({ ...current, gpuUid: null, gpuSkipped: true, gpuWired: false })
            if (drop.drag === 'cable') commit({ ...current, gpuWired: true }, 'wire')
            if (drop.drag === 'os' && drop.uid) commit({ ...current, osUid: drop.uid, osInstalled: false })
            if (drop.drag === 'plate' && drop.uid && drop.bit) {
              const base = current.materialUid === drop.uid ? current.covered : 0
              const covered = base | drop.bit
              const plates = [1, 2, 4, 8].filter((bit) => covered & bit).length
              commit({ ...current, materialUid: drop.uid, covered, plates })
            }
            if (drop.drag === 'strip') commit(emptyAssembly())
          },
          onSmearDone: () => commit({ ...assemblyRef.current, paste: 100 }),
          onScrewDone: (index) => {
            if (!mutedRef.current) playSnap()
            bolts.current[index] = true
            if (bolts.current.every(Boolean)) commit({ ...assemblyRef.current, wheelBolts: 2, wheelsMounted: true })
          },
          onProgress: (amount) => {
            if (bar.current) bar.current.style.width = `${Math.round(amount * 100)}%`
          },
        }}
      />
      <div className="bench-help">Drag empty bench to turn Rivet. Scroll to zoom.</div>
      <div className="bench-hud">
        <ol className="checklist">
          {BUILD_STEPS.map((item, index) => {
            const state = stepDone(assembly, item.id) ? 'done' : step === item.id ? 'now' : 'wait'
            return <li key={item.id} className={state}><span>{index + 1}</span>{item.label}</li>
          })}
        </ol>
        <div className="bench-copy">
          <h2>{copy.title}</h2>
          <p>{copy.body}</p>
          <div className="bench-meter" aria-hidden="true"><i ref={bar} /></div>
        </div>
      </div>
    </section>
  )
}

function planBench(parts: OwnedPart[], assembly: Assembly): { interact: Interact; tray: TrayItem[]; hot: HotSocket[] } {
  const step = currentStep(assembly)
  const owned = (kind: string) => parts.filter((item) => catalog(item.id).kind === kind)
  const asTray = (items: OwnedPart[], drag: string): TrayItem[] => items.map((item) => ({
    key: item.uid,
    drag,
    uid: item.uid,
    partId: item.id,
    label: catalog(item.id).name,
  }))
  if (step === 'processor' && !assembly.processorUid) {
    return { interact: { type: 'place' }, tray: asTray(owned('processor'), 'processor'), hot: [{ id: 'processor', drag: 'processor' }] }
  }
  if (step === 'processor' && assembly.paste < 100) return { interact: { type: 'paste', tone: 'fresh' }, tray: [], hot: [] }
  if (step === 'processor') {
    return { interact: { type: 'place' }, tray: [{ key: 'cooler', drag: 'cooler', label: 'Cooler' }], hot: [{ id: 'cooler', drag: 'cooler' }] }
  }
  if (step === 'wheels' && !assembly.wheelUid) {
    return { interact: { type: 'place' }, tray: asTray(owned('wheels'), 'wheels'), hot: [{ id: 'axle', drag: 'wheels' }] }
  }
  if (step === 'wheels') return { interact: { type: 'screw' }, tray: [], hot: [] }
  if (step === 'weapons') {
    const loose = owned('weapon').filter((item) => !assembly.weaponUids.includes(item.uid))
    return { interact: { type: 'place' }, tray: asTray(loose, 'weapon'), hot: [{ id: 'weapon', drag: 'weapon' }] }
  }
  if (step === 'gpu' && !assembly.gpuUid && !assembly.gpuSkipped) {
    const cards = owned('gpu')
    if (cards.length === 0) {
      return { interact: { type: 'place' }, tray: [{ key: 'cover', drag: 'cover', label: 'Bay cover' }], hot: [{ id: 'gpu', drag: 'cover' }] }
    }
    return { interact: { type: 'place' }, tray: asTray(cards, 'gpu'), hot: [{ id: 'gpu', drag: 'gpu' }] }
  }
  if (step === 'gpu') return { interact: { type: 'cable' }, tray: [], hot: [{ id: 'gpu-port', drag: 'cable' }] }
  if (step === 'os' && !assembly.osUid) {
    return { interact: { type: 'place' }, tray: asTray(owned('os'), 'os'), hot: [{ id: 'os', drag: 'os' }] }
  }
  if (step === 'os') return { interact: { type: 'boot' }, tray: [], hot: [] }
  if (step === 'shell') {
    const tray: TrayItem[] = []
    for (const item of owned('material')) {
      for (const zone of ZONES) {
        if (assembly.materialUid === item.uid && (assembly.covered & zone.bit)) continue
        tray.push({ key: `${item.uid}-${zone.bit}`, drag: 'plate', uid: item.uid, bit: zone.bit, partId: item.id, label: `${catalog(item.id).name} · ${zone.label}` })
      }
    }
    return {
      interact: { type: 'place' },
      tray,
      hot: ZONES.map((zone) => ({ id: `plate-${zone.bit}`, drag: 'plate', bit: zone.bit })),
    }
  }
  return { interact: { type: 'ready' }, tray: [], hot: [{ id: 'bin', drag: 'strip' }] }
}

function describe(parts: OwnedPart[], assembly: Assembly) {
  const step = currentStep(assembly)
  const has = (kind: string) => parts.some((item) => catalog(item.id).kind === kind)
  if (step === 'processor' && !assembly.processorUid) {
    return { title: 'Seat the processor', body: has('processor') ? 'Pick the chip up off the tray and drop it in the socket on Rivet’s open chest.' : 'Buy a processor in the part shop, then seat it here.' }
  }
  if (step === 'processor' && assembly.paste < 100) return { title: 'Spread thermal paste', body: 'Hold on the metal cap and smear paste across it until the coat is even.' }
  if (step === 'processor') return { title: 'Mount the cooler', body: 'Pick up the fin stack and press it onto the paste.' }
  if (step === 'wheels' && !assembly.wheelUid) return { title: 'Set the wheels', body: 'Drop a wheel set onto the axle between the feet.' }
  if (step === 'wheels') return { title: 'Tighten the lug nuts', body: 'Grab each screw and turn it through a full circle.' }
  if (step === 'weapons') {
    const slots = processorSlots(parts, assembly)
    return { title: 'Mount the weapons', body: has('weapon') ? `This processor has ${slots} ports. Drop every weapon you own onto the glowing hardpoint, up to that limit.` : 'Buy a weapon in the part shop.' }
  }
  if (step === 'gpu' && !assembly.gpuUid && !assembly.gpuSkipped) {
    return { title: 'Fill the side bay', body: has('gpu') ? 'Slide the card into the bay on Rivet’s side.' : 'No GPU in the pile. Drop the bay cover over the empty slot, or buy a card.' }
  }
  if (step === 'gpu') return { title: 'Plug in the power lead', body: 'Grab the cable and seat the plug on the card.' }
  if (step === 'os' && !assembly.osUid) return { title: 'Install the cartridge', body: 'Slide the OS into the slot in the head.' }
  if (step === 'os') return { title: 'Booting', body: 'The board is posting. The eye comes up on its own.' }
  if (step === 'shell') return { title: 'Close the shell', body: 'Snap a plate onto the chest, both sides, and the head. The socket glows where the next plate goes.' }
  const name = partByUid(parts, assembly.processorUid)
  return { title: 'Rivet is online', body: name ? 'Drag the processor off the chest and into the scrap bin if you want to strip the build.' : 'Rivet is ready for the pit.' }
}
