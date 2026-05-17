/*
 * src/game/AI.ts
 * Enemy AI logic for Petr-FE-Like.
 *
 * AIAction:
 *   moveTo       — tile to move to (null = stay put)
 *   attackTarget — unit to attack after moving (null = no attack)
 *
 * AIController.getAction() behaviour:
 *   1. Compute all tiles reachable by the enemy unit.
 *   2. From each reachable tile, determine what player units can be attacked.
 *   3. Target selection:
 *      - GORGON: prioritise player unit with lowest stoRes
 *      - Others: prioritise player unit with lowest HP
 *   4. If no attack available: move one step toward the nearest player unit.
 *   5. Avoid finishing on a tile surrounded on all four sides by non-allied units
 *      (basic "don't box yourself in" heuristic).
 *
 * Coordinate convention: (x = col, y = row), origin top-left.
 */

import { Unit, UnitClass, UnitState, WeaponType } from './Unit';
import { GameMap } from './Map';

export interface AIAction {
  moveTo:       { x: number; y: number } | null;
  attackTarget: Unit | null;
}

export class AIController {
  /**
   * Determines the best action for a single enemy unit.
   */
  getAction(enemy: Unit, map: GameMap, playerUnits: Unit[]): AIAction {
    const livePlayers = playerUnits.filter(
      u =>
        u.state !== UnitState.DEAD &&
        u.state !== UnitState.PETRIFIED_SAFE &&
        u.state !== UnitState.PETRIFIED_CAPTURED,
    );

    if (livePlayers.length === 0) {
      return { moveTo: null, attackTarget: null };
    }

    const weapon = enemy.getEquippedWeapon();
    if (!weapon) {
      return { moveTo: null, attackTarget: null };
    }

    const reachable = map.getMovementRange(enemy);

    // Include current position in reachable set
    reachable.add(`${enemy.position.x},${enemy.position.y}`);

    // Build map: "x,y" → set of attackable player units from that position
    interface AttackOption {
      movePos: { x: number; y: number };
      target:  Unit;
    }

    const attackOptions: AttackOption[] = [];

    for (const posKey of reachable) {
      const [mx, my] = posKey.split(',').map(Number);

      for (const player of livePlayers) {
        const dx   = Math.abs(mx - player.position.x);
        const dy   = Math.abs(my - player.position.y);
        const dist = dx + dy;

        if (dist >= weapon.minRange && dist <= weapon.maxRange) {
          attackOptions.push({ movePos: { x: mx, y: my }, target: player });
        }
      }
    }

    if (attackOptions.length > 0) {
      // Sort by target priority
      attackOptions.sort((a, b) => {
        if (enemy.unitClass === UnitClass.GORGON) {
          // GAZE weapons: prefer lowest stoRes
          const primaryWeapon = enemy.getEquippedWeapon();
          if (primaryWeapon && primaryWeapon.type === WeaponType.GAZE) {
            return a.target.stats.stoRes - b.target.stats.stoRes;
          }
        }
        // Default: prefer lowest HP
        return a.target.stats.hp - b.target.stats.hp;
      });

      const best = attackOptions[0];

      // Check if move position is safe (not boxed in)
      const safeMovePos = this.findSafeMovePos(best.movePos, reachable, enemy, map)
        ?? best.movePos;

      const finalMove =
        safeMovePos.x === enemy.position.x && safeMovePos.y === enemy.position.y
          ? null
          : safeMovePos;

      return { moveTo: finalMove, attackTarget: best.target };
    }

    // No attack available: move toward nearest player unit
    const nearest = this.findNearestPlayer(enemy, livePlayers);
    if (!nearest) return { moveTo: null, attackTarget: null };

    const moveToward = this.stepToward(enemy, nearest, reachable, map);
    const finalMove =
      moveToward &&
      !(moveToward.x === enemy.position.x && moveToward.y === enemy.position.y)
        ? moveToward
        : null;

    return { moveTo: finalMove, attackTarget: null };
  }

  /** Find the player unit with the lowest Manhattan distance to this enemy. */
  private findNearestPlayer(enemy: Unit, players: Unit[]): Unit | null {
    let nearest: Unit | null = null;
    let minDist = Infinity;

    for (const p of players) {
      const dist =
        Math.abs(p.position.x - enemy.position.x) +
        Math.abs(p.position.y - enemy.position.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    }

    return nearest;
  }

  /**
   * Return the reachable tile that is closest to the target (greedy approach).
   * Falls back to current position if no better tile found.
   */
  private stepToward(
    enemy:    Unit,
    target:   Unit,
    reachable: Set<string>,
    _map:     GameMap,
  ): { x: number; y: number } | null {
    let bestPos = { x: enemy.position.x, y: enemy.position.y };
    let bestDist =
      Math.abs(target.position.x - enemy.position.x) +
      Math.abs(target.position.y - enemy.position.y);

    for (const posKey of reachable) {
      const [rx, ry] = posKey.split(',').map(Number);
      const dist =
        Math.abs(target.position.x - rx) + Math.abs(target.position.y - ry);
      if (dist < bestDist) {
        bestDist = dist;
        bestPos  = { x: rx, y: ry };
      }
    }

    return bestPos;
  }

  /**
   * Heuristic: avoid landing on a tile that is surrounded on all 4 sides by non-allied units.
   * Returns a safe position from reachable, or the original if none found.
   */
  private findSafeMovePos(
    preferred: { x: number; y: number },
    reachable: Set<string>,
    enemy:     Unit,
    map:       GameMap,
  ): { x: number; y: number } | null {
    if (!this.isSurrounded(preferred, enemy, map)) return preferred;

    // Try to find an unsurrounded tile in reachable
    for (const posKey of reachable) {
      const [rx, ry] = posKey.split(',').map(Number);
      if (!this.isSurrounded({ x: rx, y: ry }, enemy, map)) {
        return { x: rx, y: ry };
      }
    }

    return preferred; // no better option found
  }

  private isSurrounded(
    pos:   { x: number; y: number },
    enemy: Unit,
    map:   GameMap,
  ): boolean {
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy:  1 },
      { dx: -1, dy: 0 },
      { dx:  1, dy: 0 },
    ];

    let blockedCount = 0;
    for (const dir of dirs) {
      const nx = pos.x + dir.dx;
      const ny = pos.y + dir.dy;
      if (!map.isInBounds(nx, ny)) {
        blockedCount++;
        continue;
      }
      const occupant = map.getUnit(nx, ny);
      if (occupant && occupant.team !== enemy.team) blockedCount++;
    }

    return blockedCount >= 4;
  }
}
