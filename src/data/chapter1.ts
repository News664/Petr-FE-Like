/*
 * src/data/chapter1.ts
 * Chapter 1 static data for Petr-FE-Like.
 *
 * Contents:
 *   CHAPTER1_MAP_GRID   — 14×20 tile-type grid (row-major, TileType values)
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
 *   Row 0:  GRASS×7, ESCAPE×3 (cols 7-9), GRASS×10
 *   Row 3:  BUILDING at (1,2), (4,3) clusters; see grid below
 *   Row 4:  WELLs at cols 6-7; BUILDING clusters continue
 *   Row 5:  WELL at col 6; BUILDING cluster at cols 10-11
 *   Row 6-7: GATE at cols 8-11
 *
 * Unit placements (x = col, y = row):
 *   Eirika (9,12), Tana (7,12), Vanessa (8,7), Syrene (10,7)
 *   EnemySoldier1 (7,1), EnemySoldier2 (11,1), Gorgon1 (9,0)
 *   Maya (6,4), FleeingWest (2,8), FleeingEast (16,8)
 *
 * Pre-placed aura:
 *   Town Guard statue — pos (17,5), TIER_B, radius 4
 *
 * Chapter clear: Eirika steps on any ESCAPE tile.
 * Chapter fail:  Eirika's state becomes PETRIFIED_CAPTURED.
 */

import { TileType, AuraTier } from '../game/Unit';
import type { AuraSource } from '../game/Aura';

// ---------------------------------------------------------------------------
// Map grid: CHAPTER1_MAP_GRID[row][col]
// ---------------------------------------------------------------------------

export const CHAPTER1_MAP_GRID: number[][] = [
  // Row 0:  cols 7,8,9 = ESCAPE; rest GRASS
  [0, 0, 0, 0, 0, 0, 0, 6, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 1
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 2
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 3:  BUILDING at cols 1-2 and 13-14
  [0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0],
  // Row 4:  BUILDING at cols 1-2 and 13-14; WELL at cols 6-7
  [0, 2, 2, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0],
  // Row 5:  WELL at col 6; BUILDING at cols 10-11
  [0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 6:  GATE at cols 8-11
  [0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 7:  GATE at cols 8-11
  [0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0],
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
  { unitId: 'vanessa', x:  8, y:  7 },
  { unitId: 'syrene',  x: 10, y:  7 },
  // Enemies (present from turn 1)
  { unitId: 'soldier_1', x:  7, y: 1 },
  { unitId: 'soldier_2', x: 11, y: 1 },
  { unitId: 'gorgon_1',  x:  9, y: 0 },
  // NPCs
  { unitId: 'maya',         x:  6, y:  4 },
  { unitId: 'fleeing_west', x:  2, y:  8 },
  { unitId: 'fleeing_east', x: 16, y:  8 },
];

// ---------------------------------------------------------------------------
// Pre-placed aura statues
// ---------------------------------------------------------------------------

export const INITIAL_AURA_SOURCES: AuraSource[] = [
  {
    position: { x: 17, y: 5 },
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
  { x: 7, y: 0 },
  { x: 8, y: 0 },
  { x: 9, y: 0 },
];

// ---------------------------------------------------------------------------
// Enemy spawn wave definitions
// ---------------------------------------------------------------------------

export interface SpawnEntry {
  unitId: string;  // used as factory hint; scene will call the right factory
  kind:   'soldier' | 'gorgon' | 'strong_gorgon' | 'dark_mage';
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
  { turn: 2, description: 'Maya degrading timer starts (3 turns)' },
  { turn: 3, description: 'FleeingWest and FleeingEast degrading timers start (2 turns each)' },
  { turn: 4, description: 'Gorgon AI priority shifts toward Vanessa/Syrene at the gate' },
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
