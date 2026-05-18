/*
 * src/data/chapter1.ts
 * Chapter 1 static data for Petr-FE-Like.
 *
 * Contents:
 *   CHAPTER1_MAP_GRID   — 20×14 tile-type grid (row-major, TileType values)
 *   unitPlacements      — starting (x, y) for each named unit
 *   auraSources         — pre-placed aura statues on the map
 *   escapeTiles         — tiles that trigger chapter clear when Eirika steps on them
 *   enemySpawnWaves     — waves of enemies spawned by turn triggers
 *   scriptedEvents      — high-level description of turn-based event hooks
 *                         (actual callbacks are wired in ChapterScene)
 *   decorativeStatues   — purely visual statue markers (no aura, no Unit instance)
 *
 * Map legend (TileType values):
 *   0 = GRASS, 1 = ROAD, 2 = BUILDING, 3 = FOREST, 4 = GATE,
 *   5 = WELL,  6 = ESCAPE, 7 = BREAKABLE_WALL
 *
 * Map layout (20 cols × 14 rows, row 0 = north):
 *   Row 0:  ESCAPE at cols 0–3, BUILDING at col 4 (blocks west row-0 enemy chase),
 *           GRASS at cols 5–19
 *   Row 1–2: GRASS
 *   Row 3:  GRASS; BUILDING at cols 2-3 and 13-14
 *   Row 4:  BUILDING at cols 2-3 and 13-14; WELL at cols 5-6
 *   Row 5:  north outer wall — BUILDING at cols 2-7 and 10-19;
 *           GRASS at cols 0-1 (west pass), 8-9 (gate gap)
 *   Row 6:  BREAKABLE_WALL at col 2 — blocks middle-corridor west passage; GRASS elsewhere
 *   Row 7:  inner wall — BUILDING at cols 2-7 and 10-16; GRASS at 8-9 (gate), 17-19 (open right)
 *   Row 8-12: stronghold interior — BUILDING west wall col 2, east wall col 16
 *   Row 10: col 2 = BUILDING (solid west wall; breakable wall moved to row 6)
 *   Row 12: col 2 is GRASS (SW passage open), east wall col 16
 *   Row 13: south wall — BUILDING at cols 2-16
 *
 * Unit placements (x = col, y = row) — CHANGE E redesign:
 *   Eirika (9,11), Tana (7,11), Vanessa (8,8), Syrene (9,8)
 *   EnemySoldier1 (7,1), EnemySoldier2 (11,1)
 *   Gorgon1 now spawns at turn 2 (not turn 1)
 *   Maya (5,4) — north area, near well
 *   FleeingWest (2,3) — north area, west
 *   FleeingEast (15,3) — north area, east
 *   BreachGuard1 (8,12), BreachGuard2 (10,12) — CHANGE K: inside stronghold south
 *   WeakGorgon (4,11) — CHANGE L: tutorial weak Gorgon in SW interior
 *
 * Pre-placed aura:
 *   Aura statue — pos (17,3), TIER_B, radius 4
 *
 * Decorative statues (pre-placed in DECORATIVE_STATUES):
 *   Positions (5,10) and (12,10) inside stronghold — purely visual, no Unit
 *   Note: (3,12) SW guard is no longer in DECORATIVE_STATUES; it is now created live
 *         by scriptedPetrify(3,12,'Guard',...) in ChapterScene opening sequence (CHANGE P)
 *
 * Spawn waves (CHANGE F — Gorgon1 moved to turn 2):
 *   Turn 2: Gorgon1 at (9,1)
 *   Turn 3: EnemySoldier at (5,0), EnemySoldier at (14,0), Gorgon at (10,0)
 *   Turn 5: StrongGorgon at (9,0), DarkMage at (8,0), TheHand at (9,13)
 *
 * Item rewards wired in ChapterScene triggers:
 *   Maya onSuccess:        give rescuing unit VULNERARY (or drop)
 *   FleeingEast onSuccess: give rescuing unit AMBER_SHARD
 *   FleeingWest onSuccess: give rescuing unit VULNERARY (or drop)
 *
 * Chapter clear: Eirika steps on any ESCAPE tile (x 0–3, row 0).
 * Chapter fail:  Eirika's state becomes PETRIFIED_CAPTURED.
 *
 * CHANGE D: BREAKABLE_WALL (7) originally at (2,10); now moved to (2,6) — middle-corridor route.
 * CHANGE P: (2,10) reverted to BUILDING; (2,6) set to BREAKABLE_WALL; (2,12) remains GRASS.
 * CHANGE E: Full map redesign with stronghold walls and new unit positions.
 * CHANGE F: Gorgon1 delayed to turn 2 spawn wave.
 * CHANGE K: BreachGuard1/2 added to initial placements.
 * CHANGE L: Row 0 escape limited to cols 0–3 with blocking BUILDING at col 4;
 *           Row 12 col 2 opened to GRASS (SW passage); WeakGorgon at (4,11);
 *           decorative statue Guard at (3,12).
 */

import { TileType, AuraTier } from '../game/Unit';
import type { AuraSource } from '../game/Aura';

// ---------------------------------------------------------------------------
// Map grid: CHAPTER1_MAP_GRID[row][col]
// ---------------------------------------------------------------------------

export const CHAPTER1_MAP_GRID: number[][] = [
  // Row 0: ESCAPE cols 0–3, BUILDING col 4 (blocks west chase), GRASS cols 5–19
  [6, 6, 6, 6, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 1: GRASS
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 2: GRASS
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 3: BUILDING at cols 2-3 and 13-14
  [0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0],
  // Row 4: BUILDING at cols 2-3 and 13-14; WELL at cols 5-6
  [0, 0, 2, 2, 0, 5, 5, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0],
  // Row 5: north outer wall; gate at 8-9; west pass at 0-1
  [0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  // Row 6: BREAKABLE_WALL at col 2 (blocks middle-corridor west route); GRASS elsewhere
  [0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 7: inner wall; gate at 8-9; right side open at 17-19
  [0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
  // Row 8: stronghold west wall col 2, east wall col 16
  [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
  // Row 9: same walls
  [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
  // Row 10: BUILDING at col 2 (solid west wall restored); east wall col 16
  [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
  // Row 11: west wall col 2, east wall col 16
  [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
  // Row 12: SW passage open (col 2 = GRASS), east wall col 16; BUILDING at col 16
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
  // Row 13: south wall (cols 2-16)
  [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
];

// ---------------------------------------------------------------------------
// Unit placements
// ---------------------------------------------------------------------------

export interface UnitPlacement {
  unitId: string;  // matches factory id (e.g. 'eirika', 'soldier_1')
  x:      number;
  y:      number;
}

export const UNIT_PLACEMENTS: UnitPlacement[] = [
  // Player units — CHANGE E positions
  { unitId: 'eirika',  x:  9, y: 11 },
  { unitId: 'tana',    x:  7, y: 11 },
  { unitId: 'vanessa', x:  8, y:  8 },
  { unitId: 'syrene',  x:  9, y:  8 },
  // Enemies present from turn 1 (Gorgon1 moved to turn 2 spawn — CHANGE F)
  { unitId: 'soldier_1', x:  7, y: 1 },
  { unitId: 'soldier_2', x: 11, y: 1 },
  // NPCs — north area
  { unitId: 'maya',         x:  5, y:  4 },
  { unitId: 'fleeing_west', x:  2, y:  3 },
  { unitId: 'fleeing_east', x: 15, y:  3 },
  // CHANGE K: Breach guards inside stronghold near south wall
  { unitId: 'guard_breach_1', x:  8, y: 12 },
  { unitId: 'guard_breach_2', x: 10, y: 12 },
  // CHANGE L: Weak Gorgon — tutorial enemy in SW interior
  { unitId: 'weak_gorgon', x: 4, y: 11 },
];

// ---------------------------------------------------------------------------
// Pre-placed aura statues (Unit-backed, with aura effect)
// ---------------------------------------------------------------------------

export const INITIAL_AURA_SOURCES: AuraSource[] = [
  {
    position: { x: 17, y: 3 },
    tier:     AuraTier.TIER_B,
    unitName: 'Town Guard',
    radius:   4,
  },
];

// ---------------------------------------------------------------------------
// CHANGE E: Decorative statues — visual only, no aura, no Unit instance
// ---------------------------------------------------------------------------

export interface DecorativeStatue {
  x:     number;
  y:     number;
  label: string;
}

export const DECORATIVE_STATUES: DecorativeStatue[] = [
  { x:  5, y: 10, label: 'Unknown Guard' },
  { x: 12, y: 10, label: 'Unknown Guard' },
  // Note: SW guard at (3,12) is NOT pre-placed here; it is added by scriptedPetrify()
  //       in ChapterScene.create() opening sequence (CHANGE P).
];

// ---------------------------------------------------------------------------
// Escape tiles
// ---------------------------------------------------------------------------

export interface EscapeTile {
  x: number;
  y: number;
}

// CHANGE L: Escape tiles restricted to cols 0–3 (matching ESCAPE tile types in row 0)
export const ESCAPE_TILES: EscapeTile[] = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
];

// ---------------------------------------------------------------------------
// Enemy spawn wave definitions
// ---------------------------------------------------------------------------

export interface SpawnEntry {
  unitId: string;  // used as factory hint; scene will call the right factory
  kind:   'soldier' | 'gorgon' | 'weak_gorgon' | 'strong_gorgon' | 'dark_mage' | 'the_hand';
  x:      number;
  y:      number;
}

export interface SpawnWave {
  onTurn:  number;
  entries: SpawnEntry[];
}

// CHANGE F: Gorgon1 moved from turn 1 initial placements to turn 2 spawn wave
export const ENEMY_SPAWN_WAVES: SpawnWave[] = [
  {
    onTurn: 2,
    entries: [
      { unitId: 'gorgon_1',  kind: 'gorgon',  x:  9, y: 1 },
    ],
  },
  {
    onTurn: 3,
    entries: [
      { unitId: 'soldier_3', kind: 'soldier',  x:  5, y: 0 },
      { unitId: 'soldier_4', kind: 'soldier',  x: 14, y: 0 },
      { unitId: 'gorgon_2',  kind: 'gorgon',   x: 10, y: 0 },
    ],
  },
  {
    onTurn: 5,
    entries: [
      { unitId: 'strong_gorgon_1', kind: 'strong_gorgon', x:  9, y: 0 },
      { unitId: 'dark_mage_1',     kind: 'dark_mage',     x:  8, y: 0 },
      { unitId: 'the_hand',        kind: 'the_hand',      x:  9, y: 13 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Scripted event turn markers (used by ChapterScene to wire triggers)
// ---------------------------------------------------------------------------

export interface ScriptedEventMarker {
  turn:        number;
  description: string;
}

export const SCRIPTED_EVENT_MARKERS: ScriptedEventMarker[] = [
  { turn: 2, description: 'Maya callout dialogue fires; degrading timer starts (3 turns); Gorgon1 spawns' },
  { turn: 3, description: 'FleeingWest and FleeingEast callout dialogue; degrading timers start (2 turns each)' },
  { turn: 4, description: 'Gorgon AI priority shifts toward Vanessa/Syrene at the wall' },
  { turn: 5, description: 'The Hand spawns at (9,13); StrongGorgon and DarkMage reinforce north; Breach Guards petrified' },
];

// ---------------------------------------------------------------------------
// Bundled export
// ---------------------------------------------------------------------------

export interface ChapterOneData {
  mapGrid:           number[][];
  unitPlacements:    UnitPlacement[];
  auraSources:       AuraSource[];
  escapeTiles:       EscapeTile[];
  spawnWaves:        SpawnWave[];
  tileTypeMap:       typeof TileType;
  decorativeStatues: DecorativeStatue[];
}

export const ChapterOneData: ChapterOneData = {
  mapGrid:           CHAPTER1_MAP_GRID,
  unitPlacements:    UNIT_PLACEMENTS,
  auraSources:       INITIAL_AURA_SOURCES,
  escapeTiles:       ESCAPE_TILES,
  spawnWaves:        ENEMY_SPAWN_WAVES,
  tileTypeMap:       TileType,
  decorativeStatues: DECORATIVE_STATUES,
};
