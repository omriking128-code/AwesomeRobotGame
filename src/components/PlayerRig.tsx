import type { RobotLook } from '../parts'
import { PixelStage, useBlink } from '../pixel'
import { drawRivet } from '../robots'

export function PlayerRig({ look }: { look: RobotLook }) {
  const blink = useBlink()
  return <PixelStage draw={(ctx) => drawRivet(ctx, look, blink)} />
}
