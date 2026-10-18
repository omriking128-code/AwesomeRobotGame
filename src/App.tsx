import { useEffect, useRef, useState } from 'react'
import { RobotFigure } from './components/RobotFigure'
import { PlayerRig } from './components/PlayerRig'
import { Shop } from './components/Shop'
import { BuildBench } from './components/BuildBench'
import { RepairBench } from './components/RepairBench'
import {
  LEVELS,
  SAVE_KEY,
  applyFightEnd,
  currentOpponent,
  expectedHit,
  forecast,
  loadSave,
  loadoutWeapons,
  playerStats,
  resolveFight,
  starterSave,
  strikeBonus,
  type Action,
  type LevelDef,
  type Outlook,
  type RobotKind,
  type Save,
} from './game'
import {
  buildBlockers,
  buyPart,
  catalog,
  installedUids,
  isBuilt,
  partByUid,
  repairPart,
  robotLook,
  sellPart,
  unequip,
} from './parts'
import { playBuy, playDodge, playDown, playHit, playLose, playWin, unlockAudio } from './sound'

type Phase = 'pit' | 'shop' | 'build' | 'repair' | 'fight' | 'result'

type Match = {
  playerHp: number
  playerMax: number
  enemyName: string
  enemyHp: number
  enemyMax: number
  enemyKind: Exclude<RobotKind, 'player'>
  enemyPaint: string
  reward: number
  levelNumber: number
  rematch: boolean
  crowned: boolean
  actions: Action[]
  winner: 'player' | 'enemy'
  hitsTaken: number
  firedUids: string[]
}

const MUTE_KEY = 'scrap-ring-muted'

function outlookCopy(outlook: Outlook): string {
  if (outlook === 'favored') return 'Rivet can take this fight.'
  if (outlook === 'even') return 'This one is close. A better part could decide it.'
  return 'This bot is ahead. Build smarter before you deploy.'
}

function poseFor(side: 'player' | 'enemy', action: Action | undefined, hp: number, finished: boolean) {
  if (hp <= 0) return 'ko'
  if (finished || !action) return 'idle'
  if (action.attacker === side) return 'attack'
  if (action.kind === 'dodge') return 'dodge'
  return 'hit'
}

function App() {
  const [save, setSave] = useState<Save>(() => loadSave())
  const [phase, setPhase] = useState<Phase>(() => (isBuilt(loadSave().parts, loadSave().assembly) ? 'pit' : 'build'))
  const [match, setMatch] = useState<Match | null>(null)
  const [step, setStep] = useState(0)
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === '1')
  const [resetArmed, setResetArmed] = useState(false)
  const ringRef = useRef<HTMLDivElement>(null)
  const mutedRef = useRef(muted)
  const paidMatch = useRef<Match | null>(null)
  mutedRef.current = muted

  const stats = playerStats(save)
  const weapons = loadoutWeapons(save)
  const bonus = strikeBonus(save)
  const ready = isBuilt(save.parts, save.assembly)
  const opponent = currentOpponent(save.nextLevel)
  const look = robotLook(save.parts, save.assembly)
  const blockers = buildBlockers(save.parts, save.assembly)
  const enemyFighter = {
    name: opponent.level.name,
    hp: opponent.level.hp,
    power: opponent.level.power,
    armor: opponent.level.armor,
    speed: opponent.level.speed,
    intellect: opponent.level.intellect,
  }
  const outlook = ready ? forecast({ ...stats, name: 'Rivet' }, enemyFighter, weapons, bonus) : 'underdog'
  const bestPower = weapons.reduce((best, weapon) => Math.max(best, weapon.part.power + bonus), bonus)

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  }, [save])

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  useEffect(() => {
    if (phase !== 'fight' || !match) return
    if (step < match.actions.length) {
      const delay = step === 0 ? 420 : 640
      const timer = window.setTimeout(() => setStep((current) => current + 1), delay)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => {
      if (paidMatch.current !== match) {
        paidMatch.current = match
        setSave((prev) =>
          applyFightEnd(prev, {
            win: match.winner === 'player',
            reward: match.reward,
            hitsTaken: match.hitsTaken,
            firedUids: match.firedUids,
          }),
        )
        if (!mutedRef.current) {
          if (match.winner === 'player') playWin()
          else playLose()
        }
      }
      setPhase('result')
    }, 720)
    return () => window.clearTimeout(timer)
  }, [phase, step, match])

  useEffect(() => {
    if (phase !== 'fight' || !match || step === 0 || mutedRef.current) return
    const action = match.actions[step - 1]
    if (!action) return
    if (action.kind === 'dodge') playDodge()
    else if (action.playerHp === 0 || action.enemyHp === 0) playDown()
    else playHit()
  }, [phase, step, match])

  useEffect(() => {
    const ring = ringRef.current
    const action = match?.actions[step - 1]
    if (!ring || phase !== 'fight' || !action || action.kind !== 'hit') return
    ring.classList.remove('shake')
    void ring.offsetWidth
    ring.classList.add('shake')
  }, [phase, step, match])

  function deploy() {
    if (!ready) {
      setPhase('build')
      return
    }
    unlockAudio()
    const foe = currentOpponent(save.nextLevel)
    const result = resolveFight({ ...stats, name: 'Rivet' }, {
      name: foe.level.name,
      hp: foe.level.hp,
      power: foe.level.power,
      armor: foe.level.armor,
      speed: foe.level.speed,
      intellect: foe.level.intellect,
    }, weapons, bonus, Math.random)
    setMatch({
      playerHp: stats.hp,
      playerMax: stats.hp,
      enemyName: foe.level.name,
      enemyHp: foe.level.hp,
      enemyMax: foe.level.hp,
      enemyKind: foe.level.kind,
      enemyPaint: foe.level.paint,
      reward: foe.level.reward,
      levelNumber: foe.number,
      rematch: foe.rematch,
      crowned: !foe.rematch && foe.index === LEVELS.length - 1,
      actions: result.actions,
      winner: result.winner,
      hitsTaken: result.hitsTaken,
      firedUids: result.firedUids,
    })
    setStep(0)
    setPhase('fight')
  }

  function leave(next: Phase = 'pit') {
    setPhase(next)
    setMatch(null)
    setStep(0)
  }

  function forfeit() {
    if (!match || paidMatch.current === match) {
      leave('pit')
      return
    }
    const happened = match.actions.slice(0, step)
    paidMatch.current = match
    setSave((prev) =>
      applyFightEnd(prev, {
        win: false,
        reward: 0,
        hitsTaken: happened.filter((action) => action.attacker === 'enemy' && action.kind === 'hit').length,
        firedUids: happened.map((action) => action.weaponUid).filter((uid): uid is string => Boolean(uid)),
      }),
    )
    leave('repair')
  }

  function askReset() {
    if (!resetArmed) {
      setResetArmed(true)
      window.setTimeout(() => setResetArmed(false), 2600)
      return
    }
    setSave(starterSave())
    setMatch(null)
    setStep(0)
    setPhase('build')
    setResetArmed(false)
  }

  function buy(id: string) {
    unlockAudio()
    if (!muted) playBuy()
    setSave((current) => buyPart(current, id))
  }

  function sell(uid: string) {
    setSave((current) => sellPart(current, uid))
  }

  const shown = match && step > 0 ? match.actions[step - 1] : undefined
  const playerHp = shown ? shown.playerHp : (match?.playerHp ?? stats.hp)
  const enemyHp = shown ? shown.enemyHp : (match?.enemyHp ?? opponent.level.hp)
  const finished = phase === 'result'
  const weaponClass = shown?.attacker === 'player' && shown.weaponId ? `w-${shown.weaponId}` : ''

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Robot pit</p>
          <h1>Scrap Ring</h1>
        </div>
        <div className="top-meta">
          <p className="level-chip" data-testid="level">
            {opponent.rematch ? 'Champion rematch' : `Level ${opponent.number} of ${LEVELS.length}`}
          </p>
          <p className="money" data-testid="money">
            <span>Money</span>
            <strong>{save.money}</strong>
          </p>
          {phase !== 'fight' && phase !== 'result' && (
            <>
              <button type="button" className="shop-launch slim" data-testid="open-shop" onClick={() => setPhase('shop')}>Part shop</button>
              <button type="button" className="ghost" data-testid="open-build" onClick={() => setPhase('build')}>Build</button>
              <button type="button" className="ghost" data-testid="open-repair" onClick={() => setPhase('repair')}>Repair</button>
            </>
          )}
          <button type="button" className="ghost" onClick={() => setMuted((current) => {
            const next = !current
            localStorage.setItem(MUTE_KEY, next ? '1' : '0')
            if (!next) unlockAudio()
            return next
          })}>
            {muted ? 'Sound off' : 'Sound on'}
          </button>
          <button type="button" className="ghost" onClick={askReset}>
            {resetArmed ? 'Tap again to reset' : 'Reset'}
          </button>
        </div>
      </header>

      <main>
        {phase === 'pit' && (
          <Pit
            save={save}
            look={look}
            stats={stats}
            ready={ready}
            blockers={blockers}
            opponent={opponent.level}
            levelNumber={opponent.number}
            rematch={opponent.rematch}
            outlook={outlook}
            bestPower={bestPower}
          />
        )}
        {phase === 'shop' && <Shop save={save} onBuy={buy} onSell={sell} />}
        {phase === 'build' && (
          <BuildBench
            parts={save.parts}
            assembly={save.assembly}
            muted={muted}
            onChange={(assembly) => setSave((current) => ({ ...current, assembly }))}
          />
        )}
        {phase === 'repair' && (
          <RepairBench
            save={save}
            muted={muted}
            onRepair={(uid) => {
              if (!muted) playBuy()
              setSave((current) => repairPart(current, uid))
            }}
            onUnequip={(uid) => setSave((current) => ({ ...current, assembly: unequip(current.assembly, uid) }))}
          />
        )}
        {(phase === 'fight' || phase === 'result') && match && (
          <section className="fight">
            <div className="ring" ref={ringRef}>
              <p className="watermark">{String(match.levelNumber).padStart(2, '0')}</p>
              {phase === 'fight' && shown?.kind === 'hit' && shown.weaponId && (
                <span key={`fx-${shown.id}`} className={`weapon-fx fx-${shown.weaponId}`} />
              )}
              {phase === 'fight' && shown && (
                <b
                  key={`float-${shown.id}`}
                  className={`floater ${shown.attacker === 'player' ? 'on-enemy' : 'on-player'} ${shown.kind === 'dodge' ? 'miss' : ''}`}
                >
                  {shown.kind === 'dodge' ? 'Dodge' : `-${shown.damage}`}
                </b>
              )}
              <div className={`fighter player`}>
                <HpBar hp={playerHp} max={match.playerMax} enemy={false} />
                <div className={`pose ${poseFor('player', shown, playerHp, finished)} ${weaponClass}`}>
                  <PlayerRig look={look} />
                </div>
                <p className="fighter-name">Rivet</p>
              </div>
              <div className="fighter enemy">
                <HpBar hp={enemyHp} max={match.enemyMax} enemy />
                <div className={`pose ${poseFor('enemy', shown, enemyHp, finished)}`}>
                  <div className="flip">
                    <RobotFigure kind={match.enemyKind} paint={match.enemyPaint} />
                  </div>
                </div>
                <p className="fighter-name">{match.enemyName}</p>
              </div>
            </div>
            {phase === 'result' && <ResultCard match={match} />}
            <div className="log" aria-live="polite" data-testid="log">
              {step === 0 && <p>The bell is about to ring.</p>}
              {match.actions.slice(0, step).slice(-3).map((action) => (
                <p key={action.id} className={action.id === step ? 'latest' : ''}>{action.line}</p>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="dock">
        {phase === 'pit' && (
          <div className="dock-row">
            <button type="button" className="shop-launch" data-testid="dock-shop" onClick={() => setPhase('shop')}>Part shop</button>
            <button type="button" className="deploy" data-testid="deploy" onClick={deploy}>
              <span>{ready ? (opponent.rematch ? 'Defend your title' : 'Deploy into the ring') : 'Build Rivet first'}</span>
              <small>
                {ready
                  ? `${opponent.rematch ? 'Rematch' : `Fight ${opponent.number}`} · ${opponent.level.name} · win ${opponent.level.reward} money`
                  : blockers[0]}
              </small>
            </button>
          </div>
        )}
        {phase === 'shop' && (
          <button type="button" className="deploy" onClick={() => setPhase(ready ? 'pit' : 'build')}>Back to the bench</button>
        )}
        {phase === 'build' && (
          <div className="dock-row">
            <button type="button" className="shop-launch" data-testid="dock-shop" onClick={() => setPhase('shop')}>Part shop</button>
            <button type="button" className="deploy" data-testid="build-done" onClick={() => setPhase('pit')}>
              {ready ? 'Rivet is ready' : 'Back to the pit'}
            </button>
          </div>
        )}
        {phase === 'repair' && (
          <button type="button" className="deploy" onClick={() => setPhase('pit')}>Back to the pit</button>
        )}
        {phase === 'fight' && (
          <div className="fight-actions">
            <button type="button" className="deploy slim" onClick={() => match && setStep(match.actions.length)}>Skip fight</button>
            <button type="button" className="ghost wide" onClick={forfeit}>Forfeit</button>
          </div>
        )}
        {phase === 'result' && (
          <button type="button" className="deploy" data-testid="continue" onClick={() => leave('repair')}>Check the damage</button>
        )}
      </footer>
    </div>
  )
}

function Pit({
  save,
  look,
  stats,
  ready,
  blockers,
  opponent,
  levelNumber,
  rematch,
  outlook,
  bestPower,
}: {
  save: Save
  look: ReturnType<typeof robotLook>
  stats: ReturnType<typeof playerStats>
  ready: boolean
  blockers: string[]
  opponent: LevelDef
  levelNumber: number
  rematch: boolean
  outlook: Outlook
  bestPower: number
}) {
  const yourHit = expectedHit(bestPower, opponent.armor)
  const theirHit = expectedHit(opponent.power, stats.armor)
  return (
    <div className="garage">
      {!ready && (
        <ol className="primer">
          <li>The shop gave you a starter pile of parts.</li>
          <li>Build Rivet: wire the weapons, boot the OS, then close the shell.</li>
          <li>Win money, buy better parts, and repair whatever the fight breaks.</li>
        </ol>
      )}
      <div className="garage-grid">
        <section className="panel bay">
          <div className="bay-stage">
            <PlayerRig look={look} />
          </div>
          <div className="bay-copy">
            <h2>Rivet</h2>
            <p>{ready ? 'Built and wired' : blockers[0]}</p>
          </div>
          <div className="meters">
            <Meter label="Health" value={stats.hp} max={120} testId="stat-hp" />
            <Meter label="Power" value={stats.power} max={40} testId="stat-power" />
            <Meter label="Armor" value={stats.armor} max={12} testId="stat-armor" />
            <Meter label="Speed" value={stats.speed} max={20} testId="stat-speed" />
            <Meter label="Smarts" value={stats.intellect} max={24} testId="stat-intellect" />
          </div>
          <ul className="part-pills">
            {installedUids(save.assembly).map((uid) => {
              const part = partByUid(save.parts, uid)
              if (!part) return null
              return (
                <li key={uid} className={part.durability <= 30 ? 'bad' : ''}>
                  {catalog(part.id).name}
                  <b>{part.durability}%</b>
                </li>
              )
            })}
          </ul>
          <p className="fine">Intelligence raises the chance to hit and to dodge. A smarter processor also picks the right weapon.</p>
        </section>
        <section className="panel opponent">
          <div className="opponent-head">
            <div className="preview">
              <RobotFigure kind={opponent.kind} paint={opponent.paint} />
            </div>
            <div>
              <p className="eyebrow">{rematch ? 'Title rematch' : `Next fight · ${levelNumber} of ${LEVELS.length}`}</p>
              <h2>{opponent.name}</h2>
              <p>{opponent.title}</p>
              <p className={`outlook ${outlook}`} data-testid="outlook">
                {outlook === 'favored' ? 'You are favored' : outlook === 'even' ? 'Close fight' : 'Underdog'}
              </p>
            </div>
          </div>
          <dl className="mini-stats">
            <div><dt>Health</dt><dd>{opponent.hp}</dd></div>
            <div><dt>Power</dt><dd>{opponent.power}</dd></div>
            <div><dt>Armor</dt><dd>{opponent.armor}</dd></div>
            <div><dt>Speed</dt><dd>{opponent.speed}</dd></div>
            <div><dt>Smarts</dt><dd>{opponent.intellect}</dd></div>
          </dl>
          <p className="compare">
            Your best weapon hits for about {yourHit}. Theirs hits for about {theirHit}. Your smarts are {stats.intellect}. Theirs are {opponent.intellect}.
          </p>
          <p className="reward">Win pays <strong>{opponent.reward} money</strong></p>
          <p className="fine">{outlookCopy(outlook)}</p>
        </section>
      </div>
    </div>
  )
}

function Meter({ label, value, max, testId }: { label: string; value: number; max: number; testId: string }) {
  const width = max <= 0 ? 0 : Math.min(100, (value / max) * 100)
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="meter-track"><div style={{ width: `${width}%` }} /></div>
      <strong data-testid={testId}>{value}</strong>
    </div>
  )
}

function HpBar({ hp, max, enemy }: { hp: number; max: number; enemy: boolean }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (hp / max) * 100))
  const tone = pct > 50 ? 'ok' : pct > 25 ? 'mid' : 'low'
  return (
    <div className="hp">
      <div className={`hp-fill ${tone} ${enemy ? 'enemy-hp' : ''}`} style={{ width: `${pct}%` }} />
      <span>{Math.max(0, hp)}/{max}</span>
    </div>
  )
}

function ResultCard({ match }: { match: Match }) {
  const win = match.winner === 'player'
  const next = !match.rematch && match.levelNumber < LEVELS.length ? LEVELS[match.levelNumber].name : null
  let detail = 'Rivet is down. Repair what broke, or sell a part and buy a stronger one.'
  if (win && match.crowned) detail = 'Rivet owns the ring. The parts took a beating. Check them before the rematch.'
  else if (win && next) detail = `${next} is next. Repair worn parts before you deploy.`
  return (
    <div className="result" data-testid="result" role="status">
      <p className="eyebrow">{match.rematch ? 'Rematch' : `Level ${match.levelNumber}`}</p>
      <h2>{win ? 'You win' : 'You lose'}</h2>
      <p className={`payout ${win ? 'gain' : 'loss'}`}>{win ? `+${match.reward} money` : 'No money this time'}</p>
      <p>{detail}</p>
    </div>
  )
}

export default App
