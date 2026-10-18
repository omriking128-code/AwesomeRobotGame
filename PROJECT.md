# Scrap Ring

## Name

Scrap Ring

## One sentence

Build Rivet from shop parts, wire the robot together, and spend winnings on better parts and repairs.

## What the player does over and over

Check the next opponent, buy parts, build or repair Rivet, then deploy into the ring.

## Why come back

There are twenty fights. Each win unlocks a harder robot and pays money. Rivet starts as one plain frame and visibly grows as you bolt on parts.

## First version

- Rivet is built from a processor, weapons, wheels, material, an OS, and an optional GPU.
- The processor sets speed, intelligence, and how many weapons can be wired, from 2 up to 12.
- Intelligence raises the chance to hit and to dodge, and a smarter processor picks the better weapon.
- Each weapon has its own animation and its own way of dealing damage.
- Win to earn money and unlock the next level. Lose and you stay on that level.
- Parts wear out. Each kind has its own repair. A dead part must be replaced.
- Selling a part returns 75% of the price.

## Later ideas

- A second robot to choose from
- Special moves during the fight
- A tournament bracket after the pit

## Already working

- Garage, twenty-level ladder, and champion rematch.
- Turn-by-turn fights with dodge, damage, and a skip button.
- Parts shop, build bench, and a repair method for every kind of part.
- Progress saved in the browser.

## Next build

Nothing queued. The parts bench is the current game.

## Decisions

- Only one robot. Parts change that robot. They do not add a roster.
- Levels are linear. You fight the current opponent, then the next.
- Money comes from winning. A loss pays nothing.
- Rivet starts each fight at full health. Parts keep the wear from the last fight.
- A hit is power minus armor, at least 1. Some weapons ignore armor, burn, slow, or strike more than once.
- Faster robots strike first. Intelligence changes hit chance, dodge chance, and weapon choice.
- Selling a part returns 75% of what it cost. A dead part cannot be repaired. It has to be replaced.
