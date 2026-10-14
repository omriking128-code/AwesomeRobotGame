import { useId } from 'react'
import type { RobotKind, Upgrades } from '../game'

type Palette = {
  light: string
  metal: string
  dark: string
  trim: string
  trimDark: string
  eye: string
  ink: string
}

const PALETTES: Record<RobotKind, Palette> = {
  player: {
    light: '#e7eef5',
    metal: '#8ea6bb',
    dark: '#3e5163',
    trim: '#ffb020',
    trimDark: '#c46a00',
    eye: '#7dfff2',
    ink: '#10181c',
  },
  rat: {
    light: '#d5e2a8',
    metal: '#7f935c',
    dark: '#2f3a24',
    trim: '#e6ff6a',
    trimDark: '#8aaa00',
    eye: '#f4ffb0',
    ink: '#1a1f12',
  },
  bruiser: {
    light: '#ffb199',
    metal: '#d2563a',
    dark: '#6a2418',
    trim: '#ffd0b0',
    trimDark: '#a33b24',
    eye: '#ffe08a',
    ink: '#2a0c08',
  },
  warden: {
    light: '#b9d0e6',
    metal: '#4e7394',
    dark: '#1b3348',
    trim: '#ff8a3d',
    trimDark: '#c44e00',
    eye: '#ffd2a8',
    ink: '#071018',
  },
  reaper: {
    light: '#d7c4ea',
    metal: '#7a628f',
    dark: '#2c2236',
    trim: '#ff5fa2',
    trimDark: '#a11455',
    eye: '#ff377a',
    ink: '#140910',
  },
  knight: {
    light: '#f0a090',
    metal: '#c44832',
    dark: '#4a160f',
    trim: '#ffcf70',
    trimDark: '#c47a10',
    eye: '#ffe1a8',
    ink: '#1a0a06',
  },
  prime: {
    light: '#fff1c9',
    metal: '#d7c08a',
    dark: '#5a4824',
    trim: '#fff6d8',
    trimDark: '#b8892c',
    eye: '#fffef8',
    ink: '#241c0c',
  },
}

const EMPTY_UPGRADES: Upgrades = { hull: 0, fist: 0, plate: 0, servo: 0 }

function Defs({ id, pal }: { id: string; pal: Palette }) {
  return (
    <defs>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={pal.light} />
        <stop offset="48%" stopColor={pal.metal} />
        <stop offset="100%" stopColor={pal.dark} />
      </linearGradient>
      <linearGradient id={`${id}-trim`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={pal.trim} />
        <stop offset="100%" stopColor={pal.trimDark} />
      </linearGradient>
      <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

function PlayerBody({ id, pal, upgrades }: { id: string; pal: Palette; upgrades: Upgrades }) {
  const metal = `url(#${id}-metal)`
  const trim = `url(#${id}-trim)`
  return (
    <g>
      <ellipse cx="100" cy="208" rx="52" ry="8" fill="rgba(0,0,0,0.35)" />
      <rect x="78" y="156" width="20" height="42" rx="8" fill={pal.dark} />
      <rect x="108" y="152" width="22" height="46" rx="8" fill={metal} />
      <rect x="70" y="192" width="34" height="12" rx="6" fill={trim} />
      <rect x="104" y="192" width="40" height="12" rx="6" fill={trim} />
      {upgrades.servo > 0 && (
        <ellipse className="ember" cx="124" cy="206" rx="12" ry="4" fill={pal.eye} opacity="0.85" />
      )}
      <rect x="68" y="84" width="78" height="78" rx="16" fill={metal} />
      <rect x="82" y="100" width="50" height="10" rx="4" fill={trim} />
      <circle cx="107" cy="128" r="8" fill={pal.ink} />
      <circle cx="107" cy="128" r="3.5" fill={pal.trim} />
      {upgrades.plate > 0 && <path d="M86 112 h46 l-8 30 h-30 z" fill={trim} opacity="0.95" />}
      {upgrades.hull > 2 && <rect x="80" y="72" width="54" height="14" rx="5" fill={trim} />}
      <rect x="76" y="28" width="62" height="54" rx="18" fill={metal} />
      <rect x="98" y="46" width="32" height="16" rx="8" fill={pal.ink} />
      <circle className="eye" cx="120" cy="54" r="4.5" fill={pal.eye} filter={`url(#${id}-glow)`} />
      <rect x="104" y="12" width="6" height="18" rx="3" fill={pal.dark} />
      <circle cx="107" cy="11" r="6" fill={trim} />
      {upgrades.servo > 1 && (
        <>
          <rect x="90" y="16" width="5" height="14" rx="2" fill={pal.dark} />
          <circle className="eye" cx="92" cy="14" r="4" fill={pal.eye} />
        </>
      )}
      {upgrades.hull > 0 && <rect x="52" y="86" width="24" height="22" rx="7" fill={trim} />}
      {upgrades.hull > 1 && <rect x="138" y="78" width="26" height="20" rx="7" fill={trim} />}
      <rect x="46" y="108" width="26" height="16" rx="7" fill={pal.dark} />
      <rect x="136" y="102" width="36" height="16" rx="8" fill={metal} />
      <rect
        x="166"
        y={upgrades.fist > 0 ? 92 : 96}
        width={upgrades.fist > 0 ? 26 : 20}
        height={upgrades.fist > 0 ? 32 : 26}
        rx="8"
        fill={pal.dark}
      />
      {upgrades.fist > 1 && (
        <polygon points="176,88 190,78 186,100" fill={pal.ink} />
      )}
      {upgrades.fist > 3 && <polygon points="186,96 200,88 194,108" fill={pal.trim} />}
    </g>
  )
}

function TinRat({ id, pal }: { id: string; pal: Palette }) {
  const metal = `url(#${id}-metal)`
  const trim = `url(#${id}-trim)`
  return (
    <g>
      <ellipse cx="108" cy="206" rx="46" ry="7" fill="rgba(0,0,0,0.35)" />
      <path d="M46 150 C20 154 18 126 34 120" fill="none" stroke={pal.dark} strokeWidth="8" strokeLinecap="round" />
      <rect x="78" y="168" width="16" height="28" rx="6" fill={pal.dark} />
      <rect x="112" y="164" width="18" height="32" rx="6" fill={metal} />
      <rect x="70" y="190" width="30" height="10" rx="5" fill={trim} />
      <rect x="108" y="190" width="34" height="10" rx="5" fill={trim} />
      <rect x="74" y="112" width="78" height="58" rx="18" fill={metal} />
      <polygon points="78,112 92,78 108,112" fill={pal.dark} />
      <polygon points="118,112 138,70 150,114" fill={trim} />
      <rect x="92" y="78" width="48" height="40" rx="14" fill={metal} />
      <circle className="eye" cx="108" cy="96" r="5" fill={pal.eye} filter={`url(#${id}-glow)`} />
      <circle className="eye" cx="126" cy="96" r="5" fill={pal.eye} filter={`url(#${id}-glow)`} />
      <rect x="112" y="108" width="16" height="6" rx="2" fill={pal.ink} />
      <rect x="142" y="128" width="34" height="12" rx="6" fill={metal} />
      <rect x="170" y="122" width="16" height="20" rx="5" fill={pal.dark} />
    </g>
  )
}

function BoltBruiser({ id, pal }: { id: string; pal: Palette }) {
  const metal = `url(#${id}-metal)`
  const trim = `url(#${id}-trim)`
  return (
    <g>
      <ellipse cx="100" cy="208" rx="58" ry="8" fill="rgba(0,0,0,0.35)" />
      <rect x="70" y="162" width="26" height="36" rx="8" fill={pal.dark} />
      <rect x="112" y="158" width="28" height="40" rx="8" fill={metal} />
      <rect x="62" y="192" width="42" height="14" rx="6" fill={trim} />
      <rect x="108" y="192" width="46" height="14" rx="6" fill={trim} />
      <rect x="48" y="78" width="112" height="88" rx="20" fill={metal} />
      <circle cx="62" cy="96" r="22" fill={pal.dark} />
      <circle cx="146" cy="92" r="24" fill={trim} />
      <rect x="86" y="36" width="40" height="36" rx="10" fill={metal} />
      <rect x="92" y="50" width="28" height="8" rx="4" fill={pal.ink} />
      <circle className="eye" cx="114" cy="54" r="3" fill={pal.eye} filter={`url(#${id}-glow)`} />
      <rect x="148" y="108" width="28" height="18" rx="8" fill={metal} />
      <rect x="168" y="96" width="28" height="36" rx="8" fill={pal.dark} />
      <polygon points="174,92 184,74 194,96" fill={pal.ink} />
      <polygon points="188,100 204,92 196,116" fill={pal.ink} />
    </g>
  )
}

function WeldWarden({ id, pal }: { id: string; pal: Palette }) {
  const metal = `url(#${id}-metal)`
  const trim = `url(#${id}-trim)`
  return (
    <g>
      <ellipse cx="100" cy="208" rx="50" ry="8" fill="rgba(0,0,0,0.35)" />
      <rect x="76" y="160" width="20" height="38" rx="8" fill={pal.dark} />
      <rect x="108" y="156" width="22" height="42" rx="8" fill={metal} />
      <rect x="68" y="192" width="36" height="12" rx="6" fill={trim} />
      <rect x="104" y="192" width="40" height="12" rx="6" fill={trim} />
      <rect x="72" y="86" width="70" height="80" rx="28" fill={metal} />
      <rect x="86" y="108" width="42" height="8" rx="3" fill={pal.ink} />
      <rect x="86" y="124" width="42" height="8" rx="3" fill={pal.ink} />
      <rect x="70" y="28" width="74" height="58" rx="12" fill={metal} />
      <rect x="78" y="48" width="58" height="22" rx="6" fill={pal.ink} />
      <rect className="ember" x="84" y="54" width="46" height="8" rx="4" fill={pal.trim} filter={`url(#${id}-glow)`} />
      <rect x="138" y="112" width="30" height="14" rx="6" fill={metal} />
      <circle className="ember" cx="176" cy="118" r="14" fill={pal.trim} filter={`url(#${id}-glow)`} />
      <circle cx="176" cy="118" r="6" fill={pal.eye} />
    </g>
  )
}

function CoilReaper({ id, pal }: { id: string; pal: Palette }) {
  const metal = `url(#${id}-metal)`
  const trim = `url(#${id}-trim)`
  return (
    <g>
      <ellipse cx="104" cy="208" rx="42" ry="7" fill="rgba(0,0,0,0.35)" />
      <path d="M96 150 C88 176 70 184 64 196" fill="none" stroke={pal.dark} strokeWidth="10" strokeLinecap="round" />
      <path d="M118 146 C130 174 150 180 156 196" fill="none" stroke={metal} strokeWidth="10" strokeLinecap="round" />
      <path d="M78 70 C60 90 58 130 86 148 L124 144 C150 120 146 78 116 64 Z" fill={metal} />
      <circle cx="108" cy="46" r="22" fill={metal} />
      <circle cx="108" cy="46" r="10" fill={pal.ink} />
      <circle className="eye" cx="112" cy="46" r="5" fill={pal.eye} filter={`url(#${id}-glow)`} />
      <path d="M100 66 C96 78 92 84 88 96" fill="none" stroke={pal.dark} strokeWidth="4" />
      <path d="M150 96 C186 70 196 120 168 150" fill="none" stroke={trim} strokeWidth="8" strokeLinecap="round" />
      <path d="M162 142 l22 16 M168 132 l24 6 M156 150 l10 22" fill="none" stroke={pal.ink} strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

function FurnaceKnight({ id, pal }: { id: string; pal: Palette }) {
  const metal = `url(#${id}-metal)`
  const trim = `url(#${id}-trim)`
  return (
    <g>
      <ellipse cx="100" cy="208" rx="56" ry="8" fill="rgba(0,0,0,0.35)" />
      <rect x="68" y="158" width="26" height="40" rx="6" fill={pal.dark} />
      <rect x="110" y="154" width="28" height="44" rx="6" fill={metal} />
      <rect x="58" y="190" width="46" height="16" rx="4" fill={trim} />
      <rect x="104" y="190" width="50" height="16" rx="4" fill={trim} />
      <rect x="62" y="78" width="90" height="84" rx="10" fill={metal} />
      <rect className="ember" x="84" y="98" width="12" height="28" rx="2" fill={pal.trim} filter={`url(#${id}-glow)`} />
      <rect className="ember" x="102" y="98" width="12" height="28" rx="2" fill={pal.eye} filter={`url(#${id}-glow)`} />
      <rect className="ember" x="120" y="98" width="12" height="28" rx="2" fill={pal.trim} filter={`url(#${id}-glow)`} />
      <rect x="74" y="24" width="64" height="56" rx="8" fill={metal} />
      <rect x="98" y="8" width="16" height="22" rx="3" fill={trim} />
      <path d="M92 16 h28 l-6 14 h-16 z" fill={pal.trim} />
      <rect x="86" y="44" width="40" height="16" rx="2" fill={pal.ink} />
      <rect x="104" y="44" width="6" height="16" fill={pal.eye} />
      <rect x="140" y="96" width="34" height="16" rx="4" fill={metal} />
      <rect x="168" y="88" width="22" height="30" rx="4" fill={pal.dark} />
    </g>
  )
}

function ApexPrime({ id, pal }: { id: string; pal: Palette }) {
  const metal = `url(#${id}-metal)`
  const trim = `url(#${id}-trim)`
  return (
    <g>
      <ellipse cx="100" cy="208" rx="54" ry="8" fill="rgba(0,0,0,0.35)" />
      <path d="M58 96 L34 112 L40 188 L78 170 Z" fill={pal.dark} opacity="0.9" />
      <rect x="76" y="156" width="18" height="40" rx="6" fill={pal.dark} />
      <rect x="108" y="152" width="20" height="44" rx="6" fill={metal} />
      <rect x="68" y="192" width="34" height="12" rx="4" fill={trim} />
      <rect x="102" y="192" width="40" height="12" rx="4" fill={trim} />
      <rect x="70" y="78" width="74" height="82" rx="18" fill={metal} />
      <rect x="84" y="96" width="46" height="8" rx="3" fill={trim} />
      <rect x="84" y="112" width="46" height="8" rx="3" fill={trim} />
      <rect x="78" y="30" width="58" height="48" rx="16" fill={metal} />
      <polygon points="84,32 94,10 104,32" fill={trim} />
      <polygon points="104,30 118,6 128,30" fill={pal.eye} />
      <polygon points="124,32 136,12 146,34" fill={trim} />
      <rect x="90" y="48" width="36" height="10" rx="5" fill={pal.ink} />
      <rect className="eye ember" x="108" y="50" width="14" height="6" rx="3" fill={pal.eye} filter={`url(#${id}-glow)`} />
      <rect x="136" y="104" width="22" height="14" rx="4" fill={metal} />
      <rect x="154" y="98" width="18" height="22" rx="4" fill={pal.dark} />
      <rect x="168" y="92" width="22" height="14" rx="4" fill={trim} />
      <circle className="ember" cx="186" cy="98" r="6" fill={pal.eye} filter={`url(#${id}-glow)`} />
    </g>
  )
}

export function RobotFigure({
  kind,
  upgrades = EMPTY_UPGRADES,
}: {
  kind: RobotKind
  upgrades?: Upgrades
}) {
  const reactId = useId().replace(/:/g, '')
  const id = `bot-${reactId}`
  const pal = PALETTES[kind]

  return (
    <svg className="robot-svg" viewBox="0 0 210 220" role="img" aria-hidden="true">
      <Defs id={id} pal={pal} />
      {kind === 'player' && <PlayerBody id={id} pal={pal} upgrades={upgrades} />}
      {kind === 'rat' && <TinRat id={id} pal={pal} />}
      {kind === 'bruiser' && <BoltBruiser id={id} pal={pal} />}
      {kind === 'warden' && <WeldWarden id={id} pal={pal} />}
      {kind === 'reaper' && <CoilReaper id={id} pal={pal} />}
      {kind === 'knight' && <FurnaceKnight id={id} pal={pal} />}
      {kind === 'prime' && <ApexPrime id={id} pal={pal} />}
    </svg>
  )
}
