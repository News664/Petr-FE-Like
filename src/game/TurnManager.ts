/*
 * src/game/TurnManager.ts
 * Tracks turn phase and turn number for Petr-FE-Like.
 *
 * TurnPhase enum:
 *   PLAYER — human player's turn; player units can move/act
 *   ENEMY  — AI-controlled enemies act
 *   NPC    — scripted NPC movement events
 *
 * TurnManager:
 *   currentTurn  — increments at the end of each enemy phase (i.e., after enemy → back to player)
 *   phase        — current phase of play
 *
 * Phase flow per round:
 *   startPlayerPhase → (player actions) → endPlayerPhase
 *   → startEnemyPhase → (enemy AI) → endEnemyPhase
 *   → startPlayerPhase (next turn)
 *
 * Unit reset happens in startPlayerPhase (only player units are reset here;
 * enemy reset is handled by startEnemyPhase).
 */

import { Unit, Team, UnitState } from './Unit';

export enum TurnPhase {
  PLAYER = 'PLAYER',
  ENEMY  = 'ENEMY',
  NPC    = 'NPC',
}

export class TurnManager {
  currentTurn: number = 1;
  phase:       TurnPhase = TurnPhase.PLAYER;

  /** Reset all player units and switch to PLAYER phase. */
  startPlayerPhase(units: Unit[]): void {
    this.phase = TurnPhase.PLAYER;
    for (const unit of units) {
      if (unit.team === Team.PLAYER) {
        unit.resetTurn();
      }
    }
  }

  /** Transition to ENEMY phase. */
  endPlayerPhase(): void {
    this.phase = TurnPhase.ENEMY;
  }

  /** Reset all enemy units and begin enemy actions. */
  startEnemyPhase(units: Unit[]): void {
    this.phase = TurnPhase.ENEMY;
    for (const unit of units) {
      if (
        unit.team === Team.ENEMY &&
        unit.state !== UnitState.DEAD &&
        unit.state !== UnitState.PETRIFIED_SAFE &&
        unit.state !== UnitState.PETRIFIED_CAPTURED
      ) {
        unit.resetTurn();
      }
    }
  }

  /** Increment turn counter and prepare for next player phase. */
  endEnemyPhase(): void {
    this.currentTurn++;
    this.phase = TurnPhase.PLAYER;
  }

  isPlayerPhase(): boolean {
    return this.phase === TurnPhase.PLAYER;
  }
}
