/*
 * src/game/Unit.ts
 * Core unit definitions for Petr-FE-Like.
 *
 * Key enums:
 *   TileType    — terrain categories (GRASS, ROAD, BUILDING, FOREST, GATE, WELL, ESCAPE)
 *   UnitState   — lifecycle state of a unit (ACTIVE → MOVED → DONE, or petrified/dead)
 *   Team        — faction allegiance (PLAYER, ENEMY, NPC)
 *   WeaponType  — weapon category; GAZE targets STO_RES instead of HP
 *   AuraTier    — strength of petrified-unit aura (S > A > B)
 *   UnitClass   — job class used for AI and ruleset branching;
 *                 includes PURSUER for The Hand
 *
 * Key interfaces:
 *   WeaponData  — single weapon definition with combat stats
 *   UnitStats   — full stat block including stoRes (stone resistance)
 *   ItemData    — consumable item (e.g. Vulnerary); uses/maxUses/healAmount
 *
 * Unit class:
 *   Represents one combatant. Tracks position, equipped weapon, turn state.
 *   stoRes reaching 0 triggers petrification via petrify().
 *   items[]         — consumable items carried by this unit
 *   isNamedCharacter — true for named player characters (Eirika, Tana, Vanessa, Syrene)
 *   isPursuer        — true for The Hand; uses special AI and capture logic
 *   isCollecting     — true when The Hand is spending a turn "collecting" a petrified character
 */

export enum TileType {
  GRASS    = 0,
  ROAD     = 1,
  BUILDING = 2,
  FOREST   = 3,
  GATE     = 4,
  WELL     = 5,
  ESCAPE   = 6,
}

export enum UnitState {
  ACTIVE             = 'ACTIVE',
  MOVED              = 'MOVED',
  DONE               = 'DONE',
  PETRIFIED_SAFE     = 'PETRIFIED_SAFE',
  PETRIFIED_CAPTURED = 'PETRIFIED_CAPTURED',
  DEAD               = 'DEAD',
}

export enum Team {
  PLAYER = 'PLAYER',
  ENEMY  = 'ENEMY',
  NPC    = 'NPC',
}

export enum WeaponType {
  SWORD = 'SWORD',
  LANCE = 'LANCE',
  AXE   = 'AXE',
  DARK  = 'DARK',
  GAZE  = 'GAZE',
}

export enum AuraTier {
  TIER_S = 3,
  TIER_A = 2,
  TIER_B = 1,
}

export enum UnitClass {
  LORD            = 'LORD',
  PEGASUS_KNIGHT  = 'PEGASUS_KNIGHT',
  SOLDIER         = 'SOLDIER',
  MAGE            = 'MAGE',
  GORGON          = 'GORGON',
  NPC_CIVILIAN    = 'NPC_CIVILIAN',
  PURSUER         = 'PURSUER',
}

export interface WeaponData {
  name:     string;
  type:     WeaponType;
  might:    number;
  hit:      number;
  minRange: number;
  maxRange: number;
  weight:   number;
}

export interface UnitStats {
  hp:         number;
  maxHp:      number;
  str:        number;
  mag:        number;
  skl:        number;
  spd:        number;
  lck:        number;
  def:        number;
  res:        number;
  stoRes:     number;
  maxStoRes:  number;
}

/** Consumable item a unit can carry (e.g. Vulnerary). */
export interface ItemData {
  name:       string;
  uses:       number;
  maxUses:    number;
  healAmount: number; // HP restored when used
}

export class Unit {
  id:                  string;
  name:                string;
  team:                Team;
  unitClass:           UnitClass;
  state:               UnitState;
  stats:               UnitStats;
  weapons:             WeaponData[];
  equippedWeaponIndex: number;
  movement:            number;
  isFlying:            boolean;
  auraTier:            AuraTier;
  position:            { x: number; y: number };
  hasMoved:            boolean;
  hasActed:            boolean;
  items:               ItemData[];
  isNamedCharacter:    boolean;
  isPursuer:           boolean;
  isCollecting:        boolean;

  constructor(
    id:        string,
    name:      string,
    team:      Team,
    unitClass: UnitClass,
    stats:     UnitStats,
    weapons:   WeaponData[],
    movement:  number,
    isFlying:  boolean,
    auraTier:  AuraTier,
  ) {
    this.id                  = id;
    this.name                = name;
    this.team                = team;
    this.unitClass           = unitClass;
    this.state               = UnitState.ACTIVE;
    this.stats               = { ...stats };
    this.weapons             = weapons;
    this.equippedWeaponIndex = 0;
    this.movement            = movement;
    this.isFlying            = isFlying;
    this.auraTier            = auraTier;
    this.position            = { x: 0, y: 0 };
    this.hasMoved            = false;
    this.hasActed            = false;
    this.items               = [];
    this.isNamedCharacter    = false;
    this.isPursuer           = false;
    this.isCollecting        = false;
  }

  getEquippedWeapon(): WeaponData | null {
    if (this.weapons.length === 0) return null;
    return this.weapons[this.equippedWeaponIndex] ?? null;
  }

  canAct(): boolean {
    return (
      this.state === UnitState.ACTIVE ||
      this.state === UnitState.MOVED
    );
  }

  resetTurn(): void {
    if (
      this.state === UnitState.MOVED ||
      this.state === UnitState.DONE
    ) {
      this.state = UnitState.ACTIVE;
    }
    this.hasMoved  = false;
    this.hasActed  = false;
  }

  petrify(captured: boolean): void {
    this.state = captured
      ? UnitState.PETRIFIED_CAPTURED
      : UnitState.PETRIFIED_SAFE;
  }
}
