import { hardpoint, type RobotLook } from './parts'
import { blit, cropArt } from './pixel'
import { PART_ART } from './part-art'
import { ANTENNA, BODIES, CROWNLET, PLATE, RIVET, VISORS, WHEELS } from './actor-art'

export const RIG = { x: 41, y: 28, scale: 4 }

type Shell = { light: string; metal: string; dark: string; trim: string; eye: string }

const SHELLS: Record<string, Shell> = {
  frame: { light: '#e7eef4', metal: '#8b97a3', dark: '#3c4650', trim: '#ffb020', eye: '#7dfff2' },
  tin: { light: '#e7eef5', metal: '#8ea6bb', dark: '#3e5163', trim: '#ffb020', eye: '#7dfff2' },
  bolt: { light: '#d5dde6', metal: '#6d7c8c', dark: '#2c3642', trim: '#d7e2ee', eye: '#cfe6ff' },
  weld: { light: '#ffd0b4', metal: '#e07a3d', dark: '#6a3014', trim: '#ffb020', eye: '#ffe08a' },
  furnace: { light: '#ffb199', metal: '#c2412d', dark: '#4a160f', trim: '#ffcf70', eye: '#ffe1a8' },
  apex: { light: '#fff1c9', metal: '#d7c08a', dark: '#5a4824', trim: '#fff6d8', eye: '#fffef8' },
  crown: { light: '#fffaf0', metal: '#f0d78a', dark: '#7a4e12', trim: '#ffe566', eye: '#fffef8' },
}

type Paint = { light: string; metal: string; dark: string; trim: string; eye: string; ink: string }

const PAINTS: Record<string, Paint> = {
  player: { light: '#e7eef5', metal: '#8ea6bb', dark: '#3e5163', trim: '#ffb020', eye: '#7dfff2', ink: '#10181c' },
  rat: { light: '#d5e2a8', metal: '#7f935c', dark: '#2f3a24', trim: '#e6ff6a', eye: '#f4ffb0', ink: '#1a1f12' },
  bruiser: { light: '#ffb199', metal: '#d2563a', dark: '#6a2418', trim: '#ffd0b0', eye: '#ffe08a', ink: '#2a0c08' },
  warden: { light: '#b9d0e6', metal: '#4e7394', dark: '#1b3348', trim: '#ff8a3d', eye: '#ffd2a8', ink: '#071018' },
  reaper: { light: '#d7c4ea', metal: '#7a628f', dark: '#2c2236', trim: '#ff5fa2', eye: '#ff377a', ink: '#140910' },
  knight: { light: '#f0a090', metal: '#c44832', dark: '#4a160f', trim: '#ffcf70', eye: '#ffe1a8', ink: '#1a0a06' },
  prime: { light: '#fff1c9', metal: '#d7c08a', dark: '#5a4824', trim: '#fff6d8', eye: '#fffef8', ink: '#241c0c' },
  bishop: { light: '#d5efe6', metal: '#3f8f78', dark: '#14352c', trim: '#f2e7c9', eye: '#d8fff2', ink: '#071612' },
  ghoul: { light: '#d7e0c8', metal: '#6e7a62', dark: '#24281e', trim: '#b6f27a', eye: '#e8ffb0', ink: '#10140c' },
  hag: { light: '#ffd0a8', metal: '#e06a1a', dark: '#6a2c08', trim: '#ffe08a', eye: '#fff4c8', ink: '#2a1004' },
  monk: { light: '#e4e0d8', metal: '#8a8680', dark: '#3a3834', trim: '#f4efe4', eye: '#fff8e8', ink: '#161412' },
  viper: { light: '#e6ff9a', metal: '#7cb518', dark: '#2a4008', trim: '#d6ff4a', eye: '#f4ffb0', ink: '#121c04' },
  widow: { light: '#f2f4f7', metal: '#9aa3b2', dark: '#2c3340', trim: '#d7deea', eye: '#9be7ff', ink: '#0c1016' },
  golem: { light: '#ffb088', metal: '#c2410c', dark: '#4a1408', trim: '#ffd0a0', eye: '#ffe08a', ink: '#1c0804' },
  jackal: { light: '#ffd0f0', metal: '#d946a6', dark: '#6a1450', trim: '#ff8ad4', eye: '#ffe0f6', ink: '#240814' },
  hymn: { light: '#d4e4ff', metal: '#3b6cb5', dark: '#142848', trim: '#f0d48a', eye: '#e8f2ff', ink: '#081018' },
  maw: { light: '#ffc2b0', metal: '#9f1239', dark: '#3f0a18', trim: '#fb7185', eye: '#ffe0c8', ink: '#1a060c' },
  saint: { light: '#fff8dc', metal: '#e8c872', dark: '#6a5018', trim: '#fff4c4', eye: '#fffef6', ink: '#241c08' },
  bell: { light: '#d8c8f0', metal: '#5b3a8c', dark: '#241438', trim: '#c4b0e8', eye: '#e8d8ff', ink: '#100818' },
  relic: { light: '#d8f0e0', metal: '#2f6f5e', dark: '#102820', trim: '#e7d3a1', eye: '#d8ffe8', ink: '#061410' },
  crown: { light: '#fff7ea', metal: '#f0d090', dark: '#7a4810', trim: '#ffe566', eye: '#fffef8', ink: '#2a1804' },
}

function fromShell(shell: Shell): Record<string, string> {
  return {
    o: '#140e0a',
    1: shell.light,
    2: shell.metal,
    3: shell.dark,
    4: '#16120e',
    t: shell.trim,
    e: shell.eye,
    f: shell.eye,
    y: shell.trim,
    E: shell.trim,
  }
}

function fromPaint(paint: Paint): Record<string, string> {
  return {
    o: paint.ink,
    1: paint.light,
    2: paint.metal,
    3: paint.dark,
    4: paint.ink,
    t: paint.trim,
    e: paint.eye,
    f: paint.eye,
    y: paint.trim,
    E: paint.eye,
  }
}

export function drawRivet(ctx: CanvasRenderingContext2D, look: RobotLook, blink: boolean) {
  const frame = SHELLS.frame
  const shell = SHELLS[look.shell] ?? frame
  const body = fromShell(look.plates >= 4 ? shell : frame)
  const plate = fromShell(shell)
  const skip = blink ? 'e' : ''
  const scale = RIG.scale

  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(62, 208, 88, 6)
  blit(ctx, RIVET, RIG.x, RIG.y, scale, body, skip)
  if (look.wheelsOn && look.wheel > 0) {
    blit(ctx, WHEELS[look.wheel] ?? WHEELS[1], RIG.x, RIG.y + 36 * scale, scale, body, skip)
  }

  if (look.plates < 4) {
    if (look.covered & 1) blit(ctx, PLATE, RIG.x + 4 * scale, RIG.y + 17 * scale, scale, plate)
    if (look.covered & 2) blit(ctx, PLATE, RIG.x, RIG.y + 13 * scale, 2, plate)
    if (look.covered & 4) blit(ctx, PLATE, RIG.x + 18 * scale, RIG.y + 13 * scale, 2, plate)
    if (look.covered & 8) blit(ctx, PLATE, RIG.x + 8 * scale, RIG.y + 2 * scale, 2, plate)
  }

  if (look.core && look.processorId && look.plates < 4 && PART_ART[look.processorId]) {
    const chip = cropArt(PART_ART[look.processorId])
    blit(ctx, chip, 96, 102, 2)
  }
  if (look.cooled && PART_ART.cooler) blit(ctx, cropArt(PART_ART.cooler), 98, 116, 1)
  if (look.gpu && look.gpuId && PART_ART[look.gpuId]) blit(ctx, cropArt(PART_ART[look.gpuId]), 50, 124, 2)
  if (look.gpu && look.gpuWired) {
    ctx.fillStyle = '#7dfff2'
    ctx.fillRect(72, 138, 12, 3)
  }

  look.weaponIds.forEach((id, index) => {
    const art = PART_ART[id] ? cropArt(PART_ART[id]) : null
    if (!art) return
    const spot = hardpoint(index, look.weaponIds.length)
    const longest = Math.max(art[0].length, art.length)
    const weaponScale = longest > 12 ? 2 : 3
    const w = art[0].length * weaponScale
    const h = art.length * weaponScale
    ctx.save()
    ctx.translate(spot.x, spot.y)
    if (spot.x < 100) ctx.scale(-1, 1)
    blit(ctx, art, -Math.round(w / 2), -Math.round(h / 2), weaponScale)
    ctx.restore()
  })

  const visor = VISORS[Math.max(0, Math.min(5, look.visor))] ?? VISORS[0]
  blit(ctx, visor, RIG.x + 14 * scale, RIG.y + 6 * scale, scale, body, skip)
  if (look.visor >= 3) blit(ctx, ANTENNA, RIG.x + 15 * scale, RIG.y, scale, body)
  if (look.visor >= 5) blit(ctx, CROWNLET, RIG.x + 11 * scale, 18, scale, body)
}

export function drawEnemy(ctx: CanvasRenderingContext2D, kind: string, paint: string | undefined, blink: boolean) {
  const pal = PAINTS[paint ?? kind] ?? PAINTS[kind] ?? PAINTS.rat
  const colors = fromPaint(pal)
  const body = cropArt(BODIES[kind] ?? BODIES.rat)
  const longest = Math.max(body[0].length, body.length)
  const scale = Math.max(4, Math.min(6, Math.floor(176 / longest)))
  const width = body[0].length * scale
  const height = body.length * scale
  const x = Math.round((210 - width) / 2)
  const y = 208 - height
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(x + 8, 206, Math.max(40, width - 16), 6)
  blit(ctx, body, x, y, scale, colors, blink ? 'e' : '')
}
