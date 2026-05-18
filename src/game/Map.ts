/*
 * src/game/Map.ts
 * Tile grid, unit placement, and movement/attack range calculation for Petr-FE-Like.
 *
 * Key interfaces:
 *   TileData — per-tile properties: type, walkable flag, terrainCost, defBonus, avoBonus,
 *              breakableHp (> 0 for BREAKABLE_WALL tiles)
 *
 * Map class responsibilities:
 *   - Owns the 2-D tile grid (tiles[row][col]) and a parallel unit grid (units[row][col])
 *   - placeUnit / moveUnit / removeUnit keep both grids in sync
 *   - getMovementRange: BFS flood-fill respecting terrain cost, unit blocking, and flying
 *   - getAttackRange: expands from a set of positions using equipped weapon range
 *   - breakTile(x, y): converts a BREAKABLE_WALL tile to GRASS, clearing breakableHp
 *
 * Coordinate convention: (x = col, y = row), origin top-left.
 *
 * Terrain costs:
 *   GRASS=1, ROAD=1, FOREST=2, GATE=1, WELL=1, ESCAPE=1,
 *   BUILDING=impassable(99), BREAKABLE_WALL=impassable(99)
 *   Flying units always pay cost 1 per tile.
 *
 * Tile bonuses:
 *   FOREST: def+1 avo+10 | GATE: def+2
 *
 * CHANGE D: BREAKABLE_WALL tile added — walkable:false, cost 99, breakableHp 1.
 *           breakTile() method converts BREAKABLE_WALL to GRASS.
 * CHANGE E: isPursuer units ignore BUILDING tiles in pathfinding (handled in
 *           bfsPathIgnoringUnits in AI.ts; BREAKABLE_WALL is also ignored for pursuers).
 */

import { TileType, Unit } from './Unit';

export interface TileData {
  type:         TileType;
  walkable:     boolean;
  terrainCost:  number;
  defBonus:     number;
  avoBonus:     number;
  breakableHp:  number;  // CHANGE D: > 0 for BREAKABLE_WALL tiles; 0 otherwise
}

const TILE_PROPERTIES: Record<TileType, TileData> = {
  [TileType.GRASS]:          { type: TileType.GRASS,          walkable: true,  terrainCost: 1,  defBonus: 0, avoBonus: 0,  breakableHp: 0 },
  [TileType.ROAD]:           { type: TileType.ROAD,           walkable: true,  terrainCost: 1,  defBonus: 0, avoBonus: 0,  breakableHp: 0 },
  [TileType.BUILDING]:       { type: TileType.BUILDING,       walkable: false, terrainCost: 99, defBonus: 0, avoBonus: 0,  breakableHp: 0 },
  [TileType.FOREST]:         { type: TileType.FOREST,         walkable: true,  terrainCost: 2,  defBonus: 1, avoBonus: 10, breakableHp: 0 },
  [TileType.GATE]:           { type: TileType.GATE,           walkable: true,  terrainCost: 1,  defBonus: 2, avoBonus: 0,  breakableHp: 0 },
  [TileType.WELL]:           { type: TileType.WELL,           walkable: true,  terrainCost: 1,  defBonus: 0, avoBonus: 0,  breakableHp: 0 },
  [TileType.ESCAPE]:         { type: TileType.ESCAPE,         walkable: true,  terrainCost: 1,  defBonus: 0, avoBonus: 0,  breakableHp: 0 },
  [TileType.BREAKABLE_WALL]: { type: TileType.BREAKABLE_WALL, walkable: false, terrainCost: 99, defBonus: 0, avoBonus: 0,  breakableHp: 1 },
};

export class GameMap {
  cols:  number;
  rows:  number;
  tiles: TileData[][];
  units: (Unit | null)[][];

  constructor(cols: number, rows: number, grid: number[][]) {
    this.cols  = cols;
    this.rows  = rows;
    this.tiles = [];
    this.units = [];

    for (let r = 0; r < rows; r++) {
      this.tiles[r] = [];
      this.units[r] = [];
      for (let c = 0; c < cols; c++) {
        const tileType = (grid[r]?.[c] ?? TileType.GRASS) as TileType;
        this.tiles[r][c] = { ...TILE_PROPERTIES[tileType] };
        this.units[r][c] = null;
      }
    }
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  getTile(x: number, y: number): TileData | null {
    if (!this.isInBounds(x, y)) return null;
    return this.tiles[y][x];
  }

  getUnit(x: number, y: number): Unit | null {
    if (!this.isInBounds(x, y)) return null;
    return this.units[y][x];
  }

  placeUnit(unit: Unit, x: number, y: number): void {
    // Remove from old position if present
    if (this.isInBounds(unit.position.x, unit.position.y)) {
      const old = this.units[unit.position.y]?.[unit.position.x];
      if (old && old.id === unit.id) {
        this.units[unit.position.y][unit.position.x] = null;
      }
    }
    unit.position.x = x;
    unit.position.y = y;
    if (this.isInBounds(x, y)) {
      this.units[y][x] = unit;
    }
  }

  moveUnit(unit: Unit, toX: number, toY: number): void {
    this.placeUnit(unit, toX, toY);
  }

  removeUnit(unit: Unit): void {
    const { x, y } = unit.position;
    if (this.isInBounds(x, y)) {
      if (this.units[y][x]?.id === unit.id) {
        this.units[y][x] = null;
      }
    }
  }

  /**
   * CHANGE D: Converts a BREAKABLE_WALL tile at (x, y) to GRASS, clearing breakableHp.
   * Has no effect if the tile is not BREAKABLE_WALL.
   */
  breakTile(x: number, y: number): void {
    if (!this.isInBounds(x, y)) return;
    const tile = this.tiles[y][x];
    if (tile.type !== TileType.BREAKABLE_WALL) return;
    const grassProps = { ...TILE_PROPERTIES[TileType.GRASS] };
    this.tiles[y][x] = grassProps;
  }

  /**
   * BFS flood-fill returning all tile positions reachable by this unit.
   * Returns a Set of "x,y" strings.
   * Rules:
   *   - Can't enter tiles with enemies
   *   - Can pass through allies but can't stop on them
   *   - Flying units treat every walkable tile as cost 1
   *   - BUILDING tiles are always impassable (BREAKABLE_WALL also impassable until broken)
   *   - isPursuer units ignore BUILDING and BREAKABLE_WALL for pathfinding (phasing)
   */
  getMovementRange(unit: Unit): Set<string> {
    const reachable = new Set<string>();
    // BFS: queue entries are [x, y, remainingMovement]
    type Entry = { x: number; y: number; remaining: number };
    const visited = new Map<string, number>(); // key -> best remaining

    const queue: Entry[] = [{ x: unit.position.x, y: unit.position.y, remaining: unit.movement }];
    visited.set(`${unit.position.x},${unit.position.y}`, unit.movement);

    const directions = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        if (!this.isInBounds(nx, ny)) continue;

        const tile = this.tiles[ny][nx];

        // Pursuer units (The Hand) ignore BUILDING and BREAKABLE_WALL
        if (unit.isPursuer) {
          if (tile.type !== TileType.BUILDING && tile.type !== TileType.BREAKABLE_WALL) {
            // passable
          }
          // Allow through even BUILDING for pursuers
        } else {
          if (!tile.walkable) continue;
        }

        const cost      = unit.isFlying || unit.isPursuer ? 1 : tile.terrainCost;
        const remaining = current.remaining - cost;
        if (remaining < 0) continue;

        const occupant = this.units[ny][nx];
        // Can't enter tiles occupied by enemies
        if (occupant && occupant.team !== unit.team) continue;

        const key     = `${nx},${ny}`;
        const bestSoFar = visited.get(key) ?? -1;
        if (remaining <= bestSoFar) continue;

        visited.set(key, remaining);

        // Can stop here only if not occupied by an ally
        if (!occupant || occupant.id === unit.id) {
          reachable.add(key);
        }

        queue.push({ x: nx, y: ny, remaining });
      }
    }

    return reachable;
  }

  /**
   * Returns all tiles within attack range of the unit, starting from the given
   * set of positions (defaults to current position). Used to show attack overlay.
   * Returns "x,y" strings excluding the source positions themselves.
   */
  getAttackRange(unit: Unit, fromPositions?: Set<string>): Set<string> {
    const weapon = unit.getEquippedWeapon();
    if (!weapon) return new Set();

    const sources = fromPositions ?? new Set([`${unit.position.x},${unit.position.y}`]);
    const attackSet = new Set<string>();

    for (const posKey of sources) {
      const [sx, sy] = posKey.split(',').map(Number);

      for (let dx = -weapon.maxRange; dx <= weapon.maxRange; dx++) {
        for (let dy = -weapon.maxRange; dy <= weapon.maxRange; dy++) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist < weapon.minRange || dist > weapon.maxRange) continue;
          const tx = sx + dx;
          const ty = sy + dy;
          if (!this.isInBounds(tx, ty)) continue;
          const key = `${tx},${ty}`;
          if (!sources.has(key)) {
            attackSet.add(key);
          }
        }
      }
    }

    return attackSet;
  }
}
