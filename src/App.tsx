import { useEffect, useRef, useState } from 'react'
import { RobotFigure } from './components/RobotFigure'
import {
  LEVELS,
  SAVE_KEY,
  UPGRADE_LIST,
  applyWin,
  buyUpgrade,
  currentOpponent,
  dodgeChance,
  expectedHit,
  forecast,
  loadSave,
  playerStats,
  resolveFight,
  sellUpgrade,
  starterSave,
  strikesFirst,
  upgradeCost,
  upgradeMax,
  type Action,
  type Fighter,
  type LevelDef,
  type Outlook,
  type RobotKind,
  type Save,
  type UpgradeId,
} from './game'
import { playBuy, playDodge, playDown, playHit, playLose, playWin, unlockAudio } from './sound'

type Phase = 'garage' | 'fight' | 'result'

type Match = {
  player: Fighter
  enemy: Fighter
  enemyKind: Exclude<RobotKind, 'player'>
  reward: number
  levelNumber: number
  rematch: boolean
  crowned: boolean
  actions: Action[]
  winner: 'player' | 'enemy'
}

const MUTE_KEY = 'scrap-ring-muted'

function outlookCopy(outlook: Outlook): string {
  if (outlook === 'favored') return 'Rivet can take this fight.'
  if (outlook === 'even') return 'This one is close. An upgrade could decide it.'
  return 'This bot is ahead. Buy an upgrade before you deploy.'
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
  const [phase, setPhase] = useState<Phase>('garage')
  const [match, setMatch] = useState<Match | null>(null)
  const [step, setStep] = useState(0)
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === '1')
  const [resetArmed, setResetArmed] = useState(false)
  const ringRef = useRef<HTMLDivElement>(null)
  const mutedRef = useRef(muted)
  const paidMatch = useRef<Match | null>(null)
  mutedRef.current = muted

  const stats = playerStats(save.upgrades)
  const opponent = currentOpponent(save.nextLevel)
  const outlook = forecast(stats, opponent.level)
  const totalRanks = UPGRADE_LIST.reduce((sum, upgrade) => sum + save.upgrades[upgrade.id], 0)

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
      if (match.winner === 'player' && paidMatch.current !== match) {
        paidMatch.current = match
        setSave((prev) => applyWin(prev, match.reward))
        if (!mutedRef.current) playWin()
      } else if (match.winner === 'enemy' && !mutedRef.current) {
        playLose()
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
    unlockAudio()
    const foe = currentOpponent(save.nextLevel)
    const player: Fighter = { ...playerStats(save.upgrades), name: 'Rivet' }
    const enemy: Fighter = {
      name: foe.level.name,
      hp: foe.level.hp,
      attack: foe.level.attack,
      armor: foe.level.armor,
      speed: foe.level.speed,
    }
    const result = resolveFight(player, enemy, Math.random)
    setMatch({
      player,
      enemy,
      enemyKind: foe.level.kind,
      reward: foe.level.reward,
      levelNumber: foe.number,
      rematch: foe.rematch,
      crowned: !foe.rematch && foe.index === LEVELS.length - 1,
      actions: result.actions,
      winner: result.winner,
    })
    setStep(0)
    setPhase('fight')
  }

  function leave() {
    setPhase('garage')
    setMatch(null)
    setStep(0)
  }

  function skip() {
    if (!match) return
    setStep(match.actions.length)
  }

  function toggleMute() {
    setMuted((current) => {
      const next = !current
      localStorage.setItem(MUTE_KEY, next ? '1' : '0')
      if (!next) unlockAudio()
      return next
    })
  }

  function askReset() {
    if (!resetArmed) {
      setResetArmed(true)
      window.setTimeout(() => setResetArmed(false), 2600)
      return
    }
    setSave(starterSave())
    setPhase('garage')
    setMatch(null)
    setStep(0)
    setResetArmed(false)
  }

  function buy(id: UpgradeId) {
    unlockAudio()
    if (!muted) playBuy()
    setSave((current) => buyUpgrade(current, id))
  }

  function sell(id: UpgradeId) {
    setSave((current) => sellUpgrade(current, id))
  }

  const shown = match && step > 0 ? match.actions[step - 1] : undefined
  const playerHp = shown ? shown.playerHp : (match?.player.hp ?? stats.hp)
  const enemyHp = shown ? shown.enemyHp : (match?.enemy.hp ?? opponent.level.hp)
  const finished = phase === 'result'

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Robot pit</p>
          <h1>Scrap Ring</h1>
        </div>
        <div className="top-meta">
          <p className="level-chip" data-testid="level">
            {phase === 'garage'
              ? opponent.rematch
                ? 'Champion rematch'
                : `Level ${opponent.number} of ${LEVELS.length}`
              : match?.rematch
                ? 'Champion rematch'
                : `Level ${match?.levelNumber ?? opponent.number} of ${LEVELS.length}`}
          </p>
          <p className="money" data-testid="money">
            <span>Money</span>
            <strong>{save.money}</strong>
          </p>
          <button type="button" className="ghost" onClick={toggleMute}>
            {muted ? 'Sound off' : 'Sound on'}
          </button>
          <button type="button" className="ghost" onClick={askReset}>
            {resetArmed ? 'Tap again to reset' : 'Reset'}
          </button>
        </div>
      </header>

      <main>
        {phase === 'garage' ? (
          <Garage
            save={save}
            statsHp={stats.hp}
            statsAttack={stats.attack}
            statsArmor={stats.armor}
            statsSpeed={stats.speed}
            totalRanks={totalRanks}
            opponent={opponent.level}
            levelNumber={opponent.number}
            rematch={opponent.rematch}
            outlook={outlook}
            onBuy={buy}
            onSell={sell}
          />
        ) : match ? (
          <section className="fight">
            <div className="ring" ref={ringRef}>
              <p className="watermark">{String(match.levelNumber).padStart(2, '0')}</p>
              {phase === 'fight' && shown?.kind === 'hit' && <span key={shown.id} className="spark" />}
              {phase === 'fight' && shown && (
                <b
                  key={`float-${shown.id}`}
                  className={`floater ${shown.attacker === 'player' ? 'on-enemy' : 'on-player'} ${shown.kind === 'dodge' ? 'miss' : ''}`}
                >
                  {shown.kind === 'dodge' ? 'Dodge' : `-${shown.damage}`}
                </b>
              )}
              <FighterSlot
                side="player"
                name="Rivet"
                hp={playerHp}
                max={match.player.hp}
                pose={poseFor('player', shown, playerHp, finished)}
                kind="player"
                upgrades={save.upgrades}
              />
              <FighterSlot
                side="enemy"
                name={match.enemy.name}
                hp={enemyHp}
                max={match.enemy.hp}
                pose={poseFor('enemy', shown, enemyHp, finished)}
                kind={match.enemyKind}
              />
            </div>
            {phase === 'result' && <ResultCard match={match} nextName={nextOpponentName(match)} />}
            <div className="log" aria-live="polite" data-testid="log">
              {step === 0 && <p>The bell is about to ring.</p>}
              {match.actions.slice(0, step).slice(-3).map((action) => (
                <p key={action.id} className={action.id === step ? 'latest' : ''}>
                  {action.line}
                </p>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="dock">
        {phase === 'garage' && (
          <button type="button" className="deploy" data-testid="deploy" onClick={deploy}>
            <span>{opponent.rematch ? 'Defend your title' : 'Deploy into the ring'}</span>
            <small>
              {opponent.rematch ? 'Rematch' : `Fight ${opponent.number}`} · {opponent.level.name} · win {opponent.level.reward} money
            </small>
          </button>
        )}
        {phase === 'fight' && (
          <div className="fight-actions">
            <button type="button" className="deploy slim" onClick={skip}>
              Skip fight
            </button>
            <button type="button" className="ghost wide" onClick={leave}>
              Forfeit
            </button>
          </div>
        )}
        {phase === 'result' && (
          <button type="button" className="deploy" data-testid="continue" onClick={leave}>
            Back to the garage
          </button>
        )}
      </footer>
    </div>
  )
}

function nextOpponentName(match: Match): string | null {
  if (match.rematch || match.levelNumber >= LEVELS.length) return null
  return LEVELS[match.levelNumber].name
}

function Garage({
  save,
  statsHp,
  statsAttack,
  statsArmor,
  statsSpeed,
  totalRanks,
  opponent,
  levelNumber,
  rematch,
  outlook,
  onBuy,
  onSell,
}: {
  save: Save
  statsHp: number
  statsAttack: number
  statsArmor: number
  statsSpeed: number
  totalRanks: number
  opponent: LevelDef
  levelNumber: number
  rematch: boolean
  outlook: Outlook
  onBuy: (id: UpgradeId) => void
  onSell: (id: UpgradeId) => void
}) {
  const yourHit = expectedHit(statsAttack, opponent.armor)
  const theirHit = expectedHit(opponent.attack, statsArmor)
  const yourDodge = Math.round(dodgeChance(opponent.speed, statsSpeed) * 100)
  const theirDodge = Math.round(dodgeChance(statsSpeed, opponent.speed) * 100)
  const first = strikesFirst(statsSpeed, opponent.speed)

  return (
    <div className="garage">
      {save.nextLevel === 0 && (
        <ol className="primer">
          <li>You start with one simple robot, Rivet.</li>
          <li>Deploy into the ring and fight the other robot.</li>
          <li>Beat it to earn money, upgrade, then take the next level.</li>
        </ol>
      )}

      <ol className="ladder">
        {LEVELS.map((level, index) => {
          const state = index < save.nextLevel ? 'done' : index === save.nextLevel ? 'now' : 'locked'
          return (
            <li key={level.name} className={state}>
              <span>{index < save.nextLevel ? '✓' : index + 1}</span>
              {level.name}
            </li>
          )
        })}
      </ol>

      <div className="garage-grid">
        <section className="panel bay">
          <div className="bay-stage">
            <RobotFigure kind="player" upgrades={save.upgrades} />
          </div>
          <div className="bay-copy">
            <h2>Rivet</h2>
            <p>{totalRanks === 0 ? 'Plain starter frame' : `Upgraded frame · ${totalRanks} parts`}</p>
          </div>
          <div className="meters">
            <Meter label="Health" value={statsHp} max={120} testId="stat-hp" />
            <Meter label="Attack" value={statsAttack} max={28} testId="stat-attack" />
            <Meter label="Armor" value={statsArmor} max={12} testId="stat-armor" />
            <Meter label="Speed" value={statsSpeed} max={16} testId="stat-speed" />
          </div>
          <p className="fine">A hit deals Attack minus Armor, and at least 1. Faster bots strike first and can dodge.</p>
        </section>

        <div className="shop-col">
          <section className="panel opponent">
            <div className="opponent-head">
              <div className="preview">
                <RobotFigure kind={opponent.kind} />
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
              <div><dt>Attack</dt><dd>{opponent.attack}</dd></div>
              <div><dt>Armor</dt><dd>{opponent.armor}</dd></div>
              <div><dt>Speed</dt><dd>{opponent.speed}</dd></div>
            </dl>
            <p className="compare">
              {first === 'player' ? 'You strike first.' : 'They strike first.'} Your hit is about {yourHit}. Theirs is about {theirHit}.
              {yourDodge > 0 ? ` You dodge about ${yourDodge}% of hits.` : ''}
              {theirDodge > 0 ? ` They dodge about ${theirDodge}% of hits.` : ''}
            </p>
            <p className="reward">Win pays <strong>{opponent.reward} money</strong></p>
            <p className="fine">{outlookCopy(outlook)}</p>
          </section>

          <section className="upgrades">
            <h2>Upgrades</h2>
            <div className="upgrade-grid">
              {UPGRADE_LIST.map((upgrade) => {
                const rank = save.upgrades[upgrade.id]
                const maxed = rank >= upgrade.max
                const cost = upgradeCost(upgrade.id, rank)
                const refund = rank > 0 ? upgradeCost(upgrade.id, rank - 1) : 0
                const canBuy = !maxed && save.money >= cost
                return (
                  <article key={upgrade.id} className="upgrade">
                    <header>
                      <h3>{upgrade.name}</h3>
                      <p>{upgrade.detail}</p>
                    </header>
                    <p className="owned">
                      Owned {rank}/{upgradeMax(upgrade.id)}
                    </p>
                    <div className="upgrade-actions">
                      <button
                        type="button"
                        data-testid={`buy-${upgrade.id}`}
                        disabled={!canBuy}
                        onClick={() => onBuy(upgrade.id)}
                      >
                        {maxed ? 'Maxed' : `Buy · ${cost}`}
                      </button>
                      {rank > 0 && (
                        <button type="button" className="ghost" onClick={() => onSell(upgrade.id)}>
                          Sell · {refund}
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Meter({ label, value, max, testId }: { label: string; value: number; max: number; testId: string }) {
  const width = Math.min(100, (value / max) * 100)
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="meter-track">
        <div style={{ width: `${width}%` }} />
      </div>
      <strong data-testid={testId}>{value}</strong>
    </div>
  )
}

function FighterSlot({
  side,
  name,
  hp,
  max,
  pose,
  kind,
  upgrades,
}: {
  side: 'player' | 'enemy'
  name: string
  hp: number
  max: number
  pose: string
  kind: RobotKind
  upgrades?: Save['upgrades']
}) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100))
  const tone = pct > 50 ? 'ok' : pct > 25 ? 'mid' : 'low'
  return (
    <div className={`fighter ${side}`}>
      <div className="hp">
        <div className={`hp-fill ${tone}`} style={{ width: `${pct}%` }} />
        <span>
          {Math.max(0, hp)}/{max}
        </span>
      </div>
      <div className={`pose ${pose}`}>
        <div className={side === 'enemy' ? 'flip' : undefined}>
          <RobotFigure kind={kind} upgrades={upgrades} />
        </div>
      </div>
      <p className="fighter-name">{name}</p>
    </div>
  )
}

function ResultCard({ match, nextName }: { match: Match; nextName: string | null }) {
  const win = match.winner === 'player'
  let detail = 'Rivet is down. Upgrade, sell a part, or deploy again.'
  if (win && match.crowned) detail = 'Rivet owns the ring. Defend the title whenever you want more money.'
  else if (win && match.rematch) detail = 'Title defended. The money is yours.'
  else if (win && nextName) detail = `${nextName} is next. Upgrade Rivet before you deploy.`

  return (
    <div className="result" data-testid="result" role="status">
      {win && match.crowned && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => (
            <i
              key={index}
              style={{
                left: `${(index * 17) % 100}%`,
                animationDelay: `${(index % 5) * 0.08}s`,
                background: index % 2 === 0 ? '#ffb020' : '#7dfff2',
              }}
            />
          ))}
        </div>
      )}
      <p className="eyebrow">{match.rematch ? 'Rematch' : `Level ${match.levelNumber}`}</p>
      <h2 id="result-title">{win ? 'You win' : 'You lose'}</h2>
      <p className={`payout ${win ? 'gain' : 'loss'}`}>{win ? `+${match.reward} money` : 'No money this time'}</p>
      <p>{detail}</p>
    </div>
  )
}

export default App
