// Scrap Ring rules: one robot, linear fights, money from wins, upgrades between levels.

export type UpgradeId = 'hull' | 'fist' | 'plate' | 'servo'

export type Upgrades = Record<UpgradeId, number>

export type Stats = {
  hp: number
  attack: number
  armor: number
  speed: number
}

export type Fighter = Stats & { name: string }

export type RobotKind = 'player' | 'rat' | 'bruiser' | 'warden' | 'reaper' | 'knight' | 'prime'

export type LevelDef = {
  name: string
  title: string
  kind: Exclude<RobotKind, 'player'>
  paint: string
  hp: number
  attack: number
  armor: number
  speed: number
  reward: number
}

export type UpgradeDef = {
  id: UpgradeId
  name: string
  detail: string
  base: number
  step: number
  max: number
  hp: number
  attack: number
  armor: number
  speed: number
}

export type Action = {
  id: number
  attacker: 'player' | 'enemy'
  kind: 'hit' | 'dodge'
  damage: number
  playerHp: number
  enemyHp: number
  line: string
}

export type FightResult = {
  actions: Action[]
  winner: 'player' | 'enemy'
  playerHp: number
  enemyHp: number
}

export type Outlook = 'favored' | 'even' | 'underdog'

export type Save = {
  v: 2
  money: number
  nextLevel: number
  upgrades: Upgrades
  hp: number
}

export const SAVE_KEY = 'scrap-ring-save-v1'
export const REMATCH_REWARD = 240

export const PLAYER_BASE: Stats = { hp: 42, attack: 10, armor: 1, speed: 5 }

export const UPGRADE_LIST: UpgradeDef[] = [
  {
    id: 'hull',
    name: 'Hull Plates',
    detail: '+12 health',
    base: 22,
    step: 14,
    max: 6,
    hp: 12,
    attack: 0,
    armor: 0,
    speed: 0,
  },
  {
    id: 'fist',
    name: 'Power Punch',
    detail: '+3 attack',
    base: 26,
    step: 16,
    max: 5,
    hp: 0,
    attack: 3,
    armor: 0,
    speed: 0,
  },
  {
    id: 'plate',
    name: 'Extra Armor',
    detail: '+2 armor',
    base: 30,
    step: 18,
    max: 4,
    hp: 0,
    attack: 0,
    armor: 2,
    speed: 0,
  },
  {
    id: 'servo',
    name: 'Faster Legs',
    detail: '+2 speed',
    base: 18,
    step: 14,
    max: 5,
    hp: 0,
    attack: 0,
    armor: 0,
    speed: 2,
  },
]

export const LEVELS: LevelDef[] = [
  { name: 'Tin Rat', title: 'Steals bolts', kind: 'rat', paint: 'rat', hp: 22, attack: 6, armor: 0, speed: 3, reward: 40 },
  { name: 'Bolt Bruiser', title: 'Hits hard', kind: 'bruiser', paint: 'bruiser', hp: 36, attack: 12, armor: 2, speed: 4, reward: 58 },
  { name: 'Weld Warden', title: 'Shop enforcer', kind: 'warden', paint: 'warden', hp: 50, attack: 14, armor: 3, speed: 5, reward: 78 },
  { name: 'Coil Reaper', title: 'Very fast', kind: 'reaper', paint: 'reaper', hp: 48, attack: 15, armor: 2, speed: 8, reward: 100 },
  { name: 'Furnace Knight', title: 'Heavy armor', kind: 'knight', paint: 'knight', hp: 70, attack: 17, armor: 5, speed: 5, reward: 130 },
  { name: 'Apex Prime', title: 'Owns the ring', kind: 'prime', paint: 'prime', hp: 84, attack: 20, armor: 5, speed: 7, reward: 180 },
  { name: 'Rust Bishop', title: 'Blesses the bolts', kind: 'warden', paint: 'bishop', hp: 90, attack: 18, armor: 4, speed: 6, reward: 200 },
  { name: 'Gear Ghoul', title: 'Haunts the pit', kind: 'reaper', paint: 'ghoul', hp: 86, attack: 19, armor: 3, speed: 10, reward: 220 },
  { name: 'Piston Hag', title: 'Short fuse', kind: 'bruiser', paint: 'hag', hp: 100, attack: 21, armor: 5, speed: 6, reward: 240 },
  { name: 'Anvil Monk', title: 'Never dodges', kind: 'knight', paint: 'monk', hp: 112, attack: 20, armor: 7, speed: 4, reward: 270 },
  { name: 'Spark Viper', title: 'Mean and quick', kind: 'rat', paint: 'viper', hp: 96, attack: 22, armor: 3, speed: 12, reward: 300 },
  { name: 'Chrome Widow', title: 'Spins the coil', kind: 'reaper', paint: 'widow', hp: 108, attack: 23, armor: 4, speed: 11, reward: 330 },
  { name: 'Slag Golem', title: 'Walks through punches', kind: 'knight', paint: 'golem', hp: 124, attack: 22, armor: 8, speed: 4, reward: 360 },
  { name: 'Neon Jackal', title: 'Too quick', kind: 'rat', paint: 'jackal', hp: 110, attack: 24, armor: 3, speed: 13, reward: 400 },
  { name: 'Iron Hymn', title: 'Pit preacher', kind: 'warden', paint: 'hymn', hp: 120, attack: 23, armor: 6, speed: 8, reward: 440 },
  { name: 'Cinder Maw', title: 'Bites armor', kind: 'bruiser', paint: 'maw', hp: 130, attack: 25, armor: 6, speed: 7, reward: 480 },
  { name: 'Volt Saint', title: 'Glows before it hits', kind: 'prime', paint: 'saint', hp: 128, attack: 26, armor: 5, speed: 10, reward: 530 },
  { name: 'Obsidian Bell', title: 'Rings you out', kind: 'knight', paint: 'bell', hp: 142, attack: 24, armor: 8, speed: 6, reward: 580 },
  { name: 'Scrap Relic', title: 'Last sermon', kind: 'warden', paint: 'relic', hp: 136, attack: 27, armor: 6, speed: 9, reward: 640 },
  { name: 'Crown Furnace', title: 'The real champion', kind: 'prime', paint: 'crown', hp: 150, attack: 28, armor: 7, speed: 10, reward: 720 },
]

export function starterSave(): Save {
  return {
    v: 2,
    money: 0,
    nextLevel: 0,
    upgrades: { hull: 0, fist: 0, plate: 0, servo: 0 },
    hp: PLAYER_BASE.hp,
  }
}

export function playerStats(upgrades: Upgrades): Stats {
  const stats = { ...PLAYER_BASE }
  for (const upgrade of UPGRADE_LIST) {
    const rank = upgrades[upgrade.id]
    stats.hp += upgrade.hp * rank
    stats.attack += upgrade.attack * rank
    stats.armor += upgrade.armor * rank
    stats.speed += upgrade.speed * rank
  }
  return stats
}

export function upgradeCost(id: UpgradeId, rank: number): number {
  const upgrade = UPGRADE_LIST.find((item) => item.id === id)
  if (!upgrade) return 0
  return upgrade.base + rank * upgrade.step
}

export function upgradeMax(id: UpgradeId): number {
  return UPGRADE_LIST.find((item) => item.id === id)?.max ?? 0
}

function withParts(save: Save, upgrades: Upgrades, money: number): Save {
  const before = playerStats(save.upgrades).hp
  const after = playerStats(upgrades).hp
  const gained = Math.max(0, after - before)
  return {
    ...save,
    v: 2,
    money,
    upgrades,
    hp: Math.min(after, save.hp + gained),
  }
}

export function buyUpgrade(save: Save, id: UpgradeId): Save {
  const rank = save.upgrades[id]
  if (rank >= upgradeMax(id)) return save
  const cost = upgradeCost(id, rank)
  if (save.money < cost) return save
  return withParts(save, { ...save.upgrades, [id]: rank + 1 }, save.money - cost)
}

export function sellUpgrade(save: Save, id: UpgradeId): Save {
  const rank = save.upgrades[id]
  if (rank <= 0) return save
  const refund = upgradeCost(id, rank - 1)
  return withParts(save, { ...save.upgrades, [id]: rank - 1 }, save.money + refund)
}

export function missingHp(save: Save): number {
  return Math.max(0, playerStats(save.upgrades).hp - save.hp)
}

export function repairRobot(save: Save): Save {
  const max = playerStats(save.upgrades).hp
  const missing = max - save.hp
  if (missing <= 0) return save
  if (save.money <= 0) {
    if (save.hp <= 0) return { ...save, hp: max }
    return save
  }
  const spent = Math.min(save.money, missing)
  return { ...save, money: save.money - spent, hp: save.hp + spent }
}

export function canDeploy(save: Save): boolean {
  const max = playerStats(save.upgrades).hp
  if (save.hp >= max) return true
  if (save.hp <= 0) return false
  return save.money <= 0
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

export function applyFightResult(save: Save, endingHp: number, reward: number | null): Save {
  const max = playerStats(save.upgrades).hp
  const hp = clamp(endingHp, 0, max)
  if (reward === null) return { ...save, hp }
  const rematch = save.nextLevel >= LEVELS.length
  return {
    ...save,
    hp,
    money: save.money + reward,
    nextLevel: rematch ? save.nextLevel : save.nextLevel + 1,
  }
}

export function expectedHit(attack: number, armor: number): number {
  return Math.max(1, attack - armor)
}

export function dodgeChance(attackerSpeed: number, defenderSpeed: number): number {
  const edge = defenderSpeed - attackerSpeed
  if (edge <= 0) return 0
  return Math.min(0.28, edge * 0.06)
}

export function strikesFirst(playerSpeed: number, enemySpeed: number): 'player' | 'enemy' {
  return playerSpeed >= enemySpeed ? 'player' : 'enemy'
}

function rollDamage(attack: number, armor: number, rng: () => number): number {
  const swing = Math.floor(rng() * 3) - 1
  return Math.max(1, attack - armor + swing)
}

export function resolveFight(player: Fighter, enemy: Fighter, rng: () => number): FightResult {
  let playerHp = player.hp
  let enemyHp = enemy.hp
  const actions: Action[] = []
  let playerTurn = strikesFirst(player.speed, enemy.speed) === 'player'
  let guard = 0

  while (playerHp > 0 && enemyHp > 0 && guard < 200) {
    guard += 1
    const attacker = playerTurn ? player : enemy
    const defender = playerTurn ? enemy : player
    const attackerSide = playerTurn ? 'player' : 'enemy'
    const dodged = rng() < dodgeChance(attacker.speed, defender.speed)

    if (dodged) {
      actions.push({
        id: actions.length + 1,
        attacker: attackerSide,
        kind: 'dodge',
        damage: 0,
        playerHp,
        enemyHp,
        line: `${defender.name} dodges ${attacker.name}.`,
      })
    } else {
      const damage = rollDamage(attacker.attack, defender.armor, rng)
      if (playerTurn) enemyHp = Math.max(0, enemyHp - damage)
      else playerHp = Math.max(0, playerHp - damage)
      const down = (playerTurn ? enemyHp : playerHp) === 0
      actions.push({
        id: actions.length + 1,
        attacker: attackerSide,
        kind: 'hit',
        damage,
        playerHp,
        enemyHp,
        line: down
          ? `${attacker.name} hits ${defender.name} for ${damage}. ${defender.name} is down.`
          : `${attacker.name} hits ${defender.name} for ${damage}.`,
      })
    }

    playerTurn = !playerTurn
  }

  const winner = enemyHp <= 0 && playerHp > 0 ? 'player' : 'enemy'
  return { actions, winner, playerHp, enemyHp }
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

function seedFrom(player: Stats, enemy: Stats): number {
  return (
    player.hp * 3 +
    player.attack * 17 +
    player.armor * 53 +
    player.speed * 97 +
    enemy.hp * 7 +
    enemy.attack * 19 +
    enemy.armor * 41 +
    enemy.speed * 101
  )
}

export function forecast(player: Stats, enemy: Stats): Outlook {
  const seed = seedFrom(player, enemy)
  let wins = 0
  const samples = 80
  for (let i = 0; i < samples; i += 1) {
    const result = resolveFight(
      { ...player, name: 'You' },
      { ...enemy, name: 'Them' },
      mulberry32(seed + i * 997),
    )
    if (result.winner === 'player') wins += 1
  }
  const rate = wins / samples
  if (rate >= 0.7) return 'favored'
  if (rate >= 0.45) return 'even'
  return 'underdog'
}

function clamp(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.floor(value)))
}

export function loadSave(): Save {
  const fresh = starterSave()
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return fresh
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return fresh
    const record = data as Record<string, unknown>
    if (record.v !== 1 && record.v !== 2) return fresh
    const bag = record.upgrades
    if (!bag || typeof bag !== 'object') return fresh
    const upgrades = bag as Record<string, unknown>
    const parts: Upgrades = {
      hull: clamp(upgrades.hull, 0, upgradeMax('hull')),
      fist: clamp(upgrades.fist, 0, upgradeMax('fist')),
      plate: clamp(upgrades.plate, 0, upgradeMax('plate')),
      servo: clamp(upgrades.servo, 0, upgradeMax('servo')),
    }
    const max = playerStats(parts).hp
    const hp = record.v === 2 && typeof record.hp === 'number' ? clamp(record.hp, 0, max) : max
    return {
      v: 2,
      money: clamp(record.money, 0, 999999),
      nextLevel: clamp(record.nextLevel, 0, LEVELS.length),
      upgrades: parts,
      hp,
    }
  } catch {
    return fresh
  }
}
