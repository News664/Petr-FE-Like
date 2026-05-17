/*
 * src/game/Aura.ts
 * Manages aura effects radiated by captured/petrified units in Petr-FE-Like.
 *
 * Key concepts:
 *   AuraSource  — a petrified unit (or pre-placed statue) emitting debuffs in a radius
 *   AuraEffect  — the combined debuff values for a given tile position
 *
 * Aura tiers and their effects:
 *   TIER_S (3): radius 6, statDebuff -3, hitAvoidDebuff -20, stoResDecayPerTurn 2
 *   TIER_A (2): radius 5, statDebuff -2, hitAvoidDebuff -15, stoResDecayPerTurn 1
 *   TIER_B (1): radius 4, statDebuff -1, hitAvoidDebuff -10, stoResDecayPerTurn 0
 *
 * AuraManager accumulates all active sources and provides:
 *   getEffectForUnit(x, y) — summed debuff from all overlapping auras
 *   getTilesInAura(source)  — Set<"x,y"> of tiles within a source's radius
 */

import { AuraTier } from './Unit';

export interface AuraSource {
  position: { x: number; y: number };
  tier:     AuraTier;
  unitName: string;
  radius:   number;
}

export interface AuraEffect {
  statDebuff:          number; // subtracted from all combat stats (negative value)
  hitAvoidDebuff:      number; // subtracted from hit and avoid (negative value)
  stoResDecayPerTurn:  number; // STO_RES lost per turn tick
}

const TIER_PROPERTIES: Record<AuraTier, { radius: number; statDebuff: number; hitAvoidDebuff: number; stoResDecayPerTurn: number }> = {
  [AuraTier.TIER_S]: { radius: 6, statDebuff: -3, hitAvoidDebuff: -20, stoResDecayPerTurn: 2 },
  [AuraTier.TIER_A]: { radius: 5, statDebuff: -2, hitAvoidDebuff: -15, stoResDecayPerTurn: 1 },
  [AuraTier.TIER_B]: { radius: 4, statDebuff: -1, hitAvoidDebuff: -10, stoResDecayPerTurn: 0 },
};

/** Returns the proper radius for a given tier (used when constructing AuraSource). */
export function getAuraRadius(tier: AuraTier): number {
  return TIER_PROPERTIES[tier].radius;
}

export class AuraManager {
  sources: AuraSource[] = [];

  addSource(source: AuraSource): void {
    // Avoid duplicates by position
    const key = `${source.position.x},${source.position.y}`;
    const exists = this.sources.some(
      s => `${s.position.x},${s.position.y}` === key,
    );
    if (!exists) {
      this.sources.push(source);
    }
  }

  removeSource(x: number, y: number): void {
    this.sources = this.sources.filter(
      s => !(s.position.x === x && s.position.y === y),
    );
  }

  /**
   * Returns a Set of "x,y" strings for every tile within Manhattan distance
   * of source.radius from the source position.
   */
  getTilesInAura(source: AuraSource): Set<string> {
    const result = new Set<string>();
    const { x, y } = source.position;
    const r = source.radius;

    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) + Math.abs(dy) <= r) {
          result.add(`${x + dx},${y + dy}`);
        }
      }
    }

    return result;
  }

  /**
   * Sums all aura debuffs that affect the given tile position.
   * Returns zeroed AuraEffect if the position is outside all auras.
   */
  getEffectForUnit(unitX: number, unitY: number): AuraEffect {
    const combined: AuraEffect = {
      statDebuff:         0,
      hitAvoidDebuff:     0,
      stoResDecayPerTurn: 0,
    };

    for (const source of this.sources) {
      const dist =
        Math.abs(unitX - source.position.x) +
        Math.abs(unitY - source.position.y);

      if (dist <= source.radius) {
        const props = TIER_PROPERTIES[source.tier];
        combined.statDebuff         += props.statDebuff;
        combined.hitAvoidDebuff     += props.hitAvoidDebuff;
        combined.stoResDecayPerTurn += props.stoResDecayPerTurn;
      }
    }

    return combined;
  }
}
