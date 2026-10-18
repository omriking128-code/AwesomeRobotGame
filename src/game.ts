import {
  applyWear,
  armedWeapons,
  catalog,
  emptyAssembly,
  gpuPower,
  rigStats,
  starterParts,
  type Assembly,
  type Bench,
  type CatalogPart,
  type DamageStyle,
  type OwnedPart,
  type RigStats,
} from './parts'

export type RobotKind = 'player' | 'rat' | 'bruiser' | 'warden' | 'reaper' | 'knight' | 'prime'

export type LevelDef = {
  name: string
  title: string
  kind: Exclude<RobotKind, 'player'>
  paint: string
  hp: number
  power: number
  armor: number
  speed: number
  intellect: number
  reward: number
}

export type Fighter = RigStats & { name: string }

export type Action = {
  id: number
  attacker: 'player' | 'enemy'
  kind: 'hit' | 'dodge'
  damage: number
  playerHp: number
  enemyHp: number
  line: string
  weaponId?: string
  weaponUid?: string
  style?: DamageStyle
}

export type FightResult = {
  actions: Action[]
  winner: 'player' | 'enemy'
  playerHp: number
  enemyHp: number
  hitsTaken: number
  firedUids: string[]
}

export type Outlook = 'favored' | 'even' | 'underdog'

export type Save = Bench & {
  v: 3
  nextLevel: number
}

export type { Assembly, OwnedPart }

export const SAVE_KEY = 'scrap-ring-save-v1'
export const REMATCH_REWARD = 240

export const LEVELS: LevelDef[] = [
  { name: 'Tin Rat', title: 'Steals bolts', kind: 'rat', paint: 'rat', hp: 22, power: 6, armor: 0, speed: 3, intellect: 2, reward: 40 },
  { name: 'Bolt Bruiser', title: 'Hits hard', kind: 'bruiser', paint: 'bruiser', hp: 36, power: 12, armor: 2, speed: 4, intellect: 3, reward: 58 },
  { name: 'Weld Warden', title: 'Shop enforcer', kind: 'warden', paint: 'warden', hp: 50, power: 14, armor: 3, speed: 5, intellect: 4, reward: 78 },
  { name: 'Coil Reaper', title: 'Very fast', kind: 'reaper', paint: 'reaper', hp: 48, power: 15, armor: 2, speed: 8, intellect: 6, reward: 100 },
  { name: 'Furnace Knight', title: 'Heavy armor', kind: 'knight', paint: 'knight', hp: 70, power: 17, armor: 5, speed: 5, intellect: 5, reward: 130 },
  { name: 'Apex Prime', title: 'Owns the ring', kind: 'prime', paint: 'prime', hp: 84, power: 20, armor: 5, speed: 7, intellect: 7, reward: 180 },
  { name: 'Rust Bishop', title: 'Blesses the bolts', kind: 'warden', paint: 'bishop', hp: 90, power: 18, armor: 4, speed: 6, intellect: 7, reward: 200 },
  { name: 'Gear Ghoul', title: 'Haunts the pit', kind: 'reaper', paint: 'ghoul', hp: 86, power: 19, armor: 3, speed: 10, intellect: 8, reward: 220 },
  { name: 'Piston Hag', title: 'Short fuse', kind: 'bruiser', paint: 'hag', hp: 100, power: 21, armor: 5, speed: 6, intellect: 7, reward: 240 },
  { name: 'Anvil Monk', title: 'Never dodges', kind: 'knight', paint: 'monk', hp: 112, power: 20, armor: 7, speed: 4, intellect: 6, reward: 270 },
  { name: 'Spark Viper', title: 'Mean and quick', kind: 'rat', paint: 'viper', hp: 96, power: 22, armor: 3, speed: 12, intellect: 9, reward: 300 },
  { name: 'Chrome Widow', title: 'Spins the coil', kind: 'reaper', paint: 'widow', hp: 108, power: 23, armor: 4, speed: 11, intellect: 9, reward: 330 },
  { name: 'Slag Golem', title: 'Walks through punches', kind: 'knight', paint: 'golem', hp: 124, power: 22, armor: 8, speed: 4, intellect: 7, reward: 360 },
  { name: 'Neon Jackal', title: 'Too quick', kind: 'rat', paint: 'jackal', hp: 110, power: 24, armor: 3, speed: 13, intellect: 10, reward: 400 },
  { name: 'Iron Hymn', title: 'Pit preacher', kind: 'warden', paint: 'hymn', hp: 120, power: 23, armor: 6, speed: 8, intellect: 10, reward: 440 },
  { name: 'Cinder Maw', title: 'Bites armor', kind: 'bruiser', paint: 'maw', hp: 130, power: 25, armor: 6, speed: 7, intellect: 9, reward: 480 },
  { name: 'Volt Saint', title: 'Glows before it hits', kind: 'prime', paint: 'saint', hp: 128, power: 26, armor: 5, speed: 10, intellect: 11, reward: 530 },
  { name: 'Obsidian Bell', title: 'Rings you out', kind: 'knight', paint: 'bell', hp: 142, power: 24, armor: 8, speed: 6, intellect: 10, reward: 580 },
  { name: 'Scrap Relic', title: 'Last sermon', kind: 'warden', paint: 'relic', hp: 136, power: 27, armor: 6, speed: 9, intellect: 12, reward: 640 },
  { name: 'Crown Furnace', title: 'The real champion', kind: 'prime', paint: 'crown', hp: 150, power: 28, armor: 7, speed: 10, intellect: 13, reward: 720 },
]

export function starterSave(): Save {
  return {
    v: 3,
    money: 0,
    nextLevel: 0,
    parts: starterParts(),
    assembly: emptyAssembly(),
  }
}

export function playerStats(save: Save): RigStats {
  return rigStats(save.parts, save.assembly)
}

export function currentOpponent(nextLevel: number): {
  level: LevelDef
  index: number
  number: number
  rematch: boolean
} {
  if (nextLevel >= LEVELS.length) {
    const last = LEVELS[LEVELS.length - 1]
    return {
      level: { ...last, reward: REMATCH_REWARD, title: 'Title rematch' },
      index: LEVELS.length - 1,
      number: LEVELS.length,
      rematch: true,
    }
  }
  return {
    level: LEVELS[nextLevel],
    index: nextLevel,
    number: nextLevel + 1,
    rematch: false,
  }
}

export function applyFightEnd(
  save: Save,
  outcome: { win: boolean; reward: number; hitsTaken: number; firedUids: string[] },
): Save {
  const worn = applyWear(save, outcome.hitsTaken, outcome.firedUids)
  if (!outcome.win) return worn
  const rematch = worn.nextLevel >= LEVELS.length
  return {
    ...worn,
    money: worn.money + outcome.reward,
    nextLevel: rematch ? worn.nextLevel : worn.nextLevel + 1,
  }
}

export function expectedHit(power: number, armor: number): number {
  return Math.max(1, power - armor)
}

function clampChance(value: number): number {
  return Math.min(0.96, Math.max(0.38, value))
}

function hitChance(
  attacker: RigStats,
  defender: RigStats,
  style: DamageStyle | null,
  defenderSpeed: number,
): number {
  let chance = 0.74 + (attacker.intellect - defender.intellect) * 0.04 + (attacker.speed - defenderSpeed) * 0.015
  if (style === 'blast' || style === 'hammer') chance -= 0.12
  if (style === 'beam') chance += 0.1
  if (style === 'rapid') chance += 0.05
  if (style === 'yank') chance += 0.14
  return clampChance(chance)
}

function roll(power: number, armor: number, rng: () => number): number {
  const swing = Math.floor(rng() * 3) - 1
  return Math.max(1, power - armor + swing)
}

function chooseWeapon(
  weapons: { uid: string; part: CatalogPart }[],
  attacker: RigStats,
  enemy: { hp: number; armor: number; speed: number },
  rng: () => number,
): { uid: string; part: CatalogPart } {
  const scored = weapons.map((weapon) => {
    let score = weapon.part.power
    const style = weapon.part.style
    if ((style === 'pierce' || style === 'shred') && enemy.armor >= 3) score += 6
    if ((style === 'hammer' || style === 'blast') && enemy.hp >= 50) score += 4
    if (style === 'rapid' && enemy.speed >= 8) score += 4
    if (style === 'shock' && enemy.speed >= attacker.speed) score += 3
    if (style === 'yank' && enemy.speed > attacker.speed) score += 5
    if (style === 'beam') score += attacker.intellect * 0.35
    if (style === 'burn') score += 2
    return { weapon, score }
  })
  scored.sort((a, b) => b.score - a.score)
  const bestChance = Math.min(0.92, 0.22 + attacker.intellect * 0.05)
  if (rng() < bestChance) return scored[0].weapon
  return weapons[Math.floor(rng() * weapons.length)]
}

function weaponDamage(part: CatalogPart, armor: number, bonus: number, rng: () => number): { damage: number; notes: string[] } {
  const style = part.style
  const power = part.power + bonus
  const notes: string[] = []
  if (style === 'rapid') {
    const hits = Math.max(2, part.hits)
    const share = Math.max(1, Math.round(power * (hits === 2 ? 0.62 : 0.48)))
    const rolls: number[] = []
    for (let i = 0; i < hits; i += 1) rolls.push(roll(share, armor, rng))
    return { damage: rolls.reduce((sum, hit) => sum + hit, 0), notes: [`${rolls.join(' + ')}`] }
  }
  if (style === 'pierce') return { damage: roll(power, Math.floor(armor * 0.45), rng), notes }
  if (style === 'hammer') return { damage: roll(power + 4, armor, rng), notes }
  if (style === 'blast') return { damage: roll(power + 2, armor, rng), notes }
  if (style === 'burn') {
    const hit = roll(power, armor, rng)
    return { damage: hit + 2, notes: [`the flame bites for 2`] }
  }
  return { damage: roll(power, armor, rng), notes }
}

export function resolveFight(
  player: Fighter,
  enemy: Fighter,
  weapons: { uid: string; part: CatalogPart }[],
  powerBonus: number,
  rng: () => number,
): FightResult {
  let playerHp = player.hp
  let enemyHp = enemy.hp
  let enemyArmor = enemy.armor
  let enemySpeed = enemy.speed
  const actions: Action[] = []
  const firedUids: string[] = []
  let hitsTaken = 0
  let playerTurn = player.speed >= enemy.speed
  let guard = 0

  while (playerHp > 0 && enemyHp > 0 && guard < 240) {
    guard += 1
    if (playerTurn) {
      const weapon = weapons.length ? chooseWeapon(weapons, player, { hp: enemyHp, armor: enemyArmor, speed: enemySpeed }, rng) : null
      const style = weapon?.part.style ?? 'impact'
      const name = weapon?.part.name ?? 'frame'
      const chance = hitChance(player, { ...enemy, speed: enemySpeed, armor: enemyArmor }, style, enemySpeed)
      if (rng() >= chance) {
        actions.push({
          id: actions.length + 1,
          attacker: 'player',
          kind: 'dodge',
          damage: 0,
          playerHp,
          enemyHp,
          weaponId: weapon?.part.id,
          weaponUid: weapon?.uid,
          style: style ?? undefined,
          line: `${enemy.name} dodges ${name}.`,
        })
      } else if (weapon) {
        const strike = weaponDamage(weapon.part, enemyArmor, powerBonus, rng)
        enemyHp = Math.max(0, enemyHp - strike.damage)
        if (weapon.part.style === 'shred') enemyArmor = Math.max(0, enemyArmor - 2)
        if (weapon.part.style === 'shock') enemySpeed = Math.max(0, enemySpeed - 2)
        firedUids.push(weapon.uid)
        const extra = strike.notes.length ? ` (${strike.notes.join(', ')})` : ''
        const down = enemyHp === 0 ? ` ${enemy.name} is down.` : ''
        actions.push({
          id: actions.length + 1,
          attacker: 'player',
          kind: 'hit',
          damage: strike.damage,
          playerHp,
          enemyHp,
          weaponId: weapon.part.id,
          weaponUid: weapon.uid,
          style: weapon.part.style ?? undefined,
          line: `${name} hits ${enemy.name} for ${strike.damage}${extra}.${down}`,
        })
      }
    } else {
      const chance = hitChance(enemy, player, 'impact', player.speed)
      if (rng() >= chance) {
        actions.push({
          id: actions.length + 1,
          attacker: 'enemy',
          kind: 'dodge',
          damage: 0,
          playerHp,
          enemyHp,
          line: `${player.name} dodges ${enemy.name}.`,
        })
      } else {
        const damage = roll(enemy.power, player.armor, rng)
        playerHp = Math.max(0, playerHp - damage)
        hitsTaken += 1
        const down = playerHp === 0 ? ` ${player.name} is down.` : ''
        actions.push({
          id: actions.length + 1,
          attacker: 'enemy',
          kind: 'hit',
          damage,
          playerHp,
          enemyHp,
          line: `${enemy.name} hits ${player.name} for ${damage}.${down}`,
        })
      }
    }
    playerTurn = !playerTurn
  }

  const winner = enemyHp <= 0 && playerHp > 0 ? 'player' : 'enemy'
  return { actions, winner, playerHp, enemyHp, hitsTaken, firedUids }
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function forecast(
  player: Fighter,
  enemy: Fighter,
  weapons: { uid: string; part: CatalogPart }[],
  powerBonus: number,
): Outlook {
  const seed =
    player.hp * 3 +
    player.power * 17 +
    player.armor * 53 +
    player.speed * 97 +
    player.intellect * 13 +
    enemy.hp * 7 +
    enemy.power * 19 +
    enemy.armor * 41 +
    enemy.speed * 101 +
    weapons.reduce((sum, weapon) => sum + weapon.part.power, 0)
  let wins = 0
  const samples = 40
  for (let i = 0; i < samples; i += 1) {
    const result = resolveFight(player, enemy, weapons, powerBonus, mulberry32(seed + i * 997))
    if (result.winner === 'player') wins += 1
  }
  const rate = wins / samples
  if (rate >= 0.7) return 'favored'
  if (rate >= 0.45) return 'even'
  return 'underdog'
}

export function loadoutWeapons(save: Save): { uid: string; part: CatalogPart }[] {
  return armedWeapons(save.parts, save.assembly)
}

export function strikeBonus(save: Save): number {
  return gpuPower(save.parts, save.assembly)
}

function clamp(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.floor(value)))
}

function readParts(value: unknown): OwnedPart[] | null {
  if (!Array.isArray(value)) return null
  const parts: OwnedPart[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const record = item as Record<string, unknown>
    if (typeof record.uid !== 'string' || typeof record.id !== 'string') return null
    try {
      catalog(record.id)
    } catch {
      return null
    }
    parts.push({ uid: record.uid, id: record.id, durability: clamp(record.durability, 0, 100) })
  }
  return parts
}

function readAssembly(value: unknown, parts: OwnedPart[]): Assembly | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const known = new Set(parts.map((item) => item.uid))
  const uid = (key: string): string | null => {
    const raw = record[key]
    return typeof raw === 'string' && known.has(raw) ? raw : null
  }
  const list = (key: string): string[] => {
    const raw = record[key]
    if (!Array.isArray(raw)) return []
    return raw.filter((item): item is string => typeof item === 'string' && known.has(item))
  }
  const weaponUids = list('weaponUids')
  const processorUid = uid('processorUid')
  const gpuUid = uid('gpuUid')
  const wheelsMounted = record.wheelsMounted === true
  const weaponsPlaced = record.weaponsPlaced === true && weaponUids.length > 0
  const plates = clamp(record.plates, 0, 4)
  const fresh = typeof record.paste === 'number' || typeof record.cooled === 'boolean' || typeof record.wheelBolts === 'number' || typeof record.gpuWired === 'boolean' || typeof record.covered === 'number'
  const covered = fresh ? clamp(record.covered, 0, 15) : plates >= 4 ? 15 : 0
  const plateCount = [1, 2, 4, 8].filter((bit) => covered & bit).length
  return {
    processorUid,
    paste: fresh ? clamp(record.paste, 0, 100) : processorUid ? 100 : 0,
    cooled: fresh ? record.cooled === true : Boolean(processorUid),
    wheelUid: uid('wheelUid'),
    wheelBolts: fresh ? clamp(record.wheelBolts, 0, 2) : wheelsMounted ? 2 : 0,
    materialUid: uid('materialUid'),
    osUid: uid('osUid'),
    gpuUid,
    gpuSkipped: record.gpuSkipped === true,
    gpuWired: fresh ? record.gpuWired === true : Boolean(gpuUid),
    weaponUids,
    wiredUids: (weaponsPlaced ? weaponUids : list('wiredUids')).filter((item) => weaponUids.includes(item)),
    weaponsPlaced,
    wheelsMounted,
    osInstalled: record.osInstalled === true,
    plates: fresh ? plateCount : plates,
    covered,
  }
}

export function loadSave(): Save {
  const fresh = starterSave()
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return fresh
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return fresh
    const record = data as Record<string, unknown>
    const money = clamp(record.money, 0, 999999)
    if (record.v !== 3) return { ...fresh, money }
    const parts = readParts(record.parts)
    if (!parts) return { ...fresh, money }
    const assembly = readAssembly(record.assembly, parts)
    if (!assembly) return { ...fresh, money }
    return {
      v: 3,
      money,
      nextLevel: clamp(record.nextLevel, 0, LEVELS.length),
      parts,
      assembly,
    }
  } catch {
    return fresh
  }
}
