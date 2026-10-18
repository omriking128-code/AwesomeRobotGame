export type PartKind = 'processor' | 'weapon' | 'wheels' | 'material' | 'os' | 'gpu'

export type DamageStyle =
  | 'impact'
  | 'rapid'
  | 'beam'
  | 'blast'
  | 'pierce'
  | 'burn'
  | 'shock'
  | 'shred'
  | 'yank'
  | 'hammer'

export type CatalogPart = {
  id: string
  kind: PartKind
  name: string
  blurb: string
  price: number
  hp: number
  power: number
  armor: number
  speed: number
  intellect: number
  slots: number
  style: DamageStyle | null
  hits: number
  wheel: number
  shell: string
  visor: number
}

export type OwnedPart = {
  uid: string
  id: string
  durability: number
}

export type Assembly = {
  processorUid: string | null
  wheelUid: string | null
  materialUid: string | null
  osUid: string | null
  gpuUid: string | null
  gpuSkipped: boolean
  weaponUids: string[]
  wiredUids: string[]
  weaponsPlaced: boolean
  wheelsMounted: boolean
  osInstalled: boolean
  plates: number
}

export type RobotLook = {
  shell: string
  plates: number
  wheel: number
  wheelsOn: boolean
  weaponIds: string[]
  gpu: boolean
  core: boolean
  visor: number
}

export type RigStats = {
  hp: number
  power: number
  armor: number
  speed: number
  intellect: number
}

export type Bench = {
  money: number
  parts: OwnedPart[]
  assembly: Assembly
}

type PartSeed = {
  id: string
  kind: PartKind
  name: string
  blurb: string
  price: number
  hp?: number
  power?: number
  armor?: number
  speed?: number
  intellect?: number
  slots?: number
  style?: DamageStyle
  hits?: number
  wheel?: number
  shell?: string
  visor?: number
}

function part(seed: PartSeed): CatalogPart {
  return {
    hp: 0,
    power: 0,
    armor: 0,
    speed: 0,
    intellect: 0,
    slots: 0,
    style: null,
    hits: 1,
    wheel: 0,
    shell: 'frame',
    visor: 0,
    ...seed,
  }
}

export const PART_KINDS: { id: PartKind; label: string; hint: string }[] = [
  { id: 'processor', label: 'Processor', hint: 'Speed, intelligence, and how many weapons it can wire.' },
  { id: 'weapon', label: 'Weapons', hint: 'Each weapon hits in its own way. A processor can only control so many.' },
  { id: 'wheels', label: 'Wheels', hint: 'Better wheels mean more speed.' },
  { id: 'material', label: 'Material', hint: 'The outer shell. Health and armor.' },
  { id: 'os', label: 'OS', hint: 'A better system makes the robot smarter.' },
  { id: 'gpu', label: 'GPU', hint: 'Optional. A small boost to every stat.' },
]

export const PARTS: CatalogPart[] = [
  part({ id: 'scrap-chip', kind: 'processor', name: 'Scrap Chip', blurb: 'Wires 2 weapons. A little speed, a little smarts.', price: 36, speed: 1, intellect: 2, slots: 2 }),
  part({ id: 'coil-core', kind: 'processor', name: 'Coil Core', blurb: 'Wires 4 weapons. Quicker decisions.', price: 110, speed: 2, intellect: 4, slots: 4 }),
  part({ id: 'weld-cortex', kind: 'processor', name: 'Weld Cortex', blurb: 'Wires 6 weapons. Keeps its cool in the pit.', price: 210, speed: 3, intellect: 6, slots: 6 }),
  part({ id: 'furnace-cpu', kind: 'processor', name: 'Furnace CPU', blurb: 'Wires 8 weapons. Hot and sharp.', price: 340, speed: 4, intellect: 8, slots: 8 }),
  part({ id: 'apex-mind', kind: 'processor', name: 'Apex Mind', blurb: 'Wires 10 weapons. Reads the fight.', price: 520, speed: 5, intellect: 10, slots: 10 }),
  part({ id: 'crown-lattice', kind: 'processor', name: 'Crown Lattice', blurb: 'Wires 12 weapons. The fastest mind in the ring.', price: 780, speed: 7, intellect: 13, slots: 12 }),

  part({ id: 'punch', kind: 'weapon', name: 'Rivet Punch', blurb: 'One heavy hit.', price: 24, power: 6, style: 'impact' }),
  part({ id: 'saw', kind: 'weapon', name: 'Buzz Saw', blurb: 'Two quick cuts.', price: 40, power: 5, style: 'rapid', hits: 2 }),
  part({ id: 'welder', kind: 'weapon', name: 'Spot Welder', blurb: 'An accurate arc. Hard to dodge.', price: 55, power: 6, style: 'beam' }),
  part({ id: 'cannon', kind: 'weapon', name: 'Scrap Cannon', blurb: 'A slow shell. Hits harder, misses more.', price: 80, power: 9, style: 'blast' }),
  part({ id: 'drill', kind: 'weapon', name: 'Armor Drill', blurb: 'Ignores about half of their armor.', price: 90, power: 7, style: 'pierce' }),
  part({ id: 'vent', kind: 'weapon', name: 'Flame Vent', blurb: 'The hit keeps burning.', price: 70, power: 5, style: 'burn' }),
  part({ id: 'tesla', kind: 'weapon', name: 'Tesla Fork', blurb: 'A jolt that slows their next move.', price: 85, power: 6, style: 'shock' }),
  part({ id: 'hook', kind: 'weapon', name: 'Magnet Hook', blurb: 'Pulls a dodging bot into the strike.', price: 75, power: 5, style: 'yank' }),
  part({ id: 'slag', kind: 'weapon', name: 'Slag Launcher', blurb: 'Chips armor off for the rest of the fight.', price: 110, power: 7, style: 'shred' }),
  part({ id: 'spike', kind: 'weapon', name: 'Rail Spike', blurb: 'A piercing needle.', price: 160, power: 10, style: 'pierce' }),
  part({ id: 'blades', kind: 'weapon', name: 'Twin Blades', blurb: 'Three fast cuts.', price: 150, power: 8, style: 'rapid', hits: 3 }),
  part({ id: 'hammer', kind: 'weapon', name: 'Crown Hammer', blurb: 'A brutal swing that can miss.', price: 240, power: 12, style: 'hammer' }),

  part({ id: 'casters', kind: 'wheels', name: 'Loose Casters', blurb: 'They roll. Mostly.', price: 22, speed: 2, wheel: 1 }),
  part({ id: 'rollers', kind: 'wheels', name: 'Tin Rollers', blurb: 'Smoother and a bit faster.', price: 60, speed: 3, wheel: 2 }),
  part({ id: 'treads', kind: 'wheels', name: 'Grip Treads', blurb: 'Bite the pit floor.', price: 130, speed: 5, wheel: 3 }),
  part({ id: 'hubs', kind: 'wheels', name: 'Nitro Hubs', blurb: 'A burst of speed.', price: 240, speed: 7, wheel: 4 }),
  part({ id: 'tracks', kind: 'wheels', name: 'Crown Tracks', blurb: 'The fastest feet in the shop.', price: 400, speed: 9, wheel: 5 }),

  part({ id: 'tin', kind: 'material', name: 'Tin Skin', blurb: 'Thin, cheap, better than nothing.', price: 28, hp: 22, armor: 1, shell: 'tin' }),
  part({ id: 'bolt', kind: 'material', name: 'Bolt Plate', blurb: 'Overlapping steel.', price: 80, hp: 34, armor: 2, shell: 'bolt' }),
  part({ id: 'weld', kind: 'material', name: 'Weld Shell', blurb: 'Seams you can trust.', price: 150, hp: 48, armor: 3, shell: 'weld' }),
  part({ id: 'furnace', kind: 'material', name: 'Furnace Plate', blurb: 'Heat-hardened and thick.', price: 260, hp: 64, armor: 5, shell: 'furnace' }),
  part({ id: 'apex', kind: 'material', name: 'Apex Alloy', blurb: 'Light for how hard it is.', price: 420, hp: 82, armor: 7, shell: 'apex' }),
  part({ id: 'crown', kind: 'material', name: 'Crown Ceramic', blurb: 'The shop’s best shell.', price: 640, hp: 100, armor: 9, shell: 'crown' }),

  part({ id: 'bare-os', kind: 'os', name: 'Bare Metal', blurb: 'Boots, and not much else.', price: 18, intellect: 2, visor: 1 }),
  part({ id: 'shop-os', kind: 'os', name: 'Shop Firmware', blurb: 'Knows the usual tricks.', price: 55, intellect: 4, visor: 2 }),
  part({ id: 'kernel-os', kind: 'os', name: 'Pit Kernel', blurb: 'Written for the ring.', price: 120, intellect: 7, visor: 3 }),
  part({ id: 'furnace-os', kind: 'os', name: 'Furnace OS', blurb: 'Thinks a move ahead.', price: 230, intellect: 10, visor: 4 }),
  part({ id: 'crown-os', kind: 'os', name: 'Crown OS', blurb: 'The smartest build in the catalog.', price: 400, intellect: 14, visor: 5 }),

  part({ id: 'junk-gpu', kind: 'gpu', name: 'Junk GPU', blurb: 'A small lift to every stat.', price: 70, hp: 4, power: 1, speed: 1, intellect: 1 }),
  part({ id: 'coil-gpu', kind: 'gpu', name: 'Coil GPU', blurb: 'A clearer boost across the board.', price: 170, hp: 8, power: 2, armor: 1, speed: 1, intellect: 2 }),
  part({ id: 'crown-gpu', kind: 'gpu', name: 'Crown GPU', blurb: 'Optional, and worth it.', price: 320, hp: 12, power: 3, armor: 1, speed: 2, intellect: 3 }),
]

const BASE: RigStats = { hp: 16, power: 2, armor: 0, speed: 2, intellect: 1 }

export function catalog(id: string): CatalogPart {
  const found = PARTS.find((item) => item.id === id)
  if (!found) throw new Error(`Unknown part ${id}`)
  return found
}

export function partsOf(kind: PartKind): CatalogPart[] {
  return PARTS.filter((item) => item.kind === kind)
}

export function emptyAssembly(): Assembly {
  return {
    processorUid: null,
    wheelUid: null,
    materialUid: null,
    osUid: null,
    gpuUid: null,
    gpuSkipped: false,
    weaponUids: [],
    wiredUids: [],
    weaponsPlaced: false,
    wheelsMounted: false,
    osInstalled: false,
    plates: 0,
  }
}

export function starterParts(): OwnedPart[] {
  return [
    { uid: 'start-chip', id: 'scrap-chip', durability: 100 },
    { uid: 'start-punch', id: 'punch', durability: 100 },
    { uid: 'start-casters', id: 'casters', durability: 100 },
    { uid: 'start-tin', id: 'tin', durability: 100 },
    { uid: 'start-os', id: 'bare-os', durability: 100 },
  ]
}

export function partByUid(parts: OwnedPart[], uid: string | null): OwnedPart | null {
  if (!uid) return null
  return parts.find((item) => item.uid === uid) ?? null
}

export function installedUids(assembly: Assembly): string[] {
  return [assembly.processorUid, assembly.wheelUid, assembly.materialUid, assembly.osUid, assembly.gpuUid, ...assembly.weaponUids].filter(
    (uid): uid is string => Boolean(uid),
  )
}

export function isInstalled(assembly: Assembly, uid: string): boolean {
  return installedUids(assembly).includes(uid)
}

export function sellValue(price: number): number {
  return Math.round(price * 0.75)
}

export function repairCost(part: OwnedPart): number {
  if (part.durability <= 0 || part.durability >= 100) return 0
  const missing = (100 - part.durability) / 100
  return Math.max(1, Math.round(catalog(part.id).price * missing * 0.35))
}

export function repairLabel(kind: PartKind): string {
  if (kind === 'processor') return 'Recalibrate'
  if (kind === 'weapon') return 'Hone the edge'
  if (kind === 'wheels') return 'Tighten the bolts'
  if (kind === 'material') return 'Weld the cracks'
  if (kind === 'os') return 'Patch the OS'
  return 'Reseat the card'
}

function live(parts: OwnedPart[], uid: string | null): OwnedPart | null {
  const part = partByUid(parts, uid)
  if (!part || part.durability <= 0) return null
  return part
}

export function armedWeapons(parts: OwnedPart[], assembly: Assembly): { uid: string; part: CatalogPart }[] {
  const armed: { uid: string; part: CatalogPart }[] = []
  for (const uid of assembly.weaponUids) {
    if (!assembly.wiredUids.includes(uid)) continue
    const owned = live(parts, uid)
    if (!owned) continue
    const item = catalog(owned.id)
    if (item.kind === 'weapon' && item.style) armed.push({ uid, part: item })
  }
  return armed
}

export function rigStats(parts: OwnedPart[], assembly: Assembly): RigStats {
  const stats = { ...BASE }
  const processor = live(parts, assembly.processorUid)
  if (processor) {
    const item = catalog(processor.id)
    stats.speed += item.speed
    stats.intellect += item.intellect
  }
  if (assembly.wheelsMounted) {
    const wheels = live(parts, assembly.wheelUid)
    if (wheels) stats.speed += catalog(wheels.id).speed
  }
  if (assembly.osInstalled) {
    const os = live(parts, assembly.osUid)
    if (os) stats.intellect += catalog(os.id).intellect
  }
  if (assembly.plates >= 4) {
    const shell = live(parts, assembly.materialUid)
    if (shell) {
      const item = catalog(shell.id)
      stats.hp += item.hp
      stats.armor += item.armor
    }
  }
  for (const weapon of armedWeapons(parts, assembly)) stats.power += weapon.part.power
  if (!assembly.gpuSkipped) {
    const gpu = live(parts, assembly.gpuUid)
    if (gpu) {
      const item = catalog(gpu.id)
      stats.hp += item.hp
      stats.power += item.power
      stats.armor += item.armor
      stats.speed += item.speed
      stats.intellect += item.intellect
    }
  }
  return stats
}

export function gpuPower(parts: OwnedPart[], assembly: Assembly): number {
  if (assembly.gpuSkipped) return 0
  const gpu = live(parts, assembly.gpuUid)
  return gpu ? catalog(gpu.id).power : 0
}

export function robotLook(parts: OwnedPart[], assembly: Assembly): RobotLook {
  const shell = partByUid(parts, assembly.materialUid)
  const wheels = partByUid(parts, assembly.wheelUid)
  const os = partByUid(parts, assembly.osUid)
  const weapons = assembly.weaponUids
    .map((uid) => partByUid(parts, uid))
    .filter((item): item is OwnedPart => Boolean(item))
    .map((item) => item.id)
  return {
    shell: shell ? catalog(shell.id).shell : 'frame',
    plates: assembly.plates,
    wheel: wheels && assembly.wheelsMounted ? catalog(wheels.id).wheel : 0,
    wheelsOn: assembly.wheelsMounted,
    weaponIds: weapons,
    gpu: Boolean(assembly.gpuUid),
    core: Boolean(assembly.processorUid),
    visor: os && assembly.osInstalled ? catalog(os.id).visor : 0,
  }
}

export function processorSlots(parts: OwnedPart[], assembly: Assembly): number {
  const processor = partByUid(parts, assembly.processorUid)
  return processor ? catalog(processor.id).slots : 0
}

export function buildBlockers(parts: OwnedPart[], assembly: Assembly): string[] {
  const blockers: string[] = []
  const processor = partByUid(parts, assembly.processorUid)
  if (!processor) blockers.push('Seat a processor')
  else if (processor.durability <= 0) blockers.push('The processor is dead')
  const wheels = partByUid(parts, assembly.wheelUid)
  if (!wheels || !assembly.wheelsMounted) blockers.push('Mount the wheels')
  else if (wheels.durability <= 0) blockers.push('The wheels are dead')
  if (!assembly.weaponsPlaced || assembly.weaponUids.length === 0) blockers.push('Place at least one weapon')
  else if (assembly.weaponUids.some((uid) => !assembly.wiredUids.includes(uid))) blockers.push('Wire every weapon')
  else if (armedWeapons(parts, assembly).length === 0) blockers.push('Every weapon is dead')
  if (!assembly.gpuSkipped && !assembly.gpuUid) blockers.push('Install a GPU or leave the slot empty')
  else if (assembly.gpuUid && (partByUid(parts, assembly.gpuUid)?.durability ?? 0) <= 0) blockers.push('The GPU is dead')
  const os = partByUid(parts, assembly.osUid)
  if (!os || !assembly.osInstalled) blockers.push('Install an operating system')
  else if (os.durability <= 0) blockers.push('The OS is corrupted')
  const shell = partByUid(parts, assembly.materialUid)
  if (!shell || assembly.plates < 4) blockers.push('Cover the frame with material')
  else if (shell.durability <= 0) blockers.push('The shell is destroyed')
  if (processor && assembly.weaponUids.length > processorSlots(parts, assembly)) blockers.push('Too many weapons for this processor')
  return blockers
}

export function isBuilt(parts: OwnedPart[], assembly: Assembly): boolean {
  return buildBlockers(parts, assembly).length === 0
}

export function buyPart<T extends Bench>(save: T, catalogId: string): T {
  const item = catalog(catalogId)
  if (save.money < item.price) return save
  const uid = `${catalogId}-${Math.random().toString(36).slice(2, 7)}`
  return {
    ...save,
    money: save.money - item.price,
    parts: [...save.parts, { uid, id: catalogId, durability: 100 }],
  }
}

export function sellPart<T extends Bench>(save: T, uid: string): T {
  if (isInstalled(save.assembly, uid)) return save
  const owned = partByUid(save.parts, uid)
  if (!owned) return save
  return {
    ...save,
    money: save.money + sellValue(catalog(owned.id).price),
    parts: save.parts.filter((item) => item.uid !== uid),
  }
}

export function repairPart<T extends Bench>(save: T, uid: string): T {
  const owned = partByUid(save.parts, uid)
  if (!owned || owned.durability <= 0 || owned.durability >= 100) return save
  const cost = repairCost(owned)
  if (save.money < cost) return save
  return {
    ...save,
    money: save.money - cost,
    parts: save.parts.map((item) => (item.uid === uid ? { ...item, durability: 100 } : item)),
  }
}

export function unequip(assembly: Assembly, uid: string): Assembly {
  const weaponUids = assembly.weaponUids.filter((item) => item !== uid)
  return {
    ...assembly,
    processorUid: assembly.processorUid === uid ? null : assembly.processorUid,
    wheelUid: assembly.wheelUid === uid ? null : assembly.wheelUid,
    wheelsMounted: assembly.wheelUid === uid ? false : assembly.wheelsMounted,
    materialUid: assembly.materialUid === uid ? null : assembly.materialUid,
    plates: assembly.materialUid === uid ? 0 : assembly.plates,
    osUid: assembly.osUid === uid ? null : assembly.osUid,
    osInstalled: assembly.osUid === uid ? false : assembly.osInstalled,
    gpuUid: assembly.gpuUid === uid ? null : assembly.gpuUid,
    gpuSkipped: assembly.gpuUid === uid ? false : assembly.gpuSkipped,
    weaponUids,
    wiredUids: assembly.wiredUids.filter((item) => item !== uid && weaponUids.includes(item)),
    weaponsPlaced: weaponUids.length > 0 && assembly.weaponsPlaced,
  }
}

export function applyWear<T extends Bench>(save: T, hitsTaken: number, firedUids: string[]): T {
  const loss = new Map<string, number>()
  const add = (uid: string | null, amount: number) => {
    if (!uid || amount <= 0) return
    loss.set(uid, (loss.get(uid) ?? 0) + amount)
  }
  add(save.assembly.processorUid, 4)
  add(save.assembly.wheelUid, 6)
  add(save.assembly.osUid, 3)
  if (save.assembly.gpuUid) add(save.assembly.gpuUid, 3)
  add(save.assembly.materialUid, Math.min(18, 5 + hitsTaken * 3))
  for (const uid of firedUids) add(uid, 8)
  return {
    ...save,
    parts: save.parts.map((item) => {
      const amount = loss.get(item.uid) ?? 0
      if (!amount) return item
      return { ...item, durability: Math.max(0, item.durability - amount) }
    }),
  }
}

export type BuildStep = 'processor' | 'wheels' | 'weapons' | 'wire' | 'gpu' | 'os' | 'shell'

export const BUILD_STEPS: { id: BuildStep; label: string }[] = [
  { id: 'processor', label: 'Seat the processor' },
  { id: 'wheels', label: 'Mount the wheels' },
  { id: 'weapons', label: 'Place the weapons' },
  { id: 'wire', label: 'Wire the weapons' },
  { id: 'gpu', label: 'Install the GPU' },
  { id: 'os', label: 'Install the OS' },
  { id: 'shell', label: 'Cover with material' },
]

export function stepDone(assembly: Assembly, step: BuildStep): boolean {
  if (step === 'processor') return Boolean(assembly.processorUid)
  if (step === 'wheels') return Boolean(assembly.wheelUid && assembly.wheelsMounted)
  if (step === 'weapons') return assembly.weaponsPlaced && assembly.weaponUids.length > 0
  if (step === 'wire') return assembly.weaponUids.length > 0 && assembly.weaponUids.every((uid) => assembly.wiredUids.includes(uid))
  if (step === 'gpu') return assembly.gpuSkipped || Boolean(assembly.gpuUid)
  if (step === 'os') return Boolean(assembly.osUid && assembly.osInstalled)
  return Boolean(assembly.materialUid && assembly.plates >= 4)
}

export function currentStep(assembly: Assembly): BuildStep | 'ready' {
  const open = BUILD_STEPS.find((step) => !stepDone(assembly, step.id))
  return open ? open.id : 'ready'
}
