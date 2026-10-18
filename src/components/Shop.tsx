import { useState } from 'react'
import type { Save } from '../game'
import {
  PART_KINDS,
  catalog,
  isInstalled,
  partByUid,
  partsOf,
  sellValue,
  type PartKind,
} from '../parts'

export function Shop({ save, onBuy, onSell }: { save: Save; onBuy: (id: string) => void; onSell: (uid: string) => void }) {
  const [kind, setKind] = useState<PartKind>('processor')
  const hint = PART_KINDS.find((item) => item.id === kind)?.hint
  return (
    <section className="shop" data-testid="shop">
      <h2>Part shop</h2>
      <p className="fine">Buy parts here, then drag them onto Rivet on the build bench. Selling returns 75% of the price. Repairs are free until a part dies.</p>
      <div className="tab-row" role="tablist">
        {PART_KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className={item.id === kind ? 'tab on' : 'tab'}
            data-testid={`tab-${item.id}`}
            onClick={() => setKind(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="fine">{hint}</p>
      <div className="catalog">
        {partsOf(kind).map((item) => {
          const owned = save.parts.filter((part) => part.id === item.id)
          const canBuy = save.money >= item.price
          return (
            <article key={item.id} className="part-card">
              <header>
                <h3>{item.name}</h3>
                <p>{item.blurb}</p>
              </header>
              <p className="stat-line">{statLine(item.id)}</p>
              <p className="owned">Owned {owned.length}</p>
              <button
                type="button"
                className={canBuy ? 'buy can-afford' : 'buy'}
                data-testid={`buy-${item.id}`}
                disabled={!canBuy}
                onClick={() => onBuy(item.id)}
              >
                Buy · {item.price}
              </button>
              {owned.map((part) => {
                const installed = isInstalled(save.assembly, part.uid)
                return (
                  <div key={part.uid} className="owned-row">
                    <span className="dur" aria-hidden="true">
                      <i style={{ width: `${part.durability}%` }} />
                    </span>
                    <span>{part.durability}%</span>
                    {installed ? (
                      <em>On Rivet</em>
                    ) : (
                      <button type="button" className="ghost tiny" data-testid={`sell-${part.uid}`} onClick={() => onSell(part.uid)}>
                        Sell · {sellValue(catalog(part.id).price)}
                      </button>
                    )}
                  </div>
                )
              })}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function statLine(id: string): string {
  const item = catalog(id)
  const bits: string[] = []
  if (item.slots) bits.push(`${item.slots} weapon ports`)
  if (item.power) bits.push(`+${item.power} power`)
  if (item.hp) bits.push(`+${item.hp} health`)
  if (item.armor) bits.push(`+${item.armor} armor`)
  if (item.speed) bits.push(`+${item.speed} speed`)
  if (item.intellect) bits.push(`+${item.intellect} intelligence`)
  return bits.join(' · ')
}

export function ownedName(save: Save, uid: string | null): string {
  const part = partByUid(save.parts, uid)
  return part ? catalog(part.id).name : 'Empty'
}
