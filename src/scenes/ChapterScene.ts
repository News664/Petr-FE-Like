/*
 * src/scenes/ChapterScene.ts
 * Main gameplay scene for Petr-FE-Like — Chapter 1.
 *
 * Responsibilities:
 *   - Render map tiles using Phaser Graphics (coloured rectangles by tile type)
 *   - Render highlight overlays: movement=blue, attack=red, aura=dark-red tint
 *   - Render units as team-coloured containers with name, HP bar, STO-RES bar
 *   - Petrified units rendered as grey with "STONE" label
 *   - Pre-placed aura statue rendered as dark grey with skull
 *   - Bottom UI panel: hovered/selected unit stats, End Turn button, phase/turn display
 *   - Input state machine (IDLE → UNIT_SELECTED → UNIT_MOVED → COMBAT)
 *   - Turn loop: player phase → enemy AI phase → back to player
 *   - Event trigger system: scripted events, degrading NPC timers
 *   - Aura application each turn
 *   - Win/lose detection
 *
 * Game constants:
 *   TILE_SIZE = 48   MAP_COLS = 20   MAP_ROWS = 14
 *   MAP_HEIGHT = 672   UI_HEIGHT = 96   GAME_HEIGHT = 768
 *
 * Coordinate conventions:
 *   Tile (x=col, y=row), origin top-left.
 *   Pixel = (col * 48, row * 48) for map area.
 *
 * Input state machine:
 *   IDLE
 *     → click player unit → UNIT_SELECTED
 *   UNIT_SELECTED
 *     → click move tile   → MOVING → UNIT_MOVED
 *     → click attack tile → COMBAT_PREVIEW → (confirm) → COMBAT → IDLE
 *     → click same unit   → IDLE (deselect)
 *   UNIT_MOVED
 *     → click enemy       → COMBAT_PREVIEW → (confirm) → COMBAT → IDLE
 *     → End Turn btn      → mark unit DONE → IDLE
 *   COMBAT → resolve, apply, check petrify/death → IDLE
 *
 * All game state lives in: map (GameMap), turnManager, auraManager, eventTrigger, aiController.
 * Unit instances are in allUnits: Map<string, Unit>.
 * Graphics containers are in unitContainers: Map<string, Phaser.GameObjects.Container>.
 */

import Phaser from 'phaser';
import { GameMap } from '../game/Map';
import { AuraManager } from '../game/Aura';
import { TurnManager, TurnPhase } from '../game/TurnManager';
import { AIController } from '../game/AI';
import { EventTrigger, EventType } from '../game/EventTrigger';
import { resolveCombat } from '../game/Combat';
import {
  Unit,
  TileType,
  Team,
  UnitState,
  UnitClass,
  WeaponType,
} from '../game/Unit';
import type { AuraSource } from '../game/Aura';
import {
  createEirika, createTana, createVanessa, createSyrene,
  createEnemySoldier, createGorgon, createStrongGorgon, createDarkMage,
  createMaya, createFleeingGirlWest, createFleeingGirlEast,
} from '../data/characters';
import {
  CHAPTER1_MAP_GRID,
  UNIT_PLACEMENTS,
  INITIAL_AURA_SOURCES,
  ESCAPE_TILES,
  ENEMY_SPAWN_WAVES,
} from '../data/chapter1';
import {
  openingDialogue,
  mayaPetrifiedDialogue,
  gateHoldDialogue,
  vanessaPetrifiedDialogue,
  closingDialogue,
} from '../data/dialogue';
import type { DialogueLine } from '../data/dialogue';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TILE_SIZE   = 48;
const MAP_COLS    = 20;
const MAP_ROWS    = 14;
const MAP_HEIGHT  = MAP_ROWS * TILE_SIZE;   // 672
const UI_Y        = MAP_HEIGHT;             // 672
const UI_HEIGHT   = 96;

// Tile colours
const TILE_COLORS: Record<TileType, number> = {
  [TileType.GRASS]:    0x3d6b45,
  [TileType.ROAD]:     0x7a6040,
  [TileType.BUILDING]: 0x555555,
  [TileType.FOREST]:   0x2a5e2a,
  [TileType.GATE]:     0x7a6040,
  [TileType.WELL]:     0x3a5f8a,
  [TileType.ESCAPE]:   0xddcc33,
};

// Unit base colours
const TEAM_COLORS: Record<Team, number> = {
  [Team.PLAYER]: 0x2244cc,
  [Team.ENEMY]:  0xcc2222,
  [Team.NPC]:    0x228844,
};

// ---------------------------------------------------------------------------
// Input state
// ---------------------------------------------------------------------------

enum InputState {
  IDLE            = 'IDLE',
  UNIT_SELECTED   = 'UNIT_SELECTED',
  MOVING          = 'MOVING',
  UNIT_MOVED      = 'UNIT_MOVED',
  COMBAT_PREVIEW  = 'COMBAT_PREVIEW',
  COMBAT          = 'COMBAT',
  ENEMY_PHASE     = 'ENEMY_PHASE',
  GAME_OVER       = 'GAME_OVER',
}

// ---------------------------------------------------------------------------
// ChapterScene
// ---------------------------------------------------------------------------

export class ChapterScene extends Phaser.Scene {
  // Core game systems
  private gameMap!:       GameMap;
  private turnManager!:   TurnManager;
  private auraManager!:   AuraManager;
  private eventTrigger!:  EventTrigger;
  private aiController!:  AIController;

  // Unit registry
  private allUnits!: Map<string, Unit>;

  // Rendering
  private mapGraphics!:      Phaser.GameObjects.Graphics;
  private overlayGraphics!:  Phaser.GameObjects.Graphics;
  private unitContainers!:   Map<string, Phaser.GameObjects.Container>;

  // UI elements
  private uiText!:       Phaser.GameObjects.Text;
  private endTurnBtn!:   Phaser.GameObjects.Rectangle;
  private phaseText!:    Phaser.GameObjects.Text;
  private turnText!:     Phaser.GameObjects.Text;
  private combatFlash!:  Phaser.GameObjects.Text;

  // Input state machine
  private inputState:   InputState = InputState.IDLE;
  private selectedUnit: Unit | null = null;
  private hoveredUnit:  Unit | null = null;
  private moveRange:    Set<string> = new Set();
  private attackRange:  Set<string> = new Set();

  // Gorgon AI special behaviour flag (turn 4+)
  private gorgonTargetGatePriority: boolean = false;

  constructor() {
    super({ key: 'ChapterScene' });
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  create(): void {
    this.allUnits        = new Map();
    this.unitContainers  = new Map();
    this.gameMap         = new GameMap(MAP_COLS, MAP_ROWS, CHAPTER1_MAP_GRID);
    this.turnManager     = new TurnManager();
    this.auraManager     = new AuraManager();
    this.eventTrigger    = new EventTrigger();
    this.aiController    = new AIController();

    this.buildMap();
    this.spawnInitialUnits();
    this.placeInitialAuras();
    this.registerTriggers();
    this.buildUI();
    this.registerInput();

    // Show opening dialogue, then start turn 1
    this.showDialogue(openingDialogue, () => {
      this.showDialogue(gateHoldDialogue, () => {
        this.startPlayerPhase();
      });
    });
  }

  // ==========================================================================
  // Map rendering
  // ==========================================================================

  private buildMap(): void {
    this.mapGraphics = this.add.graphics();
    this.overlayGraphics = this.add.graphics();

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = this.gameMap.getTile(col, row);
        if (!tile) continue;

        const color = TILE_COLORS[tile.type];
        const px    = col * TILE_SIZE;
        const py    = row * TILE_SIZE;

        this.mapGraphics.fillStyle(color);
        this.mapGraphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Tile border
        this.mapGraphics.lineStyle(1, 0x000000, 0.2);
        this.mapGraphics.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Gate gets a darker inner outline
        if (tile.type === TileType.GATE) {
          this.mapGraphics.lineStyle(2, 0x4a3820, 0.9);
          this.mapGraphics.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
      }
    }
  }

  private drawOverlays(): void {
    this.overlayGraphics.clear();

    // Aura zones (dark red tint)
    for (const source of this.auraManager.sources) {
      const tiles = this.auraManager.getTilesInAura(source);
      this.overlayGraphics.fillStyle(0x880000, 0.22);
      for (const key of tiles) {
        const [tx, ty] = key.split(',').map(Number);
        this.overlayGraphics.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Movement range (blue)
    if (this.moveRange.size > 0) {
      this.overlayGraphics.fillStyle(0x4466ff, 0.35);
      for (const key of this.moveRange) {
        const [tx, ty] = key.split(',').map(Number);
        this.overlayGraphics.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Attack range (red)
    if (this.attackRange.size > 0) {
      this.overlayGraphics.fillStyle(0xff4444, 0.30);
      for (const key of this.attackRange) {
        // Don't draw attack overlay on top of move overlay
        if (!this.moveRange.has(key)) {
          const [tx, ty] = key.split(',').map(Number);
          this.overlayGraphics.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Selected unit highlight
    if (this.selectedUnit) {
      const { x, y } = this.selectedUnit.position;
      this.overlayGraphics.lineStyle(3, 0xffffff, 0.9);
      this.overlayGraphics.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    }
  }

  // ==========================================================================
  // Unit rendering
  // ==========================================================================

  private createUnitContainer(unit: Unit): Phaser.GameObjects.Container {
    const container = this.add.container(
      unit.position.x * TILE_SIZE + TILE_SIZE / 2,
      unit.position.y * TILE_SIZE + TILE_SIZE / 2,
    );

    this.refreshUnitContainer(unit, container);
    return container;
  }

  private refreshUnitContainer(unit: Unit, container: Phaser.GameObjects.Container): void {
    container.removeAll(true);

    const isStone =
      unit.state === UnitState.PETRIFIED_SAFE ||
      unit.state === UnitState.PETRIFIED_CAPTURED;

    // Base rectangle
    let color: number;
    if (isStone) {
      color = unit.state === UnitState.PETRIFIED_SAFE ? 0x888899 : 0x665566;
    } else if (unit.state === UnitState.DONE) {
      // Greyed-out when done
      color = 0x556677;
    } else {
      color = TEAM_COLORS[unit.team];
    }

    const rect = this.add.rectangle(0, 0, TILE_SIZE - 4, TILE_SIZE - 4, color);
    container.add(rect);

    if (isStone) {
      const stoneLabel = this.add.text(0, -2, 'STONE', {
        fontSize:   '9px',
        color:      '#ccccee',
        fontFamily: 'monospace',
        fontStyle:  'bold',
      }).setOrigin(0.5, 0.5);
      container.add(stoneLabel);
    } else {
      // Unit name (abbreviated to 4 chars for space)
      const nameLabel = this.add.text(0, -10, unit.name.slice(0, 4), {
        fontSize:   '9px',
        color:      '#ffffff',
        fontFamily: 'monospace',
      }).setOrigin(0.5, 0.5);
      container.add(nameLabel);

      // HP bar (green)
      const hpRatio  = unit.stats.hp / unit.stats.maxHp;
      const barW     = TILE_SIZE - 8;
      const hpBg     = this.add.rectangle(-barW / 2 + barW / 2, 12, barW, 4, 0x222222).setOrigin(0.5, 0.5);
      const hpBar    = this.add.rectangle(-barW / 2 + (barW * hpRatio) / 2, 12, barW * hpRatio, 4, 0x33cc33).setOrigin(0.5, 0.5);
      container.add(hpBg);
      container.add(hpBar);

      // STO-RES bar (teal), only if unit has stoRes
      if (unit.stats.maxStoRes > 0) {
        const stoRatio = unit.stats.stoRes / unit.stats.maxStoRes;
        const stoBg    = this.add.rectangle(0, 18, barW, 3, 0x222222).setOrigin(0.5, 0.5);
        const stoBar   = this.add.rectangle(
          -barW / 2 + (barW * stoRatio) / 2, 18,
          barW * stoRatio, 3, 0x33cccc,
        ).setOrigin(0.5, 0.5);
        container.add(stoBg);
        container.add(stoBar);
      }
    }
  }

  private spawnUnitGraphic(unit: Unit): void {
    const container = this.createUnitContainer(unit);
    this.unitContainers.set(unit.id, container);
  }

  private updateUnitGraphic(unit: Unit): void {
    const container = this.unitContainers.get(unit.id);
    if (!container) return;
    container.setPosition(
      unit.position.x * TILE_SIZE + TILE_SIZE / 2,
      unit.position.y * TILE_SIZE + TILE_SIZE / 2,
    );
    this.refreshUnitContainer(unit, container);
  }

  private destroyUnitGraphic(unitId: string): void {
    const container = this.unitContainers.get(unitId);
    if (container) {
      container.destroy();
      this.unitContainers.delete(unitId);
    }
  }

  // Pre-placed aura statue
  private spawnStatueGraphic(source: AuraSource): void {
    const px = source.position.x * TILE_SIZE + TILE_SIZE / 2;
    const py = source.position.y * TILE_SIZE + TILE_SIZE / 2;

    const container = this.add.container(px, py);
    const rect   = this.add.rectangle(0, 0, TILE_SIZE - 4, TILE_SIZE - 4, 0x444444);
    const label  = this.add.text(0, -6, '☠', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5);
    const nameLabel = this.add.text(0, 10, source.unitName.slice(0, 4), {
      fontSize: '8px', color: '#999999', fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5);

    container.add([rect, label, nameLabel]);
  }

  // ==========================================================================
  // Unit spawning and placement
  // ==========================================================================

  private spawnInitialUnits(): void {
    // Build unit instances from factories
    const factories: Record<string, () => Unit> = {
      eirika:        createEirika,
      tana:          createTana,
      vanessa:       createVanessa,
      syrene:        createSyrene,
      soldier_1:     () => createEnemySoldier(1),
      soldier_2:     () => createEnemySoldier(2),
      gorgon_1:      () => createGorgon(1),
      maya:          createMaya,
      fleeing_west:  createFleeingGirlWest,
      fleeing_east:  createFleeingGirlEast,
    };

    for (const placement of UNIT_PLACEMENTS) {
      const factory = factories[placement.unitId];
      if (!factory) continue;
      const unit = factory();
      this.allUnits.set(unit.id, unit);
      this.gameMap.placeUnit(unit, placement.x, placement.y);
      this.spawnUnitGraphic(unit);
    }
  }

  private placeInitialAuras(): void {
    for (const src of INITIAL_AURA_SOURCES) {
      this.auraManager.addSource(src);
      this.spawnStatueGraphic(src);
    }
  }

  private spawnEnemy(unitId: string, kind: string, x: number, y: number): void {
    const kindFactories: Record<string, () => Unit> = {
      soldier:      () => createEnemySoldier(this.nextEnemyIndex('soldier')),
      gorgon:       () => createGorgon(this.nextEnemyIndex('gorgon')),
      strong_gorgon: () => createStrongGorgon(this.nextEnemyIndex('strong_gorgon')),
      dark_mage:    () => createDarkMage(this.nextEnemyIndex('dark_mage')),
    };

    const factory = kindFactories[kind];
    if (!factory) return;

    // Avoid spawning on occupied tile
    if (this.gameMap.getUnit(x, y)) return;

    const unit = factory();
    // Override id with the placement-specified id for trigger lookup
    (unit as { id: string }).id = unitId;

    this.allUnits.set(unit.id, unit);
    this.gameMap.placeUnit(unit, x, y);
    this.spawnUnitGraphic(unit);
  }

  private enemyIndexCounters: Record<string, number> = {};

  private nextEnemyIndex(kind: string): number {
    this.enemyIndexCounters[kind] = (this.enemyIndexCounters[kind] ?? 0) + 1;
    return this.enemyIndexCounters[kind];
  }

  // ==========================================================================
  // Event triggers
  // ==========================================================================

  private registerTriggers(): void {
    // --- Spawn waves ---
    for (const wave of ENEMY_SPAWN_WAVES) {
      this.eventTrigger.addTrigger(
        { type: EventType.TURN_START, turn: wave.onTurn },
        () => {
          for (const entry of wave.entries) {
            this.spawnEnemy(entry.unitId, entry.kind, entry.x, entry.y);
          }
        },
      );
    }

    // --- Turn 2: Maya degrading timer ---
    this.eventTrigger.addTrigger(
      { type: EventType.TURN_START, turn: 2 },
      () => {
        this.eventTrigger.addTimer({
          npcId:          'maya',
          turnsRemaining: 3,
          onSuccess: () => {
            // Maya rescued: remove from map (Eirika gets Vulnerary — narrative only in MVP)
            const maya = this.allUnits.get('maya');
            if (maya) {
              this.gameMap.removeUnit(maya);
              this.destroyUnitGraphic('maya');
              this.allUnits.delete('maya');
              this.showFlashText('Maya rescued! Eirika receives Vulnerary.');
            }
          },
          onFail: () => {
            const maya = this.allUnits.get('maya');
            if (maya && maya.state === UnitState.ACTIVE) {
              this.showDialogue(mayaPetrifiedDialogue, () => {});
              maya.petrify(false);
              this.updateUnitGraphic(maya);
            }
          },
        });
      },
    );

    // --- Turn 3: Fleeing NPC timers ---
    this.eventTrigger.addTrigger(
      { type: EventType.TURN_START, turn: 3 },
      () => {
        this.eventTrigger.addTimer({
          npcId:          'fleeing_west',
          turnsRemaining: 2,
          onSuccess: () => {
            const unit = this.allUnits.get('fleeing_west');
            if (unit) {
              this.gameMap.removeUnit(unit);
              this.destroyUnitGraphic('fleeing_west');
              this.allUnits.delete('fleeing_west');
              this.showFlashText('Girl (W) escapes safely!');
            }
          },
          onFail: () => {
            const unit = this.allUnits.get('fleeing_west');
            if (unit && unit.state === UnitState.ACTIVE) {
              unit.petrify(false);
              this.updateUnitGraphic(unit);
              this.showFlashText('Girl (W) has been petrified!');
            }
          },
        });

        this.eventTrigger.addTimer({
          npcId:          'fleeing_east',
          turnsRemaining: 2,
          onSuccess: () => {
            const unit = this.allUnits.get('fleeing_east');
            if (unit) {
              this.gameMap.removeUnit(unit);
              this.destroyUnitGraphic('fleeing_east');
              this.allUnits.delete('fleeing_east');
              this.showFlashText('Girl (E) escapes safely!');
            }
          },
          onFail: () => {
            const unit = this.allUnits.get('fleeing_east');
            if (unit && unit.state === UnitState.ACTIVE) {
              unit.petrify(false);
              this.updateUnitGraphic(unit);
              this.showFlashText('Girl (E) has been petrified!');
            }
          },
        });
      },
    );

    // --- Turn 4: Gorgon AI priority shift ---
    this.eventTrigger.addTrigger(
      { type: EventType.TURN_START, turn: 4 },
      () => {
        this.gorgonTargetGatePriority = true;
      },
    );
  }

  // ==========================================================================
  // Turn management
  // ==========================================================================

  private startPlayerPhase(): void {
    const allUnitsList = Array.from(this.allUnits.values());
    this.turnManager.startPlayerPhase(allUnitsList);

    // Check triggers
    this.eventTrigger.checkTriggers(EventType.TURN_START, {
      turn: this.turnManager.currentTurn,
    });

    // Apply aura STO_RES decay to player units
    for (const unit of allUnitsList) {
      if (unit.team === Team.PLAYER && unit.state === UnitState.ACTIVE) {
        const effect = this.auraManager.getEffectForUnit(unit.position.x, unit.position.y);
        if (effect.stoResDecayPerTurn > 0) {
          unit.stats.stoRes = Math.max(0, unit.stats.stoRes - effect.stoResDecayPerTurn);
          if (unit.stats.stoRes <= 0) {
            this.petrifyUnit(unit, false);
          }
        }
      }
    }

    this.updatePhaseDisplay();
    this.refreshAllUnitGraphics();
    this.drawOverlays();
    this.inputState = InputState.IDLE;
    this.selectedUnit = null;
    this.moveRange.clear();
    this.attackRange.clear();
  }

  private endPlayerPhase(): void {
    this.turnManager.endPlayerPhase();
    this.eventTrigger.tickTimers();
    this.selectedUnit = null;
    this.moveRange.clear();
    this.attackRange.clear();
    this.drawOverlays();
    this.runEnemyPhase();
  }

  private async runEnemyPhase(): Promise<void> {
    this.inputState = InputState.ENEMY_PHASE;
    this.updatePhaseDisplay();

    const allUnitsList = Array.from(this.allUnits.values());
    this.turnManager.startEnemyPhase(allUnitsList);

    const enemies = allUnitsList.filter(
      u =>
        u.team === Team.ENEMY &&
        u.state !== UnitState.DEAD &&
        u.state !== UnitState.PETRIFIED_SAFE &&
        u.state !== UnitState.PETRIFIED_CAPTURED,
    );

    const playerUnits = allUnitsList.filter(u => u.team === Team.PLAYER);

    for (const enemy of enemies) {
      if (
        enemy.state === UnitState.DEAD ||
        enemy.state === UnitState.PETRIFIED_SAFE ||
        enemy.state === UnitState.PETRIFIED_CAPTURED
      ) {
        continue;
      }

      // Gorgon gate priority: prefer Vanessa/Syrene as targets from turn 4
      let targetPool = playerUnits;
      if (
        this.gorgonTargetGatePriority &&
        enemy.unitClass === UnitClass.GORGON
      ) {
        const gatePriority = playerUnits.filter(
          u => u.id === 'vanessa' || u.id === 'syrene',
        );
        if (gatePriority.length > 0) targetPool = gatePriority;
      }

      const action = this.aiController.getAction(enemy, this.gameMap, targetPool);

      // Move
      if (action.moveTo) {
        await this.animateUnitMove(enemy, action.moveTo.x, action.moveTo.y);
      }

      // Attack
      if (action.attackTarget) {
        const target = action.attackTarget;
        if (
          target.state !== UnitState.DEAD &&
          target.state !== UnitState.PETRIFIED_SAFE &&
          target.state !== UnitState.PETRIFIED_CAPTURED
        ) {
          this.executeCombat(enemy, target);
        }
      }

      // Small delay between enemy actions for readability
      await this.delay(400);
    }

    // After enemy phase, check petrified units for capture
    this.checkPetrifiedCapture();

    this.turnManager.endEnemyPhase();
    this.refreshAllUnitGraphics();
    this.startPlayerPhase();
  }

  /** Check if any petrified player unit has an adjacent enemy → capture. */
  private checkPetrifiedCapture(): void {
    const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

    for (const unit of this.allUnits.values()) {
      if (unit.state !== UnitState.PETRIFIED_SAFE) continue;
      if (unit.team !== Team.PLAYER) continue;

      for (const dir of dirs) {
        const nx = unit.position.x + dir.dx;
        const ny = unit.position.y + dir.dy;
        const occupant = this.gameMap.getUnit(nx, ny);
        if (occupant && occupant.team === Team.ENEMY) {
          unit.state = UnitState.PETRIFIED_CAPTURED;
          this.updateUnitGraphic(unit);

          // Add petrified unit as aura source
          this.auraManager.addSource({
            position: { x: unit.position.x, y: unit.position.y },
            tier:     unit.auraTier,
            unitName: unit.name,
            radius:   this.getAuraRadius(unit.auraTier),
          });

          if (unit.id === 'eirika') {
            this.triggerGameOver('Eirika has been captured!');
            return;
          }

          // Show relevant dialogue
          if (unit.id === 'vanessa') {
            this.showDialogue(vanessaPetrifiedDialogue, () => {});
          }

          break;
        }
      }
    }
  }

  private getAuraRadius(tier: import('../game/Unit').AuraTier): number {
    const map: Record<number, number> = { 3: 6, 2: 5, 1: 4 };
    return map[tier] ?? 4;
  }

  // ==========================================================================
  // Combat
  // ==========================================================================

  private executeCombat(attacker: Unit, defender: Unit): void {
    const result = resolveCombat(attacker, defender, this.gameMap);

    // Apply HP damage
    defender.stats.hp = Math.max(0, defender.stats.hp - result.hpDamageToDefender);
    attacker.stats.hp = Math.max(0, attacker.stats.hp - result.hpDamageToAttacker);

    // Apply STO_RES damage
    if (result.stoResDamage > 0) {
      defender.stats.stoRes = Math.max(0, defender.stats.stoRes - result.stoResDamage);
    }

    // Build flash text
    const parts: string[] = [];
    if (result.attackerHits.some(Boolean)) {
      if (result.stoResDamage > 0) {
        parts.push(`STO-RES -${result.stoResDamage}`);
      } else {
        parts.push(`${attacker.name} hits! ${result.hpDamageToDefender} dmg`);
      }
    } else {
      parts.push(`${attacker.name} misses!`);
    }
    if (result.defenderHits.length > 0) {
      if (result.defenderHits[0]) {
        parts.push(`Counter! ${result.hpDamageToAttacker} dmg`);
      } else {
        parts.push('Counter misses!');
      }
    }

    this.showFlashText(parts.join(' | '));

    // Check petrification
    if (defender.stats.stoRes <= 0 && defender.team === Team.PLAYER) {
      this.petrifyUnit(defender, false);
    }

    // Check deaths
    if (defender.stats.hp <= 0) {
      this.killUnit(defender);
    }
    if (attacker.stats.hp <= 0) {
      this.killUnit(attacker);
    }

    this.refreshAllUnitGraphics();
    this.drawOverlays();
    this.checkWinLose();
  }

  private petrifyUnit(unit: Unit, captured: boolean): void {
    unit.petrify(captured);
    this.eventTrigger.checkTriggers(EventType.UNIT_PETRIFIED, { unitId: unit.id });
    this.updateUnitGraphic(unit);

    if (captured) {
      this.auraManager.addSource({
        position: { x: unit.position.x, y: unit.position.y },
        tier:     unit.auraTier,
        unitName: unit.name,
        radius:   this.getAuraRadius(unit.auraTier),
      });
    }

    if (unit.id === 'eirika' && unit.state === UnitState.PETRIFIED_CAPTURED) {
      this.triggerGameOver('Eirika has been captured!');
    }
  }

  private killUnit(unit: Unit): void {
    unit.state = UnitState.DEAD;
    this.gameMap.removeUnit(unit);
    this.destroyUnitGraphic(unit.id);
    this.allUnits.delete(unit.id);
  }

  // ==========================================================================
  // Win / Lose
  // ==========================================================================

  private checkWinLose(): void {
    const eirika = this.allUnits.get('eirika');
    if (!eirika) {
      this.triggerGameOver('Eirika has fallen!');
      return;
    }

    if (eirika.state === UnitState.PETRIFIED_CAPTURED) {
      this.triggerGameOver('Eirika has been captured!');
    }
  }

  private checkEscape(unit: Unit): void {
    if (unit.id !== 'eirika') return;

    const onEscape = ESCAPE_TILES.some(
      t => t.x === unit.position.x && t.y === unit.position.y,
    );

    if (onEscape) {
      this.eventTrigger.checkTriggers(EventType.UNIT_REACHED_ESCAPE, { unitId: unit.id });
      this.triggerChapterClear();
    }
  }

  private triggerChapterClear(): void {
    this.inputState = InputState.GAME_OVER;
    this.moveRange.clear();
    this.attackRange.clear();
    this.drawOverlays();

    this.showDialogue(closingDialogue, () => {
      this.showEndScreen('Chapter 1 Complete!', 0x224422);
    });
  }

  private triggerGameOver(reason: string): void {
    this.inputState = InputState.GAME_OVER;
    this.moveRange.clear();
    this.attackRange.clear();
    this.drawOverlays();
    this.showEndScreen(`GAME OVER\n${reason}`, 0x441122);
  }

  private showEndScreen(message: string, bgColor: number): void {
    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      640, 200, bgColor, 0.92,
    ).setOrigin(0.5, 0.5);

    this.add.text(this.scale.width / 2, this.scale.height / 2, message, {
      fontSize:   '28px',
      color:      '#ffffff',
      fontFamily: 'monospace',
      align:      'center',
      wordWrap:   { width: 600 },
    }).setOrigin(0.5, 0.5);
  }

  // ==========================================================================
  // UI
  // ==========================================================================

  private buildUI(): void {
    // Background panel
    this.add.rectangle(0, UI_Y, this.scale.width, UI_HEIGHT, 0x111122)
      .setOrigin(0, 0);

    // Unit info text (left side)
    this.uiText = this.add.text(8, UI_Y + 6, '', {
      fontSize:   '13px',
      color:      '#ccccff',
      fontFamily: 'monospace',
      lineSpacing: 4,
    }).setOrigin(0, 0);

    // Phase and turn display (centre)
    this.phaseText = this.add.text(this.scale.width / 2, UI_Y + 8, '', {
      fontSize:   '16px',
      color:      '#ffee88',
      fontFamily: 'monospace',
      fontStyle:  'bold',
    }).setOrigin(0.5, 0);

    this.turnText = this.add.text(this.scale.width / 2, UI_Y + 30, '', {
      fontSize:   '13px',
      color:      '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    // End Turn button (right)
    this.endTurnBtn = this.add.rectangle(
      this.scale.width - 80, UI_Y + UI_HEIGHT / 2,
      120, 50, 0x334466,
    ).setOrigin(0.5, 0.5).setInteractive({ cursor: 'pointer' });

    this.add.text(
      this.scale.width - 80, UI_Y + UI_HEIGHT / 2,
      'End Turn', {
        fontSize:   '14px',
        color:      '#88aaff',
        fontFamily: 'monospace',
        fontStyle:  'bold',
      },
    ).setOrigin(0.5, 0.5);

    this.endTurnBtn.on('pointerover', () => {
      this.endTurnBtn.setFillStyle(0x556688);
    });
    this.endTurnBtn.on('pointerout', () => {
      this.endTurnBtn.setFillStyle(0x334466);
    });
    this.endTurnBtn.on('pointerdown', () => {
      if (this.turnManager.isPlayerPhase() && this.inputState !== InputState.GAME_OVER) {
        this.endPlayerPhase();
      }
    });

    // Combat flash text (centre map)
    this.combatFlash = this.add.text(
      this.scale.width / 2, MAP_HEIGHT / 2,
      '', {
        fontSize:   '20px',
        color:      '#ffffff',
        fontFamily: 'monospace',
        fontStyle:  'bold',
        stroke:     '#000000',
        strokeThickness: 4,
      },
    ).setOrigin(0.5, 0.5).setAlpha(0);

    this.updatePhaseDisplay();
  }

  private updatePhaseDisplay(): void {
    this.phaseText.setText(
      this.turnManager.phase === TurnPhase.PLAYER ? 'PLAYER PHASE' : 'ENEMY PHASE',
    );
    this.turnText.setText(`Turn ${this.turnManager.currentTurn}`);
  }

  private updateUnitInfoPanel(unit: Unit | null): void {
    if (!unit) {
      this.uiText.setText('');
      return;
    }

    const weapon    = unit.getEquippedWeapon();
    const weaponStr = weapon ? `${weapon.name} (${weapon.type})` : '—';
    const stateStr  = unit.state !== UnitState.ACTIVE ? ` [${unit.state}]` : '';

    this.uiText.setText(
      `${unit.name} (${unit.unitClass})${stateStr}\n` +
      `HP: ${unit.stats.hp}/${unit.stats.maxHp}  ` +
      (unit.stats.maxStoRes > 0 ? `STO: ${unit.stats.stoRes}/${unit.stats.maxStoRes}  ` : '') +
      `STR:${unit.stats.str} MAG:${unit.stats.mag} SKL:${unit.stats.skl} SPD:${unit.stats.spd}\n` +
      `Weapon: ${weaponStr}`,
    );
  }

  // ==========================================================================
  // Input
  // ==========================================================================

  private registerInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerMove(pointer);
    });
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // Only process if within map area
    if (pointer.y >= MAP_HEIGHT) return;

    const col = Math.floor(pointer.x / TILE_SIZE);
    const row = Math.floor(pointer.y / TILE_SIZE);

    if (!this.gameMap.isInBounds(col, row)) return;

    const unit = this.gameMap.getUnit(col, row);
    if (unit !== this.hoveredUnit) {
      this.hoveredUnit = unit;
      this.updateUnitInfoPanel(unit ?? this.selectedUnit);
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // Ignore clicks on UI panel or button (button handles itself)
    if (pointer.y >= MAP_HEIGHT) return;
    if (this.inputState === InputState.GAME_OVER) return;
    if (this.inputState === InputState.ENEMY_PHASE) return;
    if (this.inputState === InputState.MOVING) return;

    const col = Math.floor(pointer.x / TILE_SIZE);
    const row = Math.floor(pointer.y / TILE_SIZE);

    if (!this.gameMap.isInBounds(col, row)) return;

    const clickedUnit = this.gameMap.getUnit(col, row);
    const clickKey    = `${col},${row}`;

    switch (this.inputState) {
      case InputState.IDLE:
        this.handleIdleClick(col, row, clickedUnit);
        break;

      case InputState.UNIT_SELECTED:
        this.handleSelectedClick(col, row, clickKey, clickedUnit);
        break;

      case InputState.UNIT_MOVED:
        this.handleMovedClick(col, row, clickedUnit);
        break;

      default:
        break;
    }
  }

  private handleIdleClick(col: number, row: number, clickedUnit: Unit | null): void {
    if (
      clickedUnit &&
      clickedUnit.team === Team.PLAYER &&
      clickedUnit.state === UnitState.ACTIVE &&
      this.turnManager.isPlayerPhase()
    ) {
      this.selectUnit(clickedUnit);
    } else {
      // Check for NPC adjacent rescue
      if (clickedUnit && clickedUnit.team === Team.NPC) {
        this.eventTrigger.checkTimerSuccess(clickedUnit.id);
      }
      this.updateUnitInfoPanel(clickedUnit);
    }

    void col; void row;
  }

  private handleSelectedClick(
    col:         number,
    row:         number,
    clickKey:    string,
    clickedUnit: Unit | null,
  ): void {
    // Deselect: click same unit
    if (clickedUnit && clickedUnit.id === this.selectedUnit?.id) {
      this.deselectUnit();
      return;
    }

    // Click an attack tile with an enemy
    if (
      clickedUnit &&
      clickedUnit.team === Team.ENEMY &&
      this.attackRange.has(clickKey)
    ) {
      this.showCombatPreview(this.selectedUnit!, clickedUnit);
      return;
    }

    // Click a move tile
    if (this.moveRange.has(clickKey)) {
      this.moveSelectedUnit(col, row);
      return;
    }

    // Click another player unit → switch selection
    if (
      clickedUnit &&
      clickedUnit.team === Team.PLAYER &&
      clickedUnit.state === UnitState.ACTIVE
    ) {
      this.selectUnit(clickedUnit);
      return;
    }

    // Click elsewhere: deselect
    this.deselectUnit();
  }

  private handleMovedClick(
    _col:        number,
    _row:        number,
    clickedUnit: Unit | null,
  ): void {
    if (
      clickedUnit &&
      clickedUnit.team === Team.ENEMY
    ) {
      const weapon = this.selectedUnit?.getEquippedWeapon();
      if (!weapon || !this.selectedUnit) return;

      const dx   = Math.abs(this.selectedUnit.position.x - clickedUnit.position.x);
      const dy   = Math.abs(this.selectedUnit.position.y - clickedUnit.position.y);
      const dist = dx + dy;

      if (dist >= weapon.minRange && dist <= weapon.maxRange) {
        this.showCombatPreview(this.selectedUnit, clickedUnit);
      }
    }
  }

  private selectUnit(unit: Unit): void {
    this.selectedUnit = unit;
    this.moveRange   = this.gameMap.getMovementRange(unit);
    this.attackRange = this.gameMap.getAttackRange(unit, this.moveRange);
    this.inputState  = InputState.UNIT_SELECTED;
    this.updateUnitInfoPanel(unit);
    this.drawOverlays();
  }

  private deselectUnit(): void {
    this.selectedUnit = null;
    this.moveRange.clear();
    this.attackRange.clear();
    this.inputState = InputState.IDLE;
    this.updateUnitInfoPanel(null);
    this.drawOverlays();
  }

  private moveSelectedUnit(col: number, row: number): void {
    const unit = this.selectedUnit;
    if (!unit) return;

    this.inputState = InputState.MOVING;

    this.animateUnitMove(unit, col, row).then(() => {
      unit.hasMoved = true;
      unit.state    = UnitState.MOVED;

      // Check NPC adjacency for timer success
      this.checkAdjacentNPCs(unit);

      // Check escape
      this.checkEscape(unit);

      // Recompute attack range from new position
      this.moveRange.clear();
      this.attackRange = this.gameMap.getAttackRange(unit);
      this.inputState  = InputState.UNIT_MOVED;
      this.drawOverlays();
      this.updateUnitInfoPanel(unit);
    });
  }

  private checkAdjacentNPCs(unit: Unit): void {
    const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
    for (const dir of dirs) {
      const nx      = unit.position.x + dir.dx;
      const ny      = unit.position.y + dir.dy;
      const occupant = this.gameMap.getUnit(nx, ny);
      if (occupant && occupant.team === Team.NPC) {
        this.eventTrigger.checkTimerSuccess(occupant.id);
      }
    }
  }

  // ==========================================================================
  // Combat preview
  // ==========================================================================

  private showCombatPreview(attacker: Unit, defender: Unit): void {
    // In MVP: show a brief text and ask to confirm with another click
    // We'll auto-confirm after showing the flash for simplicity
    this.inputState = InputState.COMBAT_PREVIEW;

    const atkWeapon = attacker.getEquippedWeapon();
    const weaponType = atkWeapon?.type;
    const isGaze = weaponType === WeaponType.GAZE;

    const dmgLabel = isGaze ? 'STO dmg' : 'dmg';
    this.showFlashText(
      `Attack: ${attacker.name} → ${defender.name}  [click again to confirm]`,
    );

    // Allow second click to confirm
    this.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y >= MAP_HEIGHT) return;
      if (this.inputState !== InputState.COMBAT_PREVIEW) return;

      void dmgLabel;
      this.inputState = InputState.COMBAT;
      this.executeCombat(attacker, defender);

      // Mark attacker as done
      if (attacker.team === Team.PLAYER) {
        attacker.state    = UnitState.DONE;
        attacker.hasActed = true;
      }

      this.selectedUnit = null;
      this.moveRange.clear();
      this.attackRange.clear();
      this.inputState = InputState.IDLE;
      this.drawOverlays();
    });
  }

  // ==========================================================================
  // Movement animation
  // ==========================================================================

  private animateUnitMove(unit: Unit, toX: number, toY: number): Promise<void> {
    return new Promise(resolve => {
      const container = this.unitContainers.get(unit.id);
      if (!container) {
        this.gameMap.moveUnit(unit, toX, toY);
        this.updateUnitGraphic(unit);
        resolve();
        return;
      }

      const targetPx = toX * TILE_SIZE + TILE_SIZE / 2;
      const targetPy = toY * TILE_SIZE + TILE_SIZE / 2;

      this.gameMap.moveUnit(unit, toX, toY);

      this.tweens.add({
        targets:  container,
        x:        targetPx,
        y:        targetPy,
        duration: 150,
        ease:     'Linear',
        onComplete: () => {
          this.refreshUnitContainer(unit, container);
          resolve();
        },
      });
    });
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private refreshAllUnitGraphics(): void {
    for (const unit of this.allUnits.values()) {
      this.updateUnitGraphic(unit);
    }
  }

  private showFlashText(message: string): void {
    this.combatFlash.setText(message).setAlpha(1);
    this.tweens.add({
      targets:  this.combatFlash,
      alpha:    0,
      duration: 2000,
      delay:    500,
      ease:     'Linear',
    });
  }

  private showDialogue(script: DialogueLine[], onComplete: () => void): void {
    this.scene.launch('DialogueScene', { script, onComplete });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.time.delayedCall(ms, resolve);
    });
  }
}
