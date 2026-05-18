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
 *   - Input state machine with ACTION_MENU, ITEM_SELECT, and COMBAT_PREVIEW overlays
 *   - Turn loop: player phase → enemy AI phase → back to player
 *   - Event trigger system: scripted events, degrading NPC timers
 *   - Aura application each turn
 *   - Win/lose detection
 *   - The Hand pursuer: uses getPursuerAction, petrifies adjacent units, CG placeholder
 *   - Battle preview overlay: DOM div above UI panel showing combat stats before confirm
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
 *     → click move tile   → MOVING → ACTION_MENU (unit in MOVED state)
 *     → click same unit   → IDLE (deselect)
 *   ACTION_MENU (unit in MOVED state, can cancel back to original position)
 *     → Attack btn        → attack range shown; click enemy → COMBAT_PREVIEW
 *     → Item btn          → ITEM_SELECT → use item → DONE → IDLE
 *     → Wait btn          → DONE → IDLE
 *     → Escape / click elsewhere → cancel move, unit returns to original pos → IDLE
 *   COMBAT_PREVIEW
 *     → Confirm btn       → COMBAT → execute, DONE → IDLE
 *     → Cancel btn        → return to ACTION_MENU
 *   COMBAT → resolve, apply, check petrify/death → IDLE
 *   ENEMY_PHASE → AI resolves all enemies → back to IDLE (player phase)
 *   GAME_OVER → no input
 *
 * All game state lives in: map (GameMap), turnManager, auraManager, eventTrigger, aiController.
 * Unit instances are in allUnits: Map<string, Unit>.
 * Graphics containers are in unitContainers: Map<string, Phaser.GameObjects.Container>.
 *
 * DOM overlays:
 *   #action-menu    — shown when unit is in MOVED state; buttons for Attack/Item/Wait
 *   #battle-preview — shown in COMBAT_PREVIEW; displays damage/hit stats with Confirm/Cancel
 */

import Phaser from 'phaser';
import { GameMap } from '../game/Map';
import { AuraManager } from '../game/Aura';
import { TurnManager, TurnPhase } from '../game/TurnManager';
import { AIController } from '../game/AI';
import { EventTrigger, EventType } from '../game/EventTrigger';
import { resolveCombat, calcDamage, calcHit } from '../game/Combat';
import {
  Unit,
  TileType,
  Team,
  UnitState,
  UnitClass,
  AuraTier,
} from '../game/Unit';
import type { AuraSource } from '../game/Aura';
import {
  createEirika, createTana, createVanessa, createSyrene,
  createEnemySoldier, createGorgon, createStrongGorgon, createDarkMage,
  createTheHand,
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
  syrenePetrifiedDialogue,
  tanaPetrifiedDialogue,
  handincomingDialogue,
  closingDialogue,
  mayaCalloutDialogue,
  fleeingNPCDialogue,
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
  ACTION_MENU     = 'ACTION_MENU',
  ITEM_SELECT     = 'ITEM_SELECT',
  ATTACK_TARGETING = 'ATTACK_TARGETING',
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
  private inputState:    InputState = InputState.IDLE;
  private selectedUnit:  Unit | null = null;
  private hoveredUnit:   Unit | null = null;
  private moveRange:     Set<string> = new Set();
  private attackRange:   Set<string> = new Set();

  // Pre-move position for cancel (CHANGE 3: cancel move returns unit here)
  private preMovePos: { x: number; y: number } | null = null;

  // Gorgon AI special behaviour flag (turn 4+)
  private gorgonTargetGatePriority: boolean = false;

  // Track whether The Hand intro dialogue has fired
  private handIntroFired: boolean = false;

  // DOM overlay references
  private actionMenuEl!:    HTMLElement;
  private battlePreviewEl!: HTMLElement;

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

    // Grab DOM overlays
    this.actionMenuEl    = document.getElementById('action-menu')!;
    this.battlePreviewEl = document.getElementById('battle-preview')!;

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
      soldier:       () => createEnemySoldier(this.nextEnemyIndex('soldier')),
      gorgon:        () => createGorgon(this.nextEnemyIndex('gorgon')),
      strong_gorgon: () => createStrongGorgon(this.nextEnemyIndex('strong_gorgon')),
      dark_mage:     () => createDarkMage(this.nextEnemyIndex('dark_mage')),
      the_hand:      () => createTheHand(),
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

    // The Hand intro dialogue (fires once)
    if (kind === 'the_hand' && !this.handIntroFired) {
      this.handIntroFired = true;
      this.showDialogue(handincomingDialogue, () => {});
    }
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

    // --- Turn 2: Maya hint dialogue + degrading timer ---
    this.eventTrigger.addTrigger(
      { type: EventType.TURN_START, turn: 2 },
      () => {
        // NPC hint dialogue (CHANGE 6)
        this.showDialogue(mayaCalloutDialogue, () => {});

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

    // --- Turn 3: Fleeing NPC hint dialogue + timers ---
    this.eventTrigger.addTrigger(
      { type: EventType.TURN_START, turn: 3 },
      () => {
        // NPC hint dialogue (CHANGE 6)
        this.showDialogue(fleeingNPCDialogue, () => {});

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

    // CHANGE 8: Aura tutorial — if Syrene is within 5 tiles of Vanessa's statue,
    // show yellow warning text above Syrene the first time this happens after Vanessa is petrified.
    this.checkAuraTutorialWarning();

    this.updatePhaseDisplay();
    this.refreshAllUnitGraphics();
    this.drawOverlays();
    this.inputState = InputState.IDLE;
    this.selectedUnit = null;
    this.moveRange.clear();
    this.attackRange.clear();
  }

  private endPlayerPhase(): void {
    this.hideActionMenu();
    this.hideBattlePreview();
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

      // The Hand uses its special pursuer AI
      if (enemy.isPursuer) {
        await this.runHandTurn(enemy);
        await this.delay(400);
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

  /**
   * Runs The Hand's turn using getPursuerAction.
   * Handles NPC/player petrification, dialogues, CG placeholder, aura adding.
   */
  private async runHandTurn(hand: Unit): Promise<void> {
    const allUnitsList = Array.from(this.allUnits.values());
    const action = this.aiController.getPursuerAction(hand, this.gameMap, allUnitsList);

    // Move
    if (action.moveTo.x !== hand.position.x || action.moveTo.y !== hand.position.y) {
      await this.animateUnitMove(hand, action.moveTo.x, action.moveTo.y);
    }

    // Process petrification targets
    for (const target of action.petrifyTargets) {
      if (
        target.state === UnitState.DEAD ||
        target.state === UnitState.PETRIFIED_SAFE ||
        target.state === UnitState.PETRIFIED_CAPTURED
      ) {
        continue;
      }

      if (target.team === Team.NPC) {
        // NPCs: instant petrify, no capture dialogue
        target.petrify(true);
        this.updateUnitGraphic(target);
        this.showFlashText(`${target.name} has been petrified.`);
        // Add aura source for NPC
        this.auraManager.addSource({
          position: { x: target.position.x, y: target.position.y },
          tier:     target.auraTier,
          unitName: target.name,
          radius:   this.getAuraRadius(target.auraTier),
        });
      } else if (target.team === Team.PLAYER && target.isNamedCharacter) {
        // Named player character: show petrification dialogue, CG placeholder, then petrify
        await this.petrifyNamedCharacter(target);
      } else if (target.team === Team.PLAYER && !target.isNamedCharacter) {
        // Non-named player: instant petrify
        target.petrify(true);
        this.updateUnitGraphic(target);
        this.auraManager.addSource({
          position: { x: target.position.x, y: target.position.y },
          tier:     target.auraTier,
          unitName: target.name,
          radius:   this.getAuraRadius(target.auraTier),
        });
      }
    }

    this.refreshAllUnitGraphics();
    this.drawOverlays();
    this.checkWinLose();
  }

  /**
   * Handles a named character being petrified by The Hand:
   * 1. Show character-specific petrification dialogue.
   * 2. Show CG placeholder.
   * 3. Petrify the unit (captured=true).
   * 4. Add their aura source.
   * 5. Special cases for Vanessa (CHANGE 5, 8) and Syrene.
   */
  private async petrifyNamedCharacter(unit: Unit): Promise<void> {
    return new Promise<void>(resolve => {
      // Choose dialogue
      let script: DialogueLine[];
      if (unit.id === 'vanessa') {
        script = vanessaPetrifiedDialogue;
      } else if (unit.id === 'syrene') {
        script = syrenePetrifiedDialogue;
      } else if (unit.id === 'tana') {
        script = tanaPetrifiedDialogue;
      } else {
        // Fallback: generic narrator line
        script = [{ speaker: 'Narrator', text: `${unit.name} has been petrified.`, portrait: '' }];
      }

      this.showDialogue(script, () => {
        // Show CG placeholder after dialogue
        this.showCGPlaceholder(unit.name, () => {
          // Actually petrify
          unit.petrify(true);
          this.updateUnitGraphic(unit);
          this.eventTrigger.checkTriggers(EventType.UNIT_PETRIFIED, { unitId: unit.id });

          // Add aura source
          this.auraManager.addSource({
            position: { x: unit.position.x, y: unit.position.y },
            tier:     unit.auraTier,
            unitName: unit.name,
            radius:   this.getAuraRadius(unit.auraTier),
          });

          // CHANGE 5: If Vanessa was just petrified, check if Syrene is within 5 tiles
          if (unit.id === 'vanessa') {
            const syrene = this.allUnits.get('syrene');
            if (syrene) {
              const dist =
                Math.abs(syrene.position.x - unit.position.x) +
                Math.abs(syrene.position.y - unit.position.y);
              if (dist <= 5) {
                const syreneDialog: DialogueLine[] = [
                  {
                    speaker: 'Syrene',
                    text:    'Vanessa... The aura — I can feel it weakening me!',
                    portrait: 'syrene',
                  },
                ];
                this.showDialogue(syreneDialog, () => {
                  this.drawOverlays();
                  resolve();
                });
                return;
              }
            }
          }

          // Eirika captured → game over
          if (unit.id === 'eirika') {
            this.triggerGameOver('Eirika has been captured!');
          }

          this.drawOverlays();
          resolve();
        });
      });
    });
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

          break;
        }
      }
    }
  }

  private getAuraRadius(tier: AuraTier): number {
    const map: Record<number, number> = { 3: 6, 2: 5, 1: 4 };
    return map[tier] ?? 4;
  }

  // ==========================================================================
  // CHANGE 8: Aura tutorial warning
  // ==========================================================================

  private auraTutorialShown: boolean = false;

  private checkAuraTutorialWarning(): void {
    if (this.auraTutorialShown) return;
    const vanessa = this.allUnits.get('vanessa');
    if (!vanessa || vanessa.state === UnitState.ACTIVE) return; // not yet petrified

    const syrene = this.allUnits.get('syrene');
    if (!syrene || syrene.state !== UnitState.ACTIVE) return;

    const dist =
      Math.abs(syrene.position.x - vanessa.position.x) +
      Math.abs(syrene.position.y - vanessa.position.y);
    if (dist > 5) return;

    this.auraTutorialShown = true;

    // Show yellow floating text above Syrene
    const px = syrene.position.x * TILE_SIZE + TILE_SIZE / 2;
    const py = syrene.position.y * TILE_SIZE - 8;
    const label = this.add.text(px, py, 'STO-RES -1/turn', {
      fontSize:        '11px',
      color:           '#ffee00',
      fontFamily:      'monospace',
      fontStyle:       'bold',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1);

    this.tweens.add({
      targets:  label,
      y:        py - 30,
      alpha:    0,
      duration: 3000,
      ease:     'Linear',
      onComplete: () => { label.destroy(); },
    });
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
    this.hideActionMenu();
    this.hideBattlePreview();
    this.moveRange.clear();
    this.attackRange.clear();
    this.drawOverlays();

    this.showDialogue(closingDialogue, () => {
      this.showEndScreen('Chapter 1 Complete!', 0x224422);
    });
  }

  private triggerGameOver(reason: string): void {
    this.inputState = InputState.GAME_OVER;
    this.hideActionMenu();
    this.hideBattlePreview();
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
  // CHANGE 7: CG placeholder
  // ==========================================================================

  /**
   * Shows a full-screen black overlay with a grey placeholder rectangle
   * representing the CG artwork for a petrified named character.
   * Dismisses on click or spacebar, then calls onDismiss.
   */
  showCGPlaceholder(characterName: string, onDismiss: () => void): void {
    // Full black overlay
    const overlay = this.add.rectangle(
      0, 0,
      this.scale.width, this.scale.height,
      0x000000, 1,
    ).setOrigin(0, 0).setDepth(100).setInteractive();

    // Grey CG placeholder rectangle centred on screen
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const cgBox = this.add.rectangle(cx, cy - 20, 400, 300, 0x333333)
      .setOrigin(0.5, 0.5).setDepth(101);

    // Main text
    const titleText = this.add.text(cx, cy - 20, `${characterName} — Petrification CG`, {
      fontSize:   '18px',
      color:      '#ffffff',
      fontFamily: 'monospace',
      align:      'center',
    }).setOrigin(0.5, 0.5).setDepth(102);

    // Sub-text
    const subText = this.add.text(cx, cy + 20, '(CG artwork pending)', {
      fontSize:   '13px',
      color:      '#888888',
      fontFamily: 'monospace',
      align:      'center',
    }).setOrigin(0.5, 0.5).setDepth(102);

    // Dismiss hint
    const hintText = this.add.text(cx, cy + 120, '[Click or Space to continue]', {
      fontSize:   '11px',
      color:      '#555566',
      fontFamily: 'monospace',
      align:      'center',
    }).setOrigin(0.5, 0.5).setDepth(102);

    const dismiss = (): void => {
      overlay.destroy();
      cgBox.destroy();
      titleText.destroy();
      subText.destroy();
      hintText.destroy();
      this.input.keyboard?.off('keydown-SPACE', dismiss);
      onDismiss();
    };

    overlay.on('pointerdown', dismiss);
    this.input.keyboard?.once('keydown-SPACE', dismiss);
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
  // CHANGE 3: Action menu (DOM overlay)
  // ==========================================================================

  /**
   * Shows the action menu near the unit (post-move).
   * Buttons: Attack (if targets exist), Item (if usable items), Wait.
   */
  private showActionMenu(unit: Unit): void {
    this.inputState = InputState.ACTION_MENU;

    // Position near the unit, offset right and slightly above, clamped to canvas
    const canvasEl = this.game.canvas;
    const canvasRect = canvasEl.getBoundingClientRect();
    const parentRect = canvasEl.parentElement!.getBoundingClientRect();

    const tilePixelX = unit.position.x * TILE_SIZE + TILE_SIZE;
    const tilePixelY = unit.position.y * TILE_SIZE;

    // Clamp so menu doesn't go off the right edge
    const menuWidth  = 120;
    const clampedX   = Math.min(tilePixelX, MAP_COLS * TILE_SIZE - menuWidth);
    const clampedY   = Math.max(0, Math.min(tilePixelY, MAP_HEIGHT - 120));

    // Offset by canvas position relative to parent
    const offsetX = canvasRect.left - parentRect.left;
    const offsetY = canvasRect.top  - parentRect.top;

    this.actionMenuEl.style.left = `${clampedX + offsetX}px`;
    this.actionMenuEl.style.top  = `${clampedY + offsetY}px`;

    // Build button HTML
    const attackRange = this.gameMap.getAttackRange(unit);
    const hasTargets = this.getValidAttackTargets(unit, attackRange).length > 0;
    const hasItems   = unit.items.some(i => i.uses > 0);

    let html = '';

    if (hasTargets) {
      html += `<button id="amenu-attack">Attack</button>`;
    }
    if (hasItems) {
      html += `<button id="amenu-item">Item</button>`;
    }
    html += `<button id="amenu-wait">Wait</button>`;

    this.actionMenuEl.innerHTML = html;
    this.actionMenuEl.style.display = 'block';

    // Bind handlers
    if (hasTargets) {
      document.getElementById('amenu-attack')!.addEventListener('click', () => {
        this.onActionMenuAttack(unit);
      }, { once: true });
    }
    if (hasItems) {
      document.getElementById('amenu-item')!.addEventListener('click', () => {
        this.onActionMenuItem(unit);
      }, { once: true });
    }
    document.getElementById('amenu-wait')!.addEventListener('click', () => {
      this.onActionMenuWait(unit);
    }, { once: true });
  }

  private hideActionMenu(): void {
    this.actionMenuEl.style.display = 'none';
    this.actionMenuEl.innerHTML = '';
  }

  /** Returns enemy units in range from the unit's current position. The Hand is excluded. */
  private getValidAttackTargets(unit: Unit, attackRange?: Set<string>): Unit[] {
    const range = attackRange ?? this.gameMap.getAttackRange(unit);
    const targets: Unit[] = [];
    for (const key of range) {
      const [tx, ty] = key.split(',').map(Number);
      const occ = this.gameMap.getUnit(tx, ty);
      if (
        occ &&
        occ.team === Team.ENEMY &&
        occ.state !== UnitState.DEAD &&
        occ.state !== UnitState.PETRIFIED_SAFE &&
        occ.state !== UnitState.PETRIFIED_CAPTURED &&
        !occ.isPursuer   // CHANGE 5: The Hand cannot be targeted
      ) {
        targets.push(occ);
      }
    }
    return targets;
  }

  private onActionMenuAttack(unit: Unit): void {
    this.hideActionMenu();
    // Show attack range, enter targeting mode
    this.attackRange = this.gameMap.getAttackRange(unit);
    this.inputState  = InputState.ATTACK_TARGETING;
    this.drawOverlays();
  }

  private onActionMenuItem(unit: Unit): void {
    this.hideActionMenu();
    this.inputState = InputState.ITEM_SELECT;
    this.showItemSelectMenu(unit);
  }

  private onActionMenuWait(unit: Unit): void {
    this.hideActionMenu();
    unit.state    = UnitState.DONE;
    unit.hasActed = true;
    this.selectedUnit = null;
    this.moveRange.clear();
    this.attackRange.clear();
    this.inputState = InputState.IDLE;
    this.updateUnitGraphic(unit);
    this.drawOverlays();
  }

  // ==========================================================================
  // CHANGE 3: Item select (simple inline approach using flash text + auto-use)
  // ==========================================================================

  /**
   * Shows an item selection menu near the unit.
   * For MVP: lists items with uses > 0, clicking one uses it, ends the unit's turn.
   */
  private showItemSelectMenu(unit: Unit): void {
    const usableItems = unit.items.filter(i => i.uses > 0);
    if (usableItems.length === 0) {
      this.deselectUnit();
      return;
    }

    // Build menu HTML in the action-menu div
    let html = '';
    usableItems.forEach((item, idx) => {
      html += `<button id="item-btn-${idx}">${item.name} (${item.uses}/${item.maxUses})</button>`;
    });
    html += `<button id="item-btn-cancel">Cancel</button>`;

    this.actionMenuEl.innerHTML = html;
    this.actionMenuEl.style.display = 'block';

    // Position near the unit
    const canvasEl  = this.game.canvas;
    const canvasRect = canvasEl.getBoundingClientRect();
    const parentRect = canvasEl.parentElement!.getBoundingClientRect();
    const offsetX    = canvasRect.left - parentRect.left;
    const offsetY    = canvasRect.top  - parentRect.top;
    const tilePixelX = unit.position.x * TILE_SIZE + TILE_SIZE;
    const tilePixelY = unit.position.y * TILE_SIZE;
    this.actionMenuEl.style.left = `${tilePixelX + offsetX}px`;
    this.actionMenuEl.style.top  = `${tilePixelY + offsetY}px`;

    usableItems.forEach((_item, idx) => {
      document.getElementById(`item-btn-${idx}`)!.addEventListener('click', () => {
        this.hideActionMenu();
        this.useItem(unit, idx);
      }, { once: true });
    });
    document.getElementById('item-btn-cancel')!.addEventListener('click', () => {
      this.hideActionMenu();
      // Return to action menu
      this.showActionMenu(unit);
    }, { once: true });
  }

  /** Uses the item at the given index in unit.items (filtered to usable items). */
  private useItem(unit: Unit, usableIndex: number): void {
    const usableItems = unit.items.filter(i => i.uses > 0);
    const item = usableItems[usableIndex];
    if (!item) return;

    // Restore HP
    const healed = Math.min(item.healAmount, unit.stats.maxHp - unit.stats.hp);
    unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + item.healAmount);
    item.uses--;

    this.showFlashText(`${unit.name} uses ${item.name}! +${healed} HP`);

    // End unit's turn
    unit.state    = UnitState.DONE;
    unit.hasActed = true;
    this.selectedUnit = null;
    this.moveRange.clear();
    this.attackRange.clear();
    this.inputState = InputState.IDLE;
    this.updateUnitGraphic(unit);
    this.drawOverlays();
  }

  // ==========================================================================
  // CHANGE 4: Battle preview overlay
  // ==========================================================================

  /**
   * Populates and shows the #battle-preview DOM overlay.
   * Uses calcDamage/calcHit to display expected outcome.
   * Shows "—" for defender stats if they cannot counter.
   */
  private showBattlePreview(attacker: Unit, defender: Unit): void {
    const atkWeapon = attacker.getEquippedWeapon();
    const defWeapon = defender.getEquippedWeapon();

    const atkDmg = atkWeapon ? calcDamage(attacker, defender, this.gameMap) : 0;
    const atkHit = atkWeapon ? calcHit(attacker, defender, this.gameMap) : 0;

    // Check if defender can counter
    let canCounter = false;
    if (defWeapon) {
      const dx   = Math.abs(attacker.position.x - defender.position.x);
      const dy   = Math.abs(attacker.position.y - defender.position.y);
      const dist = dx + dy;
      canCounter = dist >= defWeapon.minRange && dist <= defWeapon.maxRange;
    }

    const defDmgStr = canCounter ? String(calcDamage(defender, attacker, this.gameMap)) : '—';
    const defHitStr = canCounter ? `${calcHit(defender, attacker, this.gameMap)}%` : '—';

    const atkWeaponName = atkWeapon?.name ?? '—';
    const defWeaponName = defWeapon?.name ?? '—';

    this.battlePreviewEl.innerHTML = `
      <div class="bp-row">
        <div class="bp-side">
          <span class="bp-name">${attacker.name}</span>
          &nbsp;<span class="bp-stat">${atkWeaponName}</span><br>
          DMG: <span class="bp-stat">${atkDmg}</span>
          &nbsp;&nbsp;HIT: <span class="bp-stat">${atkHit}%</span>
        </div>
        <div class="bp-vs">vs</div>
        <div class="bp-side">
          <span class="bp-name">${defender.name}</span>
          &nbsp;<span class="bp-stat">${defWeaponName}</span><br>
          DMG: <span class="bp-stat">${defDmgStr}</span>
          &nbsp;&nbsp;HIT: <span class="bp-stat">${defHitStr}</span>
        </div>
      </div>
      <div class="bp-buttons">
        <button id="bp-confirm">Confirm</button>
        <button id="bp-cancel">Cancel</button>
      </div>
    `;

    this.battlePreviewEl.style.display = 'block';

    document.getElementById('bp-confirm')!.addEventListener('click', () => {
      this.hideBattlePreview();
      this.confirmCombat(attacker, defender);
    }, { once: true });

    document.getElementById('bp-cancel')!.addEventListener('click', () => {
      this.hideBattlePreview();
      this.cancelCombatPreview();
    }, { once: true });
  }

  private hideBattlePreview(): void {
    this.battlePreviewEl.style.display = 'none';
    this.battlePreviewEl.innerHTML = '';
  }

  private confirmCombat(attacker: Unit, defender: Unit): void {
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
  }

  /** Cancel from COMBAT_PREVIEW → returns to ACTION_MENU. */
  private cancelCombatPreview(): void {
    
    this.attackRange.clear();
    this.moveRange.clear();
    this.drawOverlays();
    // Re-show action menu for the selected unit
    if (this.selectedUnit) {
      this.showActionMenu(this.selectedUnit);
    } else {
      this.inputState = InputState.IDLE;
    }
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

    // Escape key: cancel move if unit is in ACTION_MENU state
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.inputState === InputState.ACTION_MENU || this.inputState === InputState.ATTACK_TARGETING) {
        this.cancelMove();
      } else if (this.inputState === InputState.COMBAT_PREVIEW) {
        this.hideBattlePreview();
        this.cancelCombatPreview();
      } else if (this.inputState === InputState.ITEM_SELECT) {
        this.hideActionMenu();
        if (this.selectedUnit) this.showActionMenu(this.selectedUnit);
      }
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

    switch (this.inputState) {
      case InputState.IDLE:
        this.handleIdleClick(col, row, clickedUnit);
        break;

      case InputState.UNIT_SELECTED:
        this.handleSelectedClick(col, row, clickedUnit);
        break;

      case InputState.ACTION_MENU:
        // Click elsewhere (not on action menu DOM) → cancel move
        this.cancelMove();
        break;

      case InputState.ATTACK_TARGETING:
        this.handleAttackTargetingClick(col, row, clickedUnit);
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
    clickedUnit: Unit | null,
  ): void {
    const clickKey = `${col},${row}`;

    // Deselect: click same unit
    if (clickedUnit && clickedUnit.id === this.selectedUnit?.id) {
      this.deselectUnit();
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

  /**
   * Handle click during ATTACK_TARGETING: if enemy in range clicked → show battle preview.
   * If clicked elsewhere → return to action menu.
   */
  private handleAttackTargetingClick(
    col:         number,
    row:         number,
    clickedUnit: Unit | null,
  ): void {
    const clickKey = `${col},${row}`;
    if (
      clickedUnit &&
      clickedUnit.team === Team.ENEMY &&
      !clickedUnit.isPursuer &&
      this.attackRange.has(clickKey) &&
      clickedUnit.state !== UnitState.DEAD &&
      clickedUnit.state !== UnitState.PETRIFIED_SAFE &&
      clickedUnit.state !== UnitState.PETRIFIED_CAPTURED
    ) {
      
      this.inputState = InputState.COMBAT_PREVIEW;
      this.attackRange.clear();
      this.drawOverlays();
      this.showBattlePreview(this.selectedUnit!, clickedUnit);
    } else {
      // Clicked non-target: return to action menu
      this.attackRange.clear();
      this.drawOverlays();
      if (this.selectedUnit) {
        this.showActionMenu(this.selectedUnit);
      } else {
        this.inputState = InputState.IDLE;
      }
    }
  }

  private selectUnit(unit: Unit): void {
    this.selectedUnit = unit;
    this.moveRange    = this.gameMap.getMovementRange(unit);
    this.attackRange  = this.gameMap.getAttackRange(unit, this.moveRange);
    this.inputState   = InputState.UNIT_SELECTED;
    this.updateUnitInfoPanel(unit);
    this.drawOverlays();
  }

  private deselectUnit(): void {
    this.selectedUnit = null;
    this.moveRange.clear();
    this.attackRange.clear();
    this.preMovePos   = null;
    this.inputState   = InputState.IDLE;
    this.updateUnitInfoPanel(null);
    this.drawOverlays();
  }

  /**
   * Cancel a move: return the unit to its pre-move position.
   * Called when player presses Escape or clicks outside the action menu.
   */
  private cancelMove(): void {
    this.hideActionMenu();
    this.hideBattlePreview();

    if (this.selectedUnit && this.preMovePos) {
      const unit = this.selectedUnit;
      this.gameMap.moveUnit(unit, this.preMovePos.x, this.preMovePos.y);
      unit.state   = UnitState.ACTIVE;
      unit.hasMoved = false;
      this.updateUnitGraphic(unit);
    }

    this.selectedUnit = null;
    this.moveRange.clear();
    this.attackRange.clear();
    this.preMovePos   = null;
    this.inputState   = InputState.IDLE;
    this.updateUnitInfoPanel(null);
    this.drawOverlays();
  }

  private moveSelectedUnit(col: number, row: number): void {
    const unit = this.selectedUnit;
    if (!unit) return;

    // Save pre-move position for potential cancel
    this.preMovePos = { x: unit.position.x, y: unit.position.y };

    this.inputState = InputState.MOVING;

    this.animateUnitMove(unit, col, row).then(() => {
      unit.hasMoved = true;
      unit.state    = UnitState.MOVED;

      // Check NPC adjacency for timer success
      this.checkAdjacentNPCs(unit);

      // Check escape — if Eirika hits escape, chapter clear
      this.checkEscape(unit);
      if (this.inputState === InputState.GAME_OVER) return;

      // Clear movement range; show action menu
      this.moveRange.clear();
      this.attackRange.clear();
      this.drawOverlays();
      this.updateUnitInfoPanel(unit);
      this.showActionMenu(unit);
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
