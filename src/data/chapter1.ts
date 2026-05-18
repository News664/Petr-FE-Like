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
 *
 * Map legend (TileType values):
 *   0 = GRASS, 1 = ROAD, 2 = BUILDING, 3 = FOREST, 4 = GATE, 5 = WELL, 6 = ESCAPE
 *
 * Map layout (20 cols × 14 rows, row 0 = north):
 *   Row 0:  GRASS×7, ESCAPE at cols 7-10, GRASS×9
 *   Row 3:  BUILDING at cols 2-3 and 13-14
 *   Row 4:  BUILDING at cols 2-3 and 13-14; WELL at cols 5-6
 *   Row 5:  WALL row — BUILDING at cols 2-7 and 10-19; open at cols 0,1,8,9
 *           (The west passage at cols 0-1 is open; gate gap at cols 8-9)
 *
 * Unit placements (x = col, y = row):
 *   Eirika (9,12), Tana (7,12), Vanessa (8,6), Syrene (9,6)
 *   EnemySoldier1 (7,1), EnemySoldier2 (11,1), Gorgon1 (9,0)
 *   Maya (5,4) — north of wall, near well
 *   FleeingWest (2,3) — north of wall, west
 *   FleeingEast (15,3) — north of wall, east
 *
 * Pre-placed aura:
 *   Aura statue — pos (17,3), TIER_B, radius 4
 *
 * Spawn waves:
 *   Turn 3: EnemySoldier at (5,0), EnemySoldier at (14,0), Gorgon at (10,0)
 *   Turn 5: StrongGorgon at (9,0), DarkMage at (8,0), TheHand at (9,13)
 *
 * Chapter clear: Eirika steps on any ESCAPE tile (row 0, cols 7-10).
 * Chapter fail:  Eirika's state becomes PETRIFIED_CAPTURED.
 */

import { TileType, AuraTier } from '../game/Unit';
import type { AuraSource } from '../game/Aura';

// ---------------------------------------------------------------------------
// Map grid: CHAPTER1_MAP_GRID[row][col]
// ---------------------------------------------------------------------------

export const CHAPTER1_MAP_GRID: number[][] = [
  // Row 0:  cols 7,8,9,10 = ESCAPE; rest GRASS
  [0, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 1
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 2
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 3:  BUILDING at cols 2-3 and 13-14
  [0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0],
  // Row 4:  BUILDING at cols 2-3 and 13-14; WELL at cols 5-6
  [0, 0, 2, 2, 0, 5, 5, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0],
  // Row 5:  WALL row — open at cols 0,1 (west passage) and 8,9 (gate gap); BUILDING elsewhere
  [0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  // Row 6
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 7
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 8
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 9
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 10
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 11
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 12
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 13
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
  // Player units
  { unitId: 'eirika',  x:  9, y: 12 },
  { unitId: 'tana',    x:  7, y: 12 },
  { unitId: 'vanessa', x:  8, y:  6 },
  { unitId: 'syrene',  x:  9, y:  6 },
  // Enemies (present from turn 1)
  { unitId: 'soldier_1', x:  7, y: 1 },
  { unitId: 'soldier_2', x: 11, y: 1 },
  { unitId: 'gorgon_1',  x:  9, y: 0 },
  // NPCs — north of wall
  { unitId: 'maya',         x:  5, y:  4 },
  { unitId: 'fleeing_west', x:  2, y:  3 },
  { unitId: 'fleeing_east', x: 15, y:  3 },
];

// ---------------------------------------------------------------------------
// Pre-placed aura statues
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
// Escape tiles
// ---------------------------------------------------------------------------

export interface EscapeTile {
  x: number;
  y: number;
}

export const ESCAPE_TILES: EscapeTile[] = [
  { x:  7, y: 0 },
  { x:  8, y: 0 },
  { x:  9, y: 0 },
  { x: 10, y: 0 },
];

// ---------------------------------------------------------------------------
// Enemy spawn wave definitions
// ---------------------------------------------------------------------------

export interface SpawnEntry {
  unitId: string;  // used as factory hint; scene will call the right factory
  kind:   'soldier' | 'gorgon' | 'strong_gorgon' | 'dark_mage' | 'the_hand';
  x:      number;
  y:      number;
}

export interface SpawnWave {
  onTurn:  number;
  entries: SpawnEntry[];
}

export const ENEMY_SPAWN_WAVES: SpawnWave[] = [
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
  { turn: 2, description: 'Maya callout dialogue fires; degrading timer starts (3 turns)' },
  { turn: 3, description: 'FleeingWest and FleeingEast callout dialogue; degrading timers start (2 turns each)' },
  { turn: 4, description: 'Gorgon AI priority shifts toward Vanessa/Syrene at the wall' },
  { turn: 5, description: 'The Hand spawns at (9,13); StrongGorgon and DarkMage reinforce north' },
];

// ---------------------------------------------------------------------------
// Bundled export
// ---------------------------------------------------------------------------

export interface ChapterOneData {
  mapGrid:       number[][];
  unitPlacements: UnitPlacement[];
  auraSources:   AuraSource[];
  escapeTiles:   EscapeTile[];
  spawnWaves:    SpawnWave[];
  tileTypeMap:   typeof TileType;
}

export const ChapterOneData: ChapterOneData = {
  mapGrid:        CHAPTER1_MAP_GRID,
  unitPlacements: UNIT_PLACEMENTS,
  auraSources:    INITIAL_AURA_SOURCES,
  escapeTiles:    ESCAPE_TILES,
  spawnWaves:     ENEMY_SPAWN_WAVES,
  tileTypeMap:    TileType,
};
