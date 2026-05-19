/*
 * src/data/characters.ts
 * Factory functions for all Chapter 1 unit stat blocks in Petr-FE-Like.
 *
 * Each factory returns a fresh Unit instance with a unique id string.
 *
 * Unit roster:
 *   Player units — Eirika (LORD), Tana, Vanessa, Syrene (PEGASUS_KNIGHTs)
 *   Enemy units  — EnemySoldier, Gorgon, WeakGorgon, StrongGorgon, DarkMage
 *   Special      — TheHand (PURSUER, effectively unkillable, isPursuer=true)
 *   NPCs         — Maya (well NPC), FleeingGirlWest, FleeingGirlEast
 *                  BreachGuard1, BreachGuard2 (inside stronghold, petrified on turn 5)
 *
 * Inventory format (CHANGE C — unified 5-slot inventory):
 *   Each unit carries InventoryItem[] (max 5). Weapons are WeaponItem { kind:'weapon', data }.
 *   Consumables are ConsumableItem { kind:'consumable', name, uses, maxUses, effect }.
 *   equippedSlot is the index of the active weapon in inventory.
 *
 *   Eirika:  [Rapier (weapon), Vulnerary (consumable, heal 10, 3 uses)]
 *   Others:  [their weapon]
 *   NPC/enemies with no weapons: []
 *
 * Shared consumable exports:
 *   VULNERARY    — heal 10 HP, 3 uses
 *   AMBER_SHARD  — stoResBoost 5, 1 use
 *
 * Growth rates (CHANGE B):
 *   Eirika:  hp70 str45 mag30 skl55 spd60 lck60 def35 res30
 *   Tana:    hp65 str55 mag20 skl50 spd65 lck50 def40 res35
 *   Vanessa: hp60 str50 mag15 skl55 spd60 lck45 def45 res30
 *   Syrene:  hp55 str45 mag20 skl60 spd55 lck40 def50 res35
 *
 * Stat tuning (CHANGE F):
 *   Vanessa: spd 10 (+2), lck 7 (+3), def 7 (+1)
 *   Syrene:  spd 11 (+2), lck 8 (+3), def 8 (+1)
 *
 * STO-RES rebalancing (CHANGE L):
 *   Stone Gaze damage formula: max(1, gaze.might - floor(unit.res / 2))
 *   Gorgon Stone Gaze might 5; tuned so regular Gorgon petrifies in 2–3 hits:
 *   Eirika:        maxStoRes 10 (RES 3 → 4 dmg/hit → 3 hits)
 *   Tana:          maxStoRes  8 (RES 4 → 3 dmg/hit → 3 hits)
 *   Vanessa:       maxStoRes  8 (RES 5 → 3 dmg/hit → 3 hits)
 *   Syrene:        maxStoRes  6 (RES 6 → 2 dmg/hit → 3 hits)
 *   Maya NPC:      maxStoRes  4 (no RES → 1–2 hits)
 *   Fleeing NPCs:  maxStoRes  4
 *
 * Note: NPC guards carry Iron Lance for verisimilitude but cannot initiate combat.
 *       Gorgon has two weapons; equippedSlot 0 = Stone Gaze (GAZE), slot 1 = Shadowshot (DARK).
 *       WeakGorgon: id 'weak_gorgon', hp 4/maxHp 18 (heavily damaged), level 1.
 *       AuraTier values: TIER_S=3, TIER_A=2, TIER_B=1.
 *       Enemy units have stoRes 0 — they are immune to being petrified.
 *       Named player characters have isNamedCharacter=true (Eirika, Tana, Vanessa, Syrene).
 *       The Hand: isPursuer=true, stats all 999, auraTier TIER_S, class PURSUER.
 *
 * Guard stat block (CHANGE P):
 *   hp 15, str 4, skl 4, spd 4, lck 2, def 5, res 0, stoRes 6, movement 4, weapon Iron Lance
 *
 * Civilian stat block (CHANGE P):
 *   hp 8, spd 3, lck 2, def 1, stoRes 4 (all other stats 0)
 */

import { Unit, Team, UnitClass, AuraTier, WeaponType } from '../game/Unit';
import type { UnitStats, WeaponData, WeaponItem, ConsumableItem, GrowthRates } from '../game/Unit';

// ---------------------------------------------------------------------------
// Shared weapon definitions
// ---------------------------------------------------------------------------

const RAPIER: WeaponData = {
  name: 'Rapier', type: WeaponType.SWORD, might: 5, hit: 90, minRange: 1, maxRange: 1, weight: 2,
};

const IRON_LANCE: WeaponData = {
  name: 'Iron Lance', type: WeaponType.LANCE, might: 8, hit: 80, minRange: 1, maxRange: 1, weight: 8,
};

const STEEL_LANCE: WeaponData = {
  name: 'Steel Lance', type: WeaponType.LANCE, might: 10, hit: 75, minRange: 1, maxRange: 1, weight: 11,
};

const STONE_GAZE: WeaponData = {
  name: 'Stone Gaze', type: WeaponType.GAZE, might: 5, hit: 70, minRange: 1, maxRange: 3, weight: 0,
};

const SHADOWSHOT: WeaponData = {
  name: 'Shadowshot', type: WeaponType.DARK, might: 8, hit: 75, minRange: 1, maxRange: 3, weight: 5,
};

const STRONG_STONE_GAZE: WeaponData = {
  name: 'Stone Gaze', type: WeaponType.GAZE, might: 7, hit: 75, minRange: 1, maxRange: 3, weight: 0,
};

const STRONG_SHADOWSHOT: WeaponData = {
  name: 'Shadowshot', type: WeaponType.DARK, might: 10, hit: 80, minRange: 1, maxRange: 3, weight: 5,
};

const FLUX: WeaponData = {
  name: 'Flux', type: WeaponType.DARK, might: 7, hit: 80, minRange: 1, maxRange: 2, weight: 8,
};

// ---------------------------------------------------------------------------
// CHANGE C: Shared consumable item definitions (exported for use in triggers)
// ---------------------------------------------------------------------------

export const VULNERARY: ConsumableItem = {
  kind:    'consumable',
  name:    'Vulnerary',
  uses:    3,
  maxUses: 3,
  effect:  { type: 'heal', amount: 10 },
};

export const AMBER_SHARD: ConsumableItem = {
  kind:    'consumable',
  name:    'Amber Shard',
  uses:    1,
  maxUses: 1,
  effect:  { type: 'stoResBoost', amount: 5 },
};

// Helper: wrap a weapon into a WeaponItem inventory slot
function weaponSlot(data: WeaponData): WeaponItem {
  return { kind: 'weapon', data };
}

// Helper: clone a consumable (to avoid shared state between units)
function cloneConsumable(item: ConsumableItem): ConsumableItem {
  return { ...item };
}

// ---------------------------------------------------------------------------
// Player unit factories
// ---------------------------------------------------------------------------

export function createEirika(): Unit {
  const stats: UnitStats = {
    hp: 18, maxHp: 18,
    str: 5, mag: 1, skl: 7, spd: 8, lck: 5, def: 4, res: 3,
    stoRes: 10, maxStoRes: 10,  // CHANGE L: rebalanced (4 dmg/hit → 3 hits)
  };
  const growthRates: GrowthRates = {
    hp: 70, str: 45, mag: 30, skl: 55, spd: 60, lck: 60, def: 35, res: 30,
  };
  const unit = new Unit(
    'eirika', 'Eirika', Team.PLAYER, UnitClass.LORD, stats,
    [weaponSlot(RAPIER), cloneConsumable(VULNERARY)],
    5, false, AuraTier.TIER_S,
  );
  unit.isNamedCharacter = true;
  unit.growthRates      = growthRates;
  return unit;
}

export function createTana(): Unit {
  const stats: UnitStats = {
    hp: 17, maxHp: 17,
    str: 6, mag: 1, skl: 6, spd: 9, lck: 6, def: 5, res: 4,
    stoRes: 8, maxStoRes: 8,  // CHANGE L: rebalanced (3 dmg/hit → 3 hits)
  };
  const growthRates: GrowthRates = {
    hp: 65, str: 55, mag: 20, skl: 50, spd: 65, lck: 50, def: 40, res: 35,
  };
  const unit = new Unit(
    'tana', 'Tana', Team.PLAYER, UnitClass.PEGASUS_KNIGHT, stats,
    [weaponSlot(IRON_LANCE)],
    7, true, AuraTier.TIER_A,
  );
  unit.isNamedCharacter = true;
  unit.growthRates      = growthRates;
  return unit;
}

export function createVanessa(): Unit {
  // CHANGE F: spd 10 (+2), lck 7 (+3), def 7 (+1)
  const stats: UnitStats = {
    hp: 20, maxHp: 20,
    str: 7, mag: 1, skl: 7, spd: 10, lck: 7, def: 7, res: 5,
    stoRes: 8, maxStoRes: 8,  // CHANGE L: rebalanced (3 dmg/hit → 3 hits)
  };
  const growthRates: GrowthRates = {
    hp: 60, str: 50, mag: 15, skl: 55, spd: 60, lck: 45, def: 45, res: 30,
  };
  const unit = new Unit(
    'vanessa', 'Vanessa', Team.PLAYER, UnitClass.PEGASUS_KNIGHT, stats,
    [weaponSlot(IRON_LANCE)],
    7, true, AuraTier.TIER_A,
  );
  unit.isNamedCharacter = true;
  unit.growthRates      = growthRates;
  return unit;
}

export function createSyrene(): Unit {
  // CHANGE F: spd 11 (+2), lck 8 (+3), def 8 (+1)
  const stats: UnitStats = {
    hp: 23, maxHp: 23,
    str: 8, mag: 2, skl: 9, spd: 11, lck: 8, def: 8, res: 6,
    stoRes: 6, maxStoRes: 6,  // CHANGE L: rebalanced (2 dmg/hit → 3 hits)
  };
  const growthRates: GrowthRates = {
    hp: 55, str: 45, mag: 20, skl: 60, spd: 55, lck: 40, def: 50, res: 35,
  };
  const unit = new Unit(
    'syrene', 'Syrene', Team.PLAYER, UnitClass.PEGASUS_KNIGHT, stats,
    [weaponSlot(STEEL_LANCE)],
    7, true, AuraTier.TIER_B,
  );
  unit.isNamedCharacter = true;
  unit.growthRates      = growthRates;
  return unit;
}

// ---------------------------------------------------------------------------
// Enemy unit factories
// ---------------------------------------------------------------------------

export function createEnemySoldier(index: number): Unit {
  const stats: UnitStats = {
    hp: 20, maxHp: 20,
    str: 7, mag: 0, skl: 5, spd: 5, lck: 2, def: 5, res: 0,
    stoRes: 0, maxStoRes: 0,
  };
  return new Unit(
    `soldier_${index}`,
    'Soldier',
    Team.ENEMY,
    UnitClass.SOLDIER,
    stats,
    [weaponSlot(IRON_LANCE)],
    5,
    false,
    AuraTier.TIER_B,
  );
}

export function createGorgon(index: number): Unit {
  const stats: UnitStats = {
    hp: 18, maxHp: 18,
    str: 0, mag: 8, skl: 8, spd: 6, lck: 4, def: 4, res: 8,
    stoRes: 0, maxStoRes: 0,
  };
  return new Unit(
    `gorgon_${index}`,
    'Gorgon',
    Team.ENEMY,
    UnitClass.GORGON,
    stats,
    [weaponSlot(STONE_GAZE), weaponSlot(SHADOWSHOT)],
    5,
    false,
    AuraTier.TIER_A,
  );
}

export function createStrongGorgon(index: number): Unit {
  const stats: UnitStats = {
    hp: 24, maxHp: 24,
    str: 0, mag: 10, skl: 10, spd: 7, lck: 4, def: 4, res: 8,
    stoRes: 0, maxStoRes: 0,
  };
  return new Unit(
    `strong_gorgon_${index}`,
    'Gorgon+',
    Team.ENEMY,
    UnitClass.GORGON,
    stats,
    [weaponSlot(STRONG_STONE_GAZE), weaponSlot(STRONG_SHADOWSHOT)],
    5,
    false,
    AuraTier.TIER_A,
  );
}

/**
 * CHANGE L: Weak Gorgon — tutorial enemy placed at (4,11) in the stronghold SW.
 * Already heavily damaged (hp 4 / maxHp 18, level 1). Same weapons as Gorgon.
 * Uses normal enemy AI (move toward nearest player, attack).
 */
export function createWeakGorgon(): Unit {
  const stats: UnitStats = {
    hp: 4, maxHp: 18,
    str: 0, mag: 8, skl: 8, spd: 6, lck: 4, def: 4, res: 8,
    stoRes: 0, maxStoRes: 0,
  };
  return new Unit(
    'weak_gorgon',
    'Gorgon',
    Team.ENEMY,
    UnitClass.GORGON,
    stats,
    [weaponSlot(STONE_GAZE), weaponSlot(SHADOWSHOT)],
    1,
    false,
    AuraTier.TIER_B,
  );
}

export function createDarkMage(index: number): Unit {
  const stats: UnitStats = {
    hp: 20, maxHp: 20,
    str: 0, mag: 9, skl: 7, spd: 6, lck: 3, def: 3, res: 5,
    stoRes: 0, maxStoRes: 0,
  };
  return new Unit(
    `dark_mage_${index}`,
    'Dark Mage',
    Team.ENEMY,
    UnitClass.MAGE,
    stats,
    [weaponSlot(FLUX)],
    5,
    false,
    AuraTier.TIER_B,
  );
}

/**
 * Creates The Hand — an unkillable pursuer that petrifies units adjacent to her
 * after each move. Spawns at (9,13) on turn 5.
 *
 * Special properties:
 *   isPursuer = true         — handled by getPursuerAction() in AI.ts
 *   isCollecting = false     — set to true when she spends a turn capturing a named unit
 *   stats all 999            — effectively unkillable; 0 dmg if attacked
 *   stoRes/maxStoRes = 0     — she cannot be petrified herself
 *   auraTier = TIER_S        — her captured victims emit powerful auras
 */
export function createTheHand(): Unit {
  const stats: UnitStats = {
    hp: 999, maxHp: 999,
    str: 999, mag: 999, skl: 999, spd: 999, lck: 999, def: 999, res: 999,
    stoRes: 0, maxStoRes: 0,
  };
  const unit = new Unit(
    'the_hand',
    'The Hand',
    Team.ENEMY,
    UnitClass.PURSUER,
    stats,
    [],
    5,
    false,
    AuraTier.TIER_S,
  );
  unit.isPursuer    = true;
  unit.isCollecting = false;
  return unit;
}

// ---------------------------------------------------------------------------
// NPC factories
// ---------------------------------------------------------------------------

// CHANGE P: civilian stat block — non-zero stats for verisimilitude
const CIVILIAN_STATS: UnitStats = {
  hp: 8, maxHp: 8,
  str: 0, mag: 0, skl: 0, spd: 3, lck: 2, def: 1, res: 0,
  stoRes: 4, maxStoRes: 4,
};

export function createMaya(): Unit {
  return new Unit('maya', 'Maya', Team.NPC, UnitClass.NPC_CIVILIAN, { ...CIVILIAN_STATS }, [], 4, false, AuraTier.TIER_B);
}

export function createFleeingGirlWest(): Unit {
  return new Unit('fleeing_west', 'Girl (W)', Team.NPC, UnitClass.NPC_CIVILIAN, { ...CIVILIAN_STATS }, [], 4, false, AuraTier.TIER_B);
}

export function createFleeingGirlEast(): Unit {
  return new Unit('fleeing_east', 'Girl (E)', Team.NPC, UnitClass.NPC_CIVILIAN, { ...CIVILIAN_STATS }, [], 4, false, AuraTier.TIER_B);
}

/** CHANGE K / CHANGE P: Breach guards — placed inside the stronghold at (8,12) and (10,12).
 *  Proper guard stat block with Iron Lance (weapon carried for verisimilitude; NPC cannot attack). */
export function createBreachGuard(index: number): Unit {
  const stats: UnitStats = {
    hp: 15, maxHp: 15,
    str: 4, mag: 0, skl: 4, spd: 4, lck: 2, def: 5, res: 0,
    stoRes: 6, maxStoRes: 6,
  };
  return new Unit(
    `guard_breach_${index}`,
    `Guard ${index}`,
    Team.NPC,
    UnitClass.NPC_CIVILIAN,
    stats,
    [weaponSlot(IRON_LANCE)],
    4,
    false,
    AuraTier.TIER_B,
  );
}
