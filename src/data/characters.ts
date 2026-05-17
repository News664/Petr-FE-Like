/*
 * src/data/characters.ts
 * Factory functions for all Chapter 1 unit stat blocks in Petr-FE-Like.
 *
 * Each factory returns a fresh Unit instance with a unique id string.
 *
 * Unit roster:
 *   Player units — Eirika (LORD), Tana, Vanessa, Syrene (PEGASUS_KNIGHTs)
 *   Enemy units  — EnemySoldier, Gorgon, StrongGorgon, DarkMage
 *   NPCs         — Maya (well NPC), FleeingGirlWest, FleeingGirlEast
 *
 * Weapon data format (WeaponData):
 *   name, type (WeaponType), might, hit, minRange, maxRange, weight
 *
 * Note: NPC units have no weapons and cannot initiate or receive combat.
 *       Gorgon has two weapons; index 0 = Stone Gaze (GAZE), index 1 = Shadowshot (DARK).
 *       AuraTier values: TIER_S=3, TIER_A=2, TIER_B=1.
 *       Enemy units have stoRes 0 — they are immune to being petrified.
 */

import { Unit, Team, UnitClass, AuraTier, WeaponType } from '../game/Unit';
import type { UnitStats, WeaponData } from '../game/Unit';

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
// Player unit factories
// ---------------------------------------------------------------------------

export function createEirika(): Unit {
  const stats: UnitStats = {
    hp: 18, maxHp: 18,
    str: 5, mag: 1, skl: 7, spd: 8, lck: 5, def: 4, res: 3,
    stoRes: 20, maxStoRes: 20,
  };
  return new Unit('eirika', 'Eirika', Team.PLAYER, UnitClass.LORD, stats, [RAPIER], 5, false, AuraTier.TIER_S);
}

export function createTana(): Unit {
  const stats: UnitStats = {
    hp: 17, maxHp: 17,
    str: 6, mag: 1, skl: 6, spd: 9, lck: 6, def: 5, res: 4,
    stoRes: 18, maxStoRes: 18,
  };
  return new Unit('tana', 'Tana', Team.PLAYER, UnitClass.PEGASUS_KNIGHT, stats, [IRON_LANCE], 7, true, AuraTier.TIER_A);
}

export function createVanessa(): Unit {
  const stats: UnitStats = {
    hp: 20, maxHp: 20,
    str: 7, mag: 1, skl: 7, spd: 8, lck: 4, def: 6, res: 5,
    stoRes: 18, maxStoRes: 18,
  };
  return new Unit('vanessa', 'Vanessa', Team.PLAYER, UnitClass.PEGASUS_KNIGHT, stats, [IRON_LANCE], 7, true, AuraTier.TIER_A);
}

export function createSyrene(): Unit {
  const stats: UnitStats = {
    hp: 23, maxHp: 23,
    str: 8, mag: 2, skl: 9, spd: 9, lck: 5, def: 7, res: 6,
    stoRes: 16, maxStoRes: 16,
  };
  return new Unit('syrene', 'Syrene', Team.PLAYER, UnitClass.PEGASUS_KNIGHT, stats, [STEEL_LANCE], 7, true, AuraTier.TIER_B);
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
    [IRON_LANCE],
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
    [STONE_GAZE, SHADOWSHOT],
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
    [STRONG_STONE_GAZE, STRONG_SHADOWSHOT],
    5,
    false,
    AuraTier.TIER_A,
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
    [FLUX],
    5,
    false,
    AuraTier.TIER_B,
  );
}

// ---------------------------------------------------------------------------
// NPC factories
// ---------------------------------------------------------------------------

export function createMaya(): Unit {
  const stats: UnitStats = {
    hp: 10, maxHp: 10,
    str: 0, mag: 0, skl: 0, spd: 0, lck: 0, def: 0, res: 0,
    stoRes: 8, maxStoRes: 8,
  };
  return new Unit('maya', 'Maya', Team.NPC, UnitClass.NPC_CIVILIAN, stats, [], 4, false, AuraTier.TIER_B);
}

export function createFleeingGirlWest(): Unit {
  const stats: UnitStats = {
    hp: 10, maxHp: 10,
    str: 0, mag: 0, skl: 0, spd: 0, lck: 0, def: 0, res: 0,
    stoRes: 8, maxStoRes: 8,
  };
  return new Unit('fleeing_west', 'Girl (W)', Team.NPC, UnitClass.NPC_CIVILIAN, stats, [], 4, false, AuraTier.TIER_B);
}

export function createFleeingGirlEast(): Unit {
  const stats: UnitStats = {
    hp: 10, maxHp: 10,
    str: 0, mag: 0, skl: 0, spd: 0, lck: 0, def: 0, res: 0,
    stoRes: 8, maxStoRes: 8,
  };
  return new Unit('fleeing_east', 'Girl (E)', Team.NPC, UnitClass.NPC_CIVILIAN, stats, [], 4, false, AuraTier.TIER_B);
}
