# Scrap Ring

## Name

Scrap Ring

## One sentence

Deploy your starter robot, Rivet, into the ring, beat the other robot, and spend the money on upgrades before the next level.

## What the player does over and over

Check the next opponent, buy upgrades with money from wins, then deploy Rivet into the ring.

## Why come back

There are six fights. Each win unlocks a harder robot and pays money. Rivet starts as one plain frame and visibly grows as you bolt on parts.

## First version

- One robot, Rivet, with health, attack, armor, and speed.
- Deploy into the ring and watch the fight.
- Win to earn money and unlock the next level. Lose and you stay on that level.
- Before each fight, spend money on hull, punch, armor, or speed. Sell a part back if you want the money.

## Later ideas

- A second robot to choose from
- Special moves during the fight
- A tournament bracket after the pit

## Already working

- Garage, six-level ladder, and champion rematch.
- Turn-by-turn fights with dodge, damage, and a skip button.
- Upgrades paid for with money from finished levels.
- Progress saved in the browser.

## Next build

One special move Rivet can fire once per fight.

## Decisions

- Only one robot. Upgrades change that robot. They do not add a roster.
- Levels are linear. You fight the current opponent, then the next.
- Money comes from winning. A loss pays nothing.
- Rivet is fully repaired at the start of every fight.
- A hit is attack minus armor, at least 1. Faster robots strike first and can dodge slower ones.
- Selling an upgrade refunds what that rank cost, so a bad build is not a trap.
