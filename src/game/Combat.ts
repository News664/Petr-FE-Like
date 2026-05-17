/*
 * src/game/Combat.ts
 * Pure combat calculation functions for Petr-FE-Like (no Phaser dependency).
 *
 * Weapon triangle:  SWORD > AXE > LANCE > SWORD
 *   Advantage grants: +15 hit, +1 damage.
 *
 * Damage formulas:
 *   Physical (SWORD/LANCE/AXE): STR + might − DEF − terrainDef  (min 0)
 *   Magic    (DARK):            MAG + might − RES               (min 0)
 *   Gaze     (GAZE):            max(1, might − floor(RES / 2))  → damages STO_RES
 *
 * Hit formula:
 *   attacker.skl×2 + attacker.lck/2 + weapon.hit
 *   − (defender.spd×2 + defender.lck/2)
 *   − terrainAvo
 *   Clamped 0–100.
 *
 * Double-attack: attacker.spd >= defender.spd + 4
 *
 * CombatResult shape:
 *   attackerHits[]      — booleans for each attacker strike
 *   defenderHits[]      — booleans for each defender counter
 *   stoResDamage        — total STO_RES damage dealt to defender (GAZE only)
 *   hpDamageToDefender  — total HP damage dealt to defender
 *   hpDamageToAttacker  — total HP damage dealt to attacker
 */

import { Unit, WeaponType } from './Unit';
import { GameMap } from './Map';

export interface CombatResult {
  attackerHits:       boolean[];
  defenderHits:       boolean[];
  stoResDamage:       number;
  hpDamageToDefender: number;
  hpDamageToAttacker: number;
}

/** Returns +1 if attacker has weapon-triangle advantage, -1 if disadvantaged, 0 if neutral. */
function weaponTriangleAdvantage(attackerType: WeaponType, defenderType: WeaponType): number {
  const beats: Partial<Record<WeaponType, WeaponType>> = {
    [WeaponType.SWORD]: WeaponType.AXE,
    [WeaponType.AXE]:   WeaponType.LANCE,
    [WeaponType.LANCE]: WeaponType.SWORD,
  };
  if (beats[attackerType] === defenderType) return  1;
  if (beats[defenderType] === attackerType) return -1;
  return 0;
}

/** Hit chance 0–100. */
export function calcHit(attacker: Unit, defender: Unit, map: GameMap): number {
  const weapon = attacker.getEquippedWeapon();
  if (!weapon) return 0;

  const defTile    = map.getTile(defender.position.x, defender.position.y);
  const terrainAvo = defTile?.avoBonus ?? 0;

  let hit =
    attacker.stats.skl * 2 +
    Math.floor(attacker.stats.lck / 2) +
    weapon.hit -
    (defender.stats.spd * 2 + Math.floor(defender.stats.lck / 2)) -
    terrainAvo;

  // Weapon triangle
  const defWeapon = defender.getEquippedWeapon();
  if (defWeapon) {
    const adv = weaponTriangleAdvantage(weapon.type, defWeapon.type);
    hit += adv * 15;
  }

  return Math.max(0, Math.min(100, Math.round(hit)));
}

/** Raw HP damage dealt by attacker to defender (0 for GAZE). */
export function calcDamage(attacker: Unit, defender: Unit, map: GameMap): number {
  const weapon = attacker.getEquippedWeapon();
  if (!weapon) return 0;

  if (weapon.type === WeaponType.GAZE) return 0; // GAZE hits STO_RES, not HP

  const defTile   = map.getTile(defender.position.x, defender.position.y);
  const terrainDef = defTile?.defBonus ?? 0;

  // Weapon triangle damage bonus
  const defWeapon = defender.getEquippedWeapon();
  let triBonus = 0;
  if (defWeapon) {
    const adv = weaponTriangleAdvantage(weapon.type, defWeapon.type);
    triBonus = adv * 1;
  }

  let dmg: number;
  if (weapon.type === WeaponType.DARK) {
    dmg = attacker.stats.mag + weapon.might - defender.stats.res;
  } else {
    dmg = attacker.stats.str + weapon.might + triBonus - defender.stats.def - terrainDef;
  }

  return Math.max(0, dmg);
}

/** STO_RES damage dealt by a GAZE attack. Always at least 1. */
function calcGazeDamage(attacker: Unit, defender: Unit): number {
  const weapon = attacker.getEquippedWeapon();
  if (!weapon || weapon.type !== WeaponType.GAZE) return 0;
  return Math.max(1, weapon.might - Math.floor(defender.stats.res / 2));
}

/** Whether attacker is fast enough to attack twice. */
export function calcDoubleAttack(attacker: Unit, defender: Unit): boolean {
  return attacker.stats.spd >= defender.stats.spd + 4;
}

/** Simulate a random hit roll given hit% (0-100). */
function rollHit(hitChance: number): boolean {
  return Math.random() * 100 < hitChance;
}

/** Check if defender can counter-attack (must have weapon in range). */
function canCounter(attacker: Unit, defender: Unit): boolean {
  const defWeapon = defender.getEquippedWeapon();
  if (!defWeapon) return false;

  const dx   = Math.abs(attacker.position.x - defender.position.x);
  const dy   = Math.abs(attacker.position.y - defender.position.y);
  const dist = dx + dy;

  return dist >= defWeapon.minRange && dist <= defWeapon.maxRange;
}

/**
 * Full combat resolution.
 * Attack order: attacker → counter (if able) → attacker again (if double).
 * GAZE attacks deplete STO_RES; other weapons deplete HP.
 */
export function resolveCombat(attacker: Unit, defender: Unit, map: GameMap): CombatResult {
  const result: CombatResult = {
    attackerHits:       [],
    defenderHits:       [],
    stoResDamage:       0,
    hpDamageToDefender: 0,
    hpDamageToAttacker: 0,
  };

  const atkWeapon = attacker.getEquippedWeapon();
  if (!atkWeapon) return result;

  const isGaze   = atkWeapon.type === WeaponType.GAZE;
  const hitChance = calcHit(attacker, defender, map);
  const dmg       = isGaze ? calcGazeDamage(attacker, defender) : calcDamage(attacker, defender, map);

  // --- First attacker strike ---
  const hit1 = rollHit(hitChance);
  result.attackerHits.push(hit1);
  if (hit1) {
    if (isGaze) result.stoResDamage       += dmg;
    else        result.hpDamageToDefender += dmg;
  }

  // --- Defender counter (once, if alive and in range) ---
  const defAliveAfterFirst = result.hpDamageToDefender < defender.stats.hp;
  if (defAliveAfterFirst && canCounter(attacker, defender)) {
    const ctrHit = calcHit(defender, attacker, map);
    const ctrDmg = calcDamage(defender, attacker, map);
    const hit2   = rollHit(ctrHit);
    result.defenderHits.push(hit2);
    if (hit2) result.hpDamageToAttacker += ctrDmg;
  }

  // --- Second attacker strike (double) ---
  const atkAliveAfterCounter = result.hpDamageToAttacker < attacker.stats.hp;
  if (atkAliveAfterCounter && calcDoubleAttack(attacker, defender)) {
    const hit3 = rollHit(hitChance);
    result.attackerHits.push(hit3);
    if (hit3) {
      if (isGaze) result.stoResDamage       += dmg;
      else        result.hpDamageToDefender += dmg;
    }
  }

  return result;
}
