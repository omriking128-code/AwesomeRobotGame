import { useId } from 'react'
import type { RobotLook } from '../parts'

type Shell = { light: string; metal: string; dark: string; trim: string; eye: string }

const SHELLS: Record<string, Shell> = {
  frame: { light: '#d5dbe2', metal: '#8b97a3', dark: '#3c4650', trim: '#ffb020', eye: '#7dfff2' },
  tin: { light: '#e7eef5', metal: '#8ea6bb', dark: '#3e5163', trim: '#ffb020', eye: '#7dfff2' },
  bolt: { light: '#d5dde6', metal: '#6d7c8c', dark: '#2c3642', trim: '#d7e2ee', eye: '#cfe6ff' },
  weld: { light: '#ffd0b4', metal: '#e07a3d', dark: '#6a3014', trim: '#ffb020', eye: '#ffe08a' },
  furnace: { light: '#ffb199', metal: '#c2412d', dark: '#4a160f', trim: '#ffcf70', eye: '#ffe1a8' },
  apex: { light: '#fff1c9', metal: '#d7c08a', dark: '#5a4824', trim: '#fff6d8', eye: '#fffef8' },
  crown: { light: '#fffaf0', metal: '#f0d78a', dark: '#7a4e12', trim: '#ffe566', eye: '#fffef8' },
}

function glyph(id: string, x: number, y: number, trim: string, ink: string) {
  if (id === 'saw' || id === 'blades') {
    return <circle cx={x + 10} cy={y + 10} r="9" fill="none" stroke={trim} strokeWidth="3" />
  }
  if (id === 'welder' || id === 'tesla') {
    return <path d={`M${x} ${y + 16} l8 -14 l4 8 l8 -12`} fill="none" stroke={trim} strokeWidth="3" />
  }
  if (id === 'cannon' || id === 'slag') {
    return <rect x={x} y={y + 6} width="22" height="8" rx="3" fill={ink} />
  }
  if (id === 'drill' || id === 'spike') {
    return <polygon points={`${x},${y + 10} ${x + 18},${y + 4} ${x + 18},${y + 16}`} fill={trim} />
  }
  if (id === 'vent') {
    return <path d={`M${x + 4} ${y + 16} q8 -16 16 0`} fill={trim} opacity="0.9" />
  }
  if (id === 'hook') {
    return <path d={`M${x + 4} ${y + 4} q14 0 10 12`} fill="none" stroke={trim} strokeWidth="3" />
  }
  if (id === 'hammer') {
    return <rect x={x} y={y} width="16" height="10" rx="2" fill={ink} />
  }
  return <rect x={x + 2} y={y + 2} width="14" height="16" rx="4" fill={ink} />
}

export function PlayerRig({ look }: { look: RobotLook }) {
  const reactId = useId().replace(/:/g, '')
  const id = `rig-${reactId}`
  const frame = SHELLS.frame
  const shell = SHELLS[look.shell] ?? frame
  const pal = look.plates > 0 ? shell : frame
  const covered = look.plates >= 4
  const eye = 4 + look.visor
  return (
    <svg className="robot-svg" viewBox="0 0 210 220" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pal.light} />
          <stop offset="55%" stopColor={pal.metal} />
          <stop offset="100%" stopColor={pal.dark} />
        </linearGradient>
        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="104" cy="208" rx="54" ry="8" fill="rgba(0,0,0,0.35)" />
      {look.wheelsOn && look.wheel > 0 && look.wheel < 3 && (
        <>
          <circle cx="78" cy="198" r={8 + look.wheel * 2} fill={pal.dark} />
          <circle cx="136" cy="198" r={8 + look.wheel * 2} fill={pal.dark} />
          <circle cx="78" cy="198" r="3" fill={pal.trim} />
          <circle cx="136" cy="198" r="3" fill={pal.trim} />
        </>
      )}
      {look.wheelsOn && look.wheel === 3 && (
        <>
          <rect x="58" y="188" width="40" height="16" rx="6" fill={pal.dark} />
          <rect x="114" y="188" width="44" height="16" rx="6" fill={pal.dark} />
        </>
      )}
      {look.wheelsOn && look.wheel === 4 && (
        <>
          <circle cx="74" cy="196" r="14" fill={pal.dark} />
          <circle cx="140" cy="196" r="14" fill={pal.dark} />
          <circle className="ember" cx="74" cy="196" r="5" fill={pal.eye} filter={`url(#${id}-glow)`} />
          <circle className="ember" cx="140" cy="196" r="5" fill={pal.eye} filter={`url(#${id}-glow)`} />
        </>
      )}
      {look.wheelsOn && look.wheel >= 5 && (
        <>
          <rect x="48" y="184" width="52" height="20" rx="6" fill={pal.dark} />
          <rect x="112" y="184" width="56" height="20" rx="6" fill={pal.dark} />
          <rect x="54" y="190" width="40" height="4" fill={pal.trim} />
          <rect x="118" y="190" width="44" height="4" fill={pal.trim} />
        </>
      )}
      <rect x="82" y="156" width="16" height="36" rx="6" fill={pal.dark} />
      <rect x="112" y="152" width="18" height="40" rx="6" fill={`url(#${id}-metal)`} />
      <rect x="70" y="86" width="74" height="74" rx="16" fill={covered ? `url(#${id}-metal)` : frame.metal} />
      {look.plates >= 1 && <rect x="82" y="100" width="50" height="42" rx="8" fill={shell.metal} opacity="0.95" />}
      {look.plates >= 2 && <rect x="52" y="90" width="22" height="28" rx="7" fill={shell.trim} />}
      {look.plates >= 3 && <rect x="140" y="84" width="24" height="26" rx="7" fill={shell.trim} />}
      {look.core && (
        <>
          <circle cx="107" cy="124" r="9" fill={pal.dark} />
          <circle className="eye" cx="107" cy="124" r="4" fill={pal.eye} filter={`url(#${id}-glow)`} />
        </>
      )}
      {look.gpu && <rect x="40" y="112" width="16" height="28" rx="3" fill={pal.trim} />}
      <rect x="78" y="30" width="58" height="52" rx="16" fill={look.plates >= 4 ? `url(#${id}-metal)` : frame.metal} />
      {look.plates >= 4 && <path d="M86 36 h42 l-6 14 h-30 z" fill={shell.trim} />}
      <rect x="92" y="48" width={28 + look.visor * 2} height={10 + Math.min(6, look.visor)} rx="6" fill="#10181c" />
      <circle className="eye" cx={108 + look.visor} cy={53 + look.visor * 0.2} r={eye} fill={pal.eye} filter={`url(#${id}-glow)`} />
      {look.visor >= 3 && <rect x="104" y="14" width="6" height="16" rx="2" fill={pal.dark} />}
      {look.visor >= 5 && <circle cx="107" cy="12" r="5" fill={pal.trim} />}
      <rect x="46" y="108" width="24" height="14" rx="6" fill={pal.dark} />
      <rect x="142" y="102" width="28" height="14" rx="6" fill={covered ? shell.metal : frame.dark} />
      {look.weaponIds.slice(0, 4).map((weaponId, index) => {
        const spot = [
          { x: 166, y: 90 },
          { x: 150, y: 70 },
          { x: 28, y: 96 },
          { x: 24, y: 72 },
        ][index]
        return <g key={`${weaponId}-${index}`}>{glyph(weaponId, spot.x, spot.y, pal.trim, '#1a120e')}</g>
      })}
    </svg>
  )
}
