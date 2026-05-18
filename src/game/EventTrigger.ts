/*
 * src/game/EventTrigger.ts
 * Scripted event system with turn-based triggers and degrading NPC rescue timers.
 *
 * EventType enum:
 *   TURN_START        — fired at the beginning of the specified turn
 *   TURN_END          — fired at the end of the specified turn
 *   UNIT_PETRIFIED    — fired when a unit's stoRes drops to 0 (unitId identifies who)
 *   UNIT_REACHED_ESCAPE — fired when a unit steps onto an ESCAPE tile
 *
 * TriggerCondition:
 *   type    — which event type to listen for
 *   turn?   — for turn-based triggers: only fires on this turn number
 *   unitId? — for unit-specific triggers: only fires for this unit's ID
 *
 * DegradingTimer:
 *   Tracks an NPC rescue window.
 *   turnsRemaining counts down each call to tickTimers().
 *   onSuccess fires if checkTimerSuccess(npcId) is called before timer expires.
 *   onFail fires when turnsRemaining reaches 0.
 *   onTick (FIX 5) — optional callback called each tick with the new turnsRemaining
 *                    value (after decrement, before onFail). Used to update HUD timers.
 *
 * Triggers fire at most once (fired flag prevents re-firing).
 */

export enum EventType {
  TURN_START          = 'TURN_START',
  TURN_END            = 'TURN_END',
  UNIT_PETRIFIED      = 'UNIT_PETRIFIED',
  UNIT_REACHED_ESCAPE = 'UNIT_REACHED_ESCAPE',
}

export interface TriggerCondition {
  type:    EventType;
  turn?:   number;
  unitId?: string;
}

export interface DegradingTimer {
  npcId:          string;
  turnsRemaining: number;
  onSuccess:      () => void;
  onFail:         () => void;
  /** FIX 5: Optional per-tick callback. Called after each decrement with the new
   *  turnsRemaining value so callers can update HUD countdown displays. */
  onTick?:        (remaining: number) => void;
}

interface RegisteredTrigger {
  condition: TriggerCondition;
  action:    () => void;
  fired:     boolean;
}

export class EventTrigger {
  private triggers: RegisteredTrigger[] = [];
  private timers:   DegradingTimer[]    = [];

  addTrigger(condition: TriggerCondition, action: () => void): void {
    this.triggers.push({ condition, action, fired: false });
  }

  /**
   * Checks all registered triggers against the given event.
   * Each trigger fires at most once.
   */
  checkTriggers(
    event:   EventType,
    context: { turn?: number; unitId?: string },
  ): void {
    for (const trigger of this.triggers) {
      if (trigger.fired) continue;
      if (trigger.condition.type !== event) continue;

      // If condition specifies a turn, it must match
      if (trigger.condition.turn !== undefined && trigger.condition.turn !== context.turn) {
        continue;
      }

      // If condition specifies a unitId, it must match
      if (trigger.condition.unitId !== undefined && trigger.condition.unitId !== context.unitId) {
        continue;
      }

      trigger.fired = true;
      trigger.action();
    }
  }

  addTimer(timer: DegradingTimer): void {
    // Replace existing timer for same NPC if present
    this.timers = this.timers.filter(t => t.npcId !== timer.npcId);
    this.timers.push(timer);
  }

  /**
   * Called once per player-turn end: decrements all active timers.
   * Fires onFail for any timer that hits 0.
   */
  tickTimers(): void {
    const expired: DegradingTimer[] = [];

    for (const timer of this.timers) {
      timer.turnsRemaining--;
      // FIX 5: Notify subscriber of remaining time (even if about to expire)
      if (timer.onTick) {
        timer.onTick(timer.turnsRemaining);
      }
      if (timer.turnsRemaining <= 0) {
        expired.push(timer);
      }
    }

    // Remove expired timers, then fire their callbacks
    this.timers = this.timers.filter(t => t.turnsRemaining > 0);
    for (const timer of expired) {
      timer.onFail();
    }
  }

  /**
   * Called when a player unit moves adjacent to the NPC with this id.
   * If a timer exists for this NPC, fires onSuccess and removes the timer.
   */
  checkTimerSuccess(npcId: string): void {
    const idx = this.timers.findIndex(t => t.npcId === npcId);
    if (idx === -1) return;

    const [timer] = this.timers.splice(idx, 1);
    timer.onSuccess();
  }
}
