/*
 * src/game/Unit.ts
 * Core unit definitions for Petr-FE-Like.
 *
 * Key enums:
 *   TileType    — terrain categories (GRASS, ROAD, BUILDING, FOREST, GATE, WELL, ESCAPE,
 *                 BREAKABLE_WALL)
 *   UnitState   — lifecycle state of a unit (ACTIVE → MOVED → DONE, or petrified/dead)
 *   Team        — faction allegiance (PLAYER, ENEMY, NPC)
 *   WeaponType  — weapon category; GAZE targets STO_RES instead of HP
 *   AuraTier    — strength of petrified-unit aura (S > A > B)
 *   UnitClass   — job class used for AI and ruleset branching;
 *                 includes PURSUER for The Hand
 *
 * Key interfaces:
 *   WeaponData      — single weapon definition with combat stats
 *   UnitStats       — full stat block including stoRes (stone resistance)
 *   WeaponItem      — inventory slot containing a weapon
 *   ConsumableItem  — inventory slot containing a usable consumable
 *   InventoryItem   — union type (WeaponItem | ConsumableItem)
 *   ItemEffect      — what a consumable does (heal HP or boost STO-RES)
 *   GrowthRates     — per-stat level-up probability percentages (0–100)
 *   LevelUpResult   — which stats increased on a level-up { gained: Partial<UnitStats> }
 *
 * Unit class:
 *   Represents one combatant. Tracks position, equipped weapon, turn state.
 *   stoRes reaching 0 triggers petrification via petrify().
 *   inventory[]      — up to 5 items (weapons or consumables)
 *   equippedSlot     — index into inventory of the equipped weapon
 *   level            — current level (1–20)
 *   exp              — experience points (0–99, resets on level-up)
 *   growthRates      — per-stat chance to increase on level-up
 *   isNamedCharacter — true for named player characters (Eirika, Tana, Vanessa, Syrene)
 *   isPursuer        — true for The Hand; uses special AI and capture logic
 *   isCollecting     — true when The Hand is spending a turn "collecting" a petrified character
 *
 * CHANGE B: EXP/level-up system added (level, exp, growthRates, gainExp method).
 * CHANGE C: Unified 5-slot inventory replacing separate weapons[] and items[].
 * CHANGE D: BREAKABLE_WALL = 7 added to TileType enum.
 */

export enum TileType {
  GRASS          = 0,
  ROAD           = 1,
  BUILDING       = 2,
  FOREST         = 3,
  GATE           = 4,
  WELL           = 5,
  ESCAPE         = 6,
  BREAKABLE_WALL = 7,
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

// ---------------------------------------------------------------------------
// CHANGE C: Unified inventory types
// ---------------------------------------------------------------------------

/** What a consumable item does when used. */
export type ItemEffect =
  | { type: 'heal';        amount: number }
  | { type: 'stoResBoost'; amount: number };

/** An inventory slot holding a weapon. */
export interface WeaponItem {
  kind: 'weapon';
  data: WeaponData;
}

/** An inventory slot holding a consumable item. */
export interface ConsumableItem {
  kind:    'consumable';
  name:    string;
  uses:    number;
  maxUses: number;
  effect:  ItemEffect;
}

/** Union type for any inventory slot contents. */
export type InventoryItem = WeaponItem | ConsumableItem;

// ---------------------------------------------------------------------------
// CHANGE B: Growth rates and level-up result
// ---------------------------------------------------------------------------

/** Per-stat percentage chance (0–100) to increment that stat on level-up. */
export interface GrowthRates {
  hp:  number;
  str: number;
  mag: number;
  skl: number;
  spd: number;
  lck: number;
  def: number;
  res: number;
}

/** Returned by gainExp() when a level-up occurs; lists which stats increased. */
export interface LevelUpResult {
  gained: Partial<UnitStats>;
}

// ---------------------------------------------------------------------------
// Unit class
// ---------------------------------------------------------------------------

export class Unit {
  id:                  string;
  name:                string;
  team:                Team;
  unitClass:           UnitClass;
  state:               UnitState;
  stats:               UnitStats;
  inventory:           InventoryItem[];  // max 5 slots (CHANGE C)
  equippedSlot:        number;           // index of equipped weapon in inventory (CHANGE C)
  movement:            number;
  isFlying:            boolean;
  auraTier:            AuraTier;
  position:            { x: number; y: number };
  hasMoved:            boolean;
  hasActed:            boolean;
  isNamedCharacter:    boolean;
  isPursuer:           boolean;
  isCollecting:        boolean;
  level:               number;   // starts at 1 (CHANGE B)
  exp:                 number;   // 0–99, resets to 0 on level-up (CHANGE B)
  growthRates:         GrowthRates; // per-stat level-up probability (CHANGE B)

  constructor(
    id:        string,
    name:      string,
    team:      Team,
    unitClass: UnitClass,
    stats:     UnitStats,
    inventory: InventoryItem[],
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
    this.inventory           = inventory;
    this.equippedSlot        = 0;
    this.movement            = movement;
    this.isFlying            = isFlying;
    this.auraTier            = auraTier;
    this.position            = { x: 0, y: 0 };
    this.hasMoved            = false;
    this.hasActed            = false;
    this.isNamedCharacter    = false;
    this.isPursuer           = false;
    this.isCollecting        = false;
    this.level               = 1;
    this.exp                 = 0;
    this.growthRates         = { hp: 0, str: 0, mag: 0, skl: 0, spd: 0, lck: 0, def: 0, res: 0 };
  }

  // ---------------------------------------------------------------------------
  // CHANGE C: Inventory helpers
  // ---------------------------------------------------------------------------

  /** Returns equipped weapon data if equippedSlot holds a WeaponItem, else null. */
  getEquippedWeapon(): WeaponData | null {
    const slot = this.inventory[this.equippedSlot];
    if (!slot || slot.kind !== 'weapon') return null;
    return slot.data;
  }

  /** Add item to inventory. Returns false if all 5 slots are occupied. */
  addItem(item: InventoryItem): boolean {
    if (this.inventory.length >= 5) return false;
    this.inventory.push(item);
    return true;
  }

  /** Remove item at the given inventory index. */
  removeItemAt(slot: number): void {
    if (slot < 0 || slot >= this.inventory.length) return;
    this.inventory.splice(slot, 1);
    // Adjust equippedSlot if necessary
    if (this.equippedSlot >= this.inventory.length) {
      this.equippedSlot = Math.max(0, this.inventory.length - 1);
    }
  }

  /** Returns true if any inventory slot holds a weapon. */
  hasWeapon(): boolean {
    return this.inventory.some(i => i.kind === 'weapon');
  }

  // ---------------------------------------------------------------------------
  // CHANGE B: EXP and level-up
  // ---------------------------------------------------------------------------

  /**
   * Awards exp to this unit. If total reaches 100, triggers a level-up:
   *   - Increments level (capped at 20).
   *   - Resets exp to overflow remainder.
   *   - Rolls each stat against its growth rate and increments on success.
   * Returns LevelUpResult with which stats increased, or null if no level-up.
   */
  gainExp(amount: number): LevelUpResult | null {
    this.exp += amount;
    if (this.exp < 100 || this.level >= 20) {
      // Cap exp display at 99 for max-level units
      if (this.level >= 20) this.exp = Math.min(99, this.exp);
      return null;
    }

    // Level up
    this.exp = this.exp - 100; // overflow carries forward
    this.level = Math.min(20, this.level + 1);

    const gained: Partial<UnitStats> = {};

    const tryGrow = (rate: number): boolean => Math.random() < (rate / 100);

    if (tryGrow(this.growthRates.hp)) {
      this.stats.maxHp++;
      this.stats.hp++;
      gained.maxHp = 1;
      gained.hp    = 1;
    }
    if (tryGrow(this.growthRates.str)) {
      this.stats.str++;
      gained.str = 1;
    }
    if (tryGrow(this.growthRates.mag)) {
      this.stats.mag++;
      gained.mag = 1;
    }
    if (tryGrow(this.growthRates.skl)) {
      this.stats.skl++;
      gained.skl = 1;
    }
    if (tryGrow(this.growthRates.spd)) {
      this.stats.spd++;
      gained.spd = 1;
    }
    if (tryGrow(this.growthRates.lck)) {
      this.stats.lck++;
      gained.lck = 1;
    }
    if (tryGrow(this.growthRates.def)) {
      this.stats.def++;
      gained.def = 1;
    }
    if (tryGrow(this.growthRates.res)) {
      this.stats.res++;
      gained.res = 1;
    }

    return { gained };
  }

  // ---------------------------------------------------------------------------
  // Existing helpers
  // ---------------------------------------------------------------------------

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
