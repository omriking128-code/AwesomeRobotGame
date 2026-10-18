import type { RobotKind } from '../game'
import { PixelStage, useBlink } from '../pixel'
import { drawEnemy } from '../robots'

type Upgrades = { hull: number; fist: number; plate: number; servo: number }

export function RobotFigure({
  kind,
  paint,
}: {
  kind: RobotKind
  paint?: string
  upgrades?: Upgrades
}) {
  const blink = useBlink()
  const body = kind === 'player' ? 'prime' : kind
  return <PixelStage draw={(ctx) => drawEnemy(ctx, body, paint ?? kind, blink)} />
}
