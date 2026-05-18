/*
 * src/scenes/ChapterScene.ts
 * Main gameplay scene for Petr-FE-Like — Chapter 1.
 *
 * Responsibilities:
 *   - Render map tiles using Phaser Graphics (coloured rectangles by tile type)
 *   - CHANGE D: Render BREAKABLE_WALL tiles in 0x996633 (distinct from BUILDING 0x555555)
 *   - Render highlight overlays: movement=blue, attack=red, aura=dark-red tint
 *   - Render units as team-coloured containers with name, HP bar, STO-RES bar
 *   - Petrified units rendered as grey with "Statue" label (unified with decorative statues)
 *   - Pre-placed aura statue rendered as dark grey with skull
 *   - CHANGE E: Decorative statues rendered as dark grey rectangles with "◆" label
 *   - CHANGE H: Clicking a petrified unit or decorative statue shows a popup panel
 *   - CHANGE I: Clicking selected unit in MOVED state opens action menu (not deselect)
 *   - CHANGE J: Level-up flash text and stat panel after combat EXP awards
 *   - CHANGE K: The Hand spawn on turn 5 triggers breach guard petrification scripted sequence
 *   - CHANGE L: auraManager.sources click detection for pre-placed aura statues;
 *               WeakGorgon tutorial unit + opening inner-hall cutscene;
 *               HP=0 on player units → petrifyFromCombat (with defeat dialogue) instead of death
 *   - CHANGE M: Trade UI — swap/transfer items between adjacent player units
 *   - CHANGE N: Right-side floating status panel (top-right, 232×200px) replaces bottom unit info
 *   - CHANGE P: scriptedPetrify() — guaranteed live-petrification visual for opening sequence;
 *               variant stage-clear dialogues based on Tana/Vanessa/Syrene survival;
 *               showPetrifiedUnitPopup shows RES and STO-RES in two stat lines
 *   - FIX 2: petrifyFromCombat sets unit state/HP/grid immediately before async dialogue;
 *            awaitingPetrificationDialogue flag guards checkWinLose during Eirika dialogue
 *   - FIX 3: Clicking selected ACTIVE unit shows action menu (stand-ground option)
 *   - FIX 4: scriptedPetrify guard moved to (3,10); decorative statues visual-only
 *   - FIX 5: NPC timer countdown texts floated above sprites via onTick callback
 *   - FIX 6: Unified showStatuePopup replaces three separate popup methods
 *   - FIX 7: NPC-specific petrification dialogues for FleeingWest/FleeingEast onFail;
 *            Eirika game-over deferred behind awaitingPetrificationDialogue guard
 *   - FIX 8: dialogueActive flag blocks pointer input during dialogue
 *   - FIX 9: handleIdleClick NPC rescue requires adjacent player unit
 *   - BUG 1 FIX: Dialogue queue (dialogueQueue) prevents showDialogue from silently dropping
 *               a second call when DialogueScene is already running; maya.petrify moved inside callback
 *   - BUG 2 FIX: fleeing_east timer set to 1 turn (staggered vs fleeing_west=2) — east NPC is
 *               already inside the aura field and should expire one turn earlier
 *   - BUG 3 FIX: All statue labels unified to 'Statue' (was 'STONE' / 'Stat')
 *   - Input state machine with ACTION_MENU, ITEM_SELECT, TRADE, BREAK_WALL, COMBAT_PREVIEW overlays
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
 * Floating status panel (CHANGE N):
 *   Position: x=720, y=8 (top-right)
 *   Size: 232×200px, dark bg (0x1a1a2e, alpha 0.85), gold border
 *   Visible when unit selected or hovered; hidden otherwise
 *   Content: Name/Class/Lv, HP/STO bars, STR/SKL/SPD/DEF/RES, EXP, equipped weapon
 *   11px monospace font
 *
 * Coordinate conventions:
 *   Tile (x=col, y=row), origin top-left.
 *   Pixel = (col * 48, row * 48) for map area.
 *
 * Input state machine:
 *   IDLE
 *     → click player unit → UNIT_SELECTED
 *     → click petrified/statue/aura-statue → show popup (CHANGE H / CHANGE L)
 *   UNIT_SELECTED
 *     → click move tile   → MOVING → ACTION_MENU (unit in MOVED state)
 *     → click same unit   → IDLE (deselect)
 *   ACTION_MENU (unit in MOVED state, can cancel back to original position)
 *     → Attack btn        → attack range shown; click enemy → COMBAT_PREVIEW
 *     → Item btn          → ITEM_SELECT → use item → DONE → IDLE
 *     → Trade btn         → TRADE → swap items with adjacent ally → DONE → IDLE (CHANGE M)
 *     → Break Wall btn    → breaks adjacent BREAKABLE_WALL → DONE → IDLE (CHANGE D)
 *     → Wait btn          → DONE → IDLE
 *     → Escape / click elsewhere → cancel move, unit returns to original pos → IDLE
 *   COMBAT_PREVIEW
 *     → Confirm btn       → COMBAT → execute, DONE → IDLE
 *     → Cancel btn        → return to ACTION_MENU
 *   COMBAT → resolve, apply, EXP award, check level-up → IDLE
 *   ENEMY_PHASE → AI resolves all enemies → back to IDLE (player phase)
 *   GAME_OVER → no input
 *
 * All game state lives in: map (GameMap), turnManager, auraManager, eventTrigger, aiController.
 * Unit instances are in allUnits: Map<string, Unit>.
 * Graphics containers are in unitContainers: Map<string, Phaser.GameObjects.Container>.
 *
 * DOM overlays:
 *   #action-menu    — shown when unit is in MOVED state; Attack/Item/Trade/Wait/Break Wall
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
import type { LevelUpResult, ConsumableItem } from '../game/Unit';
import {
  createEirika, createTana, createVanessa, createSyrene,
  createEnemySoldier, createGorgon, createWeakGorgon, createStrongGorgon, createDarkMage,
  createTheHand,
  createMaya, createFleeingGirlWest, createFleeingGirlEast,
  createBreachGuard,
  VULNERARY, AMBER_SHARD,
} from '../data/characters';
import {
  CHAPTER1_MAP_GRID,
  UNIT_PLACEMENTS,
  INITIAL_AURA_SOURCES,
  ESCAPE_TILES,
  ENEMY_SPAWN_WAVES,
  DECORATIVE_STATUES,
} from '../data/chapter1';
import type { DecorativeStatue } from '../data/chapter1';
import {
  openingDialogue,
  weakGorgonOpeningDialogue,
  mayaPetrifiedDialogue,
  fleeingWestPetrifiedDialogue,
  fleeingEastPetrifiedDialogue,
  gateHoldDialogue,
  vanessaPetrifiedDialogue,
  syrenePetrifiedDialogue,
  tanaPetrifiedDialogue,
  handincomingDialogue,
  mayaCalloutDialogue,
  fleeingNPCDialogue,
  eirikaCombatPetrifiedDialogue,
  tanaCombatPetrifiedDialogue,
  vanessaCombatPetrifiedDialogue,
  syreneCombatPetrifiedDialogue,
  closingDialogue_allSurvived,
  closingDialogue_someLost,
  closingDialogue_tanaLost,
  closingDialogue_allLost,
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

// Tile colours — CHANGE D: BREAKABLE_WALL gets distinct brown colour
const TILE_COLORS: Record<TileType, number> = {
  [TileType.GRASS]:          0x3d6b45,
  [TileType.ROAD]:           0x7a6040,
  [TileType.BUILDING]:       0x555555,
  [TileType.FOREST]:         0x2a5e2a,
  [TileType.GATE]:           0x7a6040,
  [TileType.WELL]:           0x3a5f8a,
  [TileType.ESCAPE]:         0xddcc33,
  [TileType.BREAKABLE_WALL]: 0x996633,
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
  IDLE             = 'IDLE',
  UNIT_SELECTED    = 'UNIT_SELECTED',
  MOVING           = 'MOVING',
  ACTION_MENU      = 'ACTION_MENU',
  ITEM_SELECT      = 'ITEM_SELECT',
  TRADE            = 'TRADE',
  BREAK_WALL       = 'BREAK_WALL',
  ATTACK_TARGETING = 'ATTACK_TARGETING',
  COMBAT_PREVIEW   = 'COMBAT_PREVIEW',
  COMBAT           = 'COMBAT',
  ENEMY_PHASE      = 'ENEMY_PHASE',
  GAME_OVER        = 'GAME_OVER',
}

// ---------------------------------------------------------------------------
// FIX 6: Unified data type for statue / petrified-unit popups
// ---------------------------------------------------------------------------

interface StatuePopupInfo {
  name:        string;
  status:      'Captured' | 'Safe' | 'Environmental';
  stats?:      Unit['stats'];
  auraTier?:   AuraTier;
  auraRadius?: number;
  stoDecay?:   number;
  statDebuff?: number;
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

  // CHANGE E: Decorative statue containers
  private statueContainers: Phaser.GameObjects.Container[] = [];
  // Track decorative statue positions for click detection (CHANGE H)
  private decorativeStatueData: DecorativeStatue[] = [];

  // UI elements
  // CHANGE N: uiText/uiText2 replaced by floating statusPanel (top-right)
  private endTurnBtn!:   Phaser.GameObjects.Rectangle;
  private phaseText!:    Phaser.GameObjects.Text;
  private turnText!:     Phaser.GameObjects.Text;
  private combatFlash!:  Phaser.GameObjects.Text;

  // CHANGE N: Right-side floating status panel
  private statusPanel!:      Phaser.GameObjects.Container;
  private statusPanelText!:  Phaser.GameObjects.Text;

  // Input state machine
  private inputState:    InputState = InputState.IDLE;
  private selectedUnit:  Unit | null = null;
  private hoveredUnit:   Unit | null = null;
  private moveRange:     Set<string> = new Set();
  private attackRange:   Set<string> = new Set();

  // Pre-move position for cancel
  private preMovePos: { x: number; y: number } | null = null;

  // Gorgon AI special behaviour flag (turn 4+)
  private gorgonTargetGatePriority: boolean = false;

  // Track whether The Hand intro dialogue has fired
  private handIntroFired: boolean = false;

  // FIX 8: Block pointer input during dialogue
  private dialogueActive: boolean = false;
  // BUG 1 FIX: Queue for dialogues that arrive while one is already running
  private dialogueQueue: Array<{ script: DialogueLine[]; onComplete: () => void }> = [];

  // FIX 7 / FIX 2: Guard checkWinLose while Eirika's petrification dialogue is running
  private awaitingPetrificationDialogue: boolean = false;

  // FIX 5: NPC timer countdown text objects keyed by npcId
  private npcTimerTexts: Map<string, Phaser.GameObjects.Text> = new Map();

  // DOM overlay references
  private actionMenuEl!:    HTMLElement;
  private battlePreviewEl!: HTMLElement;

  // CHANGE H: Active popup container (statue / petrified unit info panel)
  private activePopup: Phaser.GameObjects.Container | null = null;

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
    this.spawnDecorativeStatues();
    this.registerTriggers();
    this.buildUI();
    this.registerInput();

    // Escape key to dismiss popup (CHANGE H)
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.activePopup) {
        this.closePopup();
        return;
      }
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

    // Show opening dialogue, then inner-hall cutscene (weak Gorgon), then start turn 1
    // CHANGE L: weakGorgonOpeningDialogue fires at chapter start before turn 1
    this.showDialogue(openingDialogue, () => {
      this.showDialogue(gateHoldDialogue, () => {
        this.showDialogue(weakGorgonOpeningDialogue, () => {
          // Scripted live petrification of SW guard (100% guaranteed, no RNG)
          // FIX 4: moved to (3,10) so guard is not blocking the exit corridor at (2,12)
          this.scriptedPetrify(3, 10, 'Guard', () => this.startPlayerPhase());
        });
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

        // CHANGE D: Breakable wall gets a distinctive cross-hatch hint
        if (tile.type === TileType.BREAKABLE_WALL) {
          this.mapGraphics.lineStyle(2, 0xcc9944, 0.7);
          this.mapGraphics.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        }
      }
    }
  }

  /**
   * Redraws only the tile at (col, row) — used after breakTile() to update a
   * BREAKABLE_WALL tile to GRASS without rebuilding the entire map.
   */
  private redrawTile(col: number, row: number): void {
    const tile = this.gameMap.getTile(col, row);
    if (!tile) return;
    const px    = col * TILE_SIZE;
    const py    = row * TILE_SIZE;
    const color = TILE_COLORS[tile.type];

    this.mapGraphics.fillStyle(color);
    this.mapGraphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    this.mapGraphics.lineStyle(1, 0x000000, 0.2);
    this.mapGraphics.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
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
      const stoneLabel = this.add.text(0, -2, 'Statue', {
        fontSize:   '9px',
        color:      '#888888',
        fontFamily: 'monospace',
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

  // CHANGE E: Decorative statues (dark grey rect with ◆ label)
  private spawnDecorativeStatues(): void {
    this.decorativeStatueData = [...DECORATIVE_STATUES];
    for (const statue of DECORATIVE_STATUES) {
      const px = statue.x * TILE_SIZE + TILE_SIZE / 2;
      const py = statue.y * TILE_SIZE + TILE_SIZE / 2;

      const container = this.add.container(px, py);
      const rect  = this.add.rectangle(0, 0, TILE_SIZE - 6, TILE_SIZE - 6, 0x444444);
      const icon  = this.add.text(0, -5, '◆', {
        fontSize: '14px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(0.5, 0.5);
      const lbl   = this.add.text(0, 10, 'Statue', {
        fontSize: '8px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(0.5, 0.5);

      container.add([rect, icon, lbl]);
      this.statueContainers.push(container);
    }
  }

  /**
   * CHANGE P: Scripted live-petrification of a tile position.
   * Plays a guaranteed visual (no RNG): white expanding circle → grey, then places a
   * decorative statue at (col, row) with the given label and registers it as clickable.
   *
   * Steps:
   *   1. Skip if there is already a unit at that tile.
   *   2. Tween a white Phaser Graphics circle that expands and transitions to grey (300 ms).
   *   3. Add a grey rectangle + "◆" label container at the tile — same as decorativeStatue rendering.
   *   4. Register the position in decorativeStatueData so it becomes clickable (CHANGE H).
   *   5. Call onDone() after the animation completes.
   */
  private scriptedPetrify(col: number, row: number, label: string, onDone: () => void): void {
    // 1. Skip if a unit already occupies the tile
    if (this.gameMap.getUnit(col, row)) {
      onDone();
      return;
    }

    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE + TILE_SIZE / 2;

    // 2. White expanding circle tween → grey (300 ms)
    const circleGfx = this.add.graphics().setDepth(61);
    circleGfx.fillStyle(0xffffff, 0.9);
    circleGfx.fillCircle(px, py, 4);

    this.tweens.add({
      targets:  circleGfx,
      alpha:    { from: 0.9, to: 0 },
      duration: 300,
      ease:     'Quad.easeOut',
      onUpdate: (_tween: Phaser.Tweens.Tween, _target: unknown, _key: string, current: number) => {
        const progress = 1 - current;          // 0 → 1 over the tween
        const radius   = 4 + progress * 20;    // expands from 4 to 24 px
        const colour   = progress > 0.5 ? 0xffffff : 0x888888;  // white → grey halfway
        circleGfx.clear();
        circleGfx.fillStyle(colour, current);
        circleGfx.fillCircle(px, py, radius);
      },
      onComplete: () => {
        circleGfx.destroy();

        // 3. Add decorative-statue container
        const container = this.add.container(px, py);
        const rect = this.add.rectangle(0, 0, TILE_SIZE - 6, TILE_SIZE - 6, 0x444444);
        const icon = this.add.text(0, -5, '◆', {
          fontSize: '14px', color: '#888888', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);
        const lbl = this.add.text(0, 10, 'Statue', {
          fontSize: '8px', color: '#888888', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);
        container.add([rect, icon, lbl]);
        this.statueContainers.push(container);

        // 4. Register in decorativeStatueData for click detection
        this.decorativeStatueData.push({ x: col, y: row, label });

        // 5. Invoke continuation
        onDone();
      },
    });
  }

  // ==========================================================================
  // Unit spawning and placement
  // ==========================================================================

  private spawnInitialUnits(): void {
    // Build unit instances from factories
    const factories: Record<string, () => Unit> = {
      eirika:          createEirika,
      tana:            createTana,
      vanessa:         createVanessa,
      syrene:          createSyrene,
      soldier_1:       () => createEnemySoldier(1),
      soldier_2:       () => createEnemySoldier(2),
      maya:            createMaya,
      fleeing_west:    createFleeingGirlWest,
      fleeing_east:    createFleeingGirlEast,
      guard_breach_1:  () => createBreachGuard(1),
      guard_breach_2:  () => createBreachGuard(2),
      // CHANGE L: Tutorial weak Gorgon in SW interior
      weak_gorgon:     createWeakGorgon,
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
      weak_gorgon:   () => createWeakGorgon(),
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
        this.showDialogue(mayaCalloutDialogue, () => {});

        // FIX 5: Create countdown text above Maya's sprite
        const mayaUnit = this.allUnits.get('maya');
        if (mayaUnit) {
          this.createNpcTimerText('maya', mayaUnit.position.x, mayaUnit.position.y, 3);
        }

        this.eventTrigger.addTimer({
          npcId:          'maya',
          turnsRemaining: 3,
          // FIX 5: onTick updates the countdown text
          onTick: (remaining) => {
            this.updateNpcTimerText('maya', remaining);
          },
          onSuccess: () => {
            this.removeNpcTimerText('maya');
            const maya = this.allUnits.get('maya');
            if (maya) {
              const rescuer = this.findAdjacentPlayerUnit(maya);
              this.gameMap.removeUnit(maya);
              this.destroyUnitGraphic('maya');
              this.allUnits.delete('maya');
              // CHANGE E: Give rescuing unit a Vulnerary if inventory not full
              if (rescuer) {
                const added = rescuer.addItem({ ...VULNERARY, uses: VULNERARY.uses });
                this.showFlashText(added
                  ? `Maya rescued! ${rescuer.name} receives Vulnerary.`
                  : 'Maya rescued! (Inventory full — Vulnerary dropped)');
              } else {
                this.showFlashText('Maya rescued! Eirika receives Vulnerary.');
              }
            }
          },
          onFail: () => {
            this.removeNpcTimerText('maya');
            const maya = this.allUnits.get('maya');
            if (maya && maya.state === UnitState.ACTIVE) {
              this.showDialogue(mayaPetrifiedDialogue, () => {
                maya.petrify(false);
                this.updateUnitGraphic(maya);
              });
            }
          },
        });
      },
    );

    // --- Turn 3: Fleeing NPC hint dialogue + timers ---
    this.eventTrigger.addTrigger(
      { type: EventType.TURN_START, turn: 3 },
      () => {
        this.showDialogue(fleeingNPCDialogue, () => {});

        // FIX 5: Create countdown texts above both fleeing NPCs
        const westUnit = this.allUnits.get('fleeing_west');
        if (westUnit) {
          this.createNpcTimerText('fleeing_west', westUnit.position.x, westUnit.position.y, 2);
        }
        const eastUnit = this.allUnits.get('fleeing_east');
        if (eastUnit) {
          this.createNpcTimerText('fleeing_east', eastUnit.position.x, eastUnit.position.y, 1);
        }

        this.eventTrigger.addTimer({
          npcId:          'fleeing_west',
          turnsRemaining: 2,
          // FIX 5: onTick updates countdown text
          onTick: (remaining) => {
            this.updateNpcTimerText('fleeing_west', remaining);
          },
          onSuccess: () => {
            this.removeNpcTimerText('fleeing_west');
            const unit = this.allUnits.get('fleeing_west');
            if (unit) {
              const rescuer = this.findAdjacentPlayerUnit(unit);
              this.gameMap.removeUnit(unit);
              this.destroyUnitGraphic('fleeing_west');
              this.allUnits.delete('fleeing_west');
              // CHANGE E: Give rescuing unit a Vulnerary
              if (rescuer) {
                const added = rescuer.addItem({ ...VULNERARY, uses: VULNERARY.uses });
                this.showFlashText(added
                  ? `Girl (W) escapes! ${rescuer.name} receives Vulnerary.`
                  : 'Girl (W) escapes safely! (Inventory full)');
              } else {
                this.showFlashText('Girl (W) escapes safely!');
              }
            }
          },
          onFail: () => {
            this.removeNpcTimerText('fleeing_west');
            // FIX 7: Show NPC-specific dialogue before petrifying
            const unit = this.allUnits.get('fleeing_west');
            if (unit && unit.state === UnitState.ACTIVE) {
              this.showDialogue(fleeingWestPetrifiedDialogue, () => {
                unit.petrify(false);
                this.updateUnitGraphic(unit);
              });
            }
          },
        });

        // BUG 2 FIX: fleeing_east is already inside the aura field, so she expires 1 turn
        // earlier than fleeing_west (staggered timers to reflect their different positions).
        this.eventTrigger.addTimer({
          npcId:          'fleeing_east',
          turnsRemaining: 1,
          // FIX 5: onTick updates countdown text
          onTick: (remaining) => {
            this.updateNpcTimerText('fleeing_east', remaining);
          },
          onSuccess: () => {
            this.removeNpcTimerText('fleeing_east');
            const unit = this.allUnits.get('fleeing_east');
            if (unit) {
              const rescuer = this.findAdjacentPlayerUnit(unit);
              this.gameMap.removeUnit(unit);
              this.destroyUnitGraphic('fleeing_east');
              this.allUnits.delete('fleeing_east');
              // CHANGE E: Give rescuing unit Amber Shard
              if (rescuer) {
                const added = rescuer.addItem({ ...AMBER_SHARD, uses: AMBER_SHARD.uses });
                this.showFlashText(added
                  ? 'A mysterious shard... it seems to strengthen your resolve.'
                  : 'Girl (E) escapes! (Inventory full — Amber Shard dropped)');
              } else {
                this.showFlashText('Girl (E) escapes safely!');
              }
            }
          },
          onFail: () => {
            this.removeNpcTimerText('fleeing_east');
            // FIX 7: Show NPC-specific dialogue before petrifying
            const unit = this.allUnits.get('fleeing_east');
            if (unit && unit.state === UnitState.ACTIVE) {
              this.showDialogue(fleeingEastPetrifiedDialogue, () => {
                unit.petrify(false);
                this.updateUnitGraphic(unit);
              });
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
  // FIX 5: NPC timer countdown text helpers
  // ==========================================================================

  /**
   * Creates a floating "⏳ X" text above the NPC's tile position and stores it
   * in npcTimerTexts keyed by npcId.
   */
  private createNpcTimerText(npcId: string, col: number, row: number, turns: number): void {
    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE - 6;

    const txt = this.add.text(px, py, `⏳ ${turns}`, {
      fontSize:        '10px',
      color:           '#ffffff',
      fontFamily:      'monospace',
      backgroundColor: '#000000aa',
      padding:         { x: 2, y: 1 },
    }).setOrigin(0.5, 1).setDepth(55);

    // Remove old text if a stale entry exists
    this.removeNpcTimerText(npcId);
    this.npcTimerTexts.set(npcId, txt);
  }

  /** Updates an existing timer text to show the new remaining count. */
  private updateNpcTimerText(npcId: string, remaining: number): void {
    const txt = this.npcTimerTexts.get(npcId);
    if (txt) {
      txt.setText(`⏳ ${remaining}`);
    }
  }

  /** Destroys and removes the timer text for an NPC. */
  private removeNpcTimerText(npcId: string): void {
    const txt = this.npcTimerTexts.get(npcId);
    if (txt) {
      txt.destroy();
      this.npcTimerTexts.delete(npcId);
    }
  }

  /** Helper: find a PLAYER unit adjacent to an NPC (used for rescue item awards). */
  private findAdjacentPlayerUnit(npc: Unit): Unit | null {
    const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
    for (const dir of dirs) {
      const nx = npc.position.x + dir.dx;
      const ny = npc.position.y + dir.dy;
      const occ = this.gameMap.getUnit(nx, ny);
      if (occ && occ.team === Team.PLAYER) return occ;
    }
    return null;
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

      await this.delay(400);
    }

    // After enemy phase, check petrified units for capture
    this.checkPetrifiedCapture();

    this.turnManager.endEnemyPhase();
    this.refreshAllUnitGraphics();
    this.startPlayerPhase();
  }

  /**
   * CHANGE K: Runs The Hand's turn.
   * On first spawn (turn 5), before movement, plays the breach guard petrification sequence.
   */
  private handBreachSequenceDone: boolean = false;

  private async runHandTurn(hand: Unit): Promise<void> {
    // CHANGE K: Petrify breach guards before first move
    if (!this.handBreachSequenceDone) {
      this.handBreachSequenceDone = true;
      await this.runBreachGuardSequence();
    }

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
        target.petrify(true);
        this.updateUnitGraphic(target);
        this.showFlashText(`${target.name} has been petrified.`);
        this.auraManager.addSource({
          position: { x: target.position.x, y: target.position.y },
          tier:     target.auraTier,
          unitName: target.name,
          radius:   this.getAuraRadius(target.auraTier),
        });
      } else if (target.team === Team.PLAYER && target.isNamedCharacter) {
        await this.petrifyNamedCharacter(target);
      } else if (target.team === Team.PLAYER && !target.isNamedCharacter) {
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
   * CHANGE K: Scripted sequence — breach guards petrified when The Hand spawns.
   * 1. Guard dialogue
   * 2. 0.5s pause
   * 3. Narrator line
   * 4. Instant petrify both guards
   */
  private async runBreachGuardSequence(): Promise<void> {
    return new Promise<void>(resolve => {
      const guardScript: DialogueLine[] = [
        { speaker: 'Guard', text: "W-what is that?! Don't come any closer—", portrait: 'npc' },
      ];
      this.showDialogue(guardScript, () => {
        this.time.delayedCall(500, () => {
          const narratorScript: DialogueLine[] = [
            { speaker: 'Narrator', text: 'The guards were petrified before they could act.', portrait: '' },
          ];
          this.showDialogue(narratorScript, () => {
            // Petrify both breach guards instantly
            const g1 = this.allUnits.get('guard_breach_1');
            const g2 = this.allUnits.get('guard_breach_2');
            if (g1 && g1.state !== UnitState.DEAD) {
              g1.petrify(true);
              this.updateUnitGraphic(g1);
            }
            if (g2 && g2.state !== UnitState.DEAD) {
              g2.petrify(true);
              this.updateUnitGraphic(g2);
            }
            this.refreshAllUnitGraphics();
            resolve();
          });
        });
      });
    });
  }

  /**
   * Handles a named character being petrified by The Hand:
   * 1. Show character-specific petrification dialogue.
   * 2. Show CG placeholder.
   * 3. Petrify the unit (captured=true).
   * 4. Add their aura source.
   * 5. Special cases for Vanessa (aura tutorial) and Eirika (game over).
   */
  private async petrifyNamedCharacter(unit: Unit): Promise<void> {
    return new Promise<void>(resolve => {
      let script: DialogueLine[];
      if (unit.id === 'vanessa') {
        script = vanessaPetrifiedDialogue;
      } else if (unit.id === 'syrene') {
        script = syrenePetrifiedDialogue;
      } else if (unit.id === 'tana') {
        script = tanaPetrifiedDialogue;
      } else {
        script = [{ speaker: 'Narrator', text: `${unit.name} has been petrified.`, portrait: '' }];
      }

      this.showDialogue(script, () => {
        this.showCGPlaceholder(unit.name, () => {
          unit.petrify(true);
          this.updateUnitGraphic(unit);
          this.eventTrigger.checkTriggers(EventType.UNIT_PETRIFIED, { unitId: unit.id });

          this.auraManager.addSource({
            position: { x: unit.position.x, y: unit.position.y },
            tier:     unit.auraTier,
            unitName: unit.name,
            radius:   this.getAuraRadius(unit.auraTier),
          });

          if (unit.id === 'vanessa') {
            const syrene = this.allUnits.get('syrene');
            if (syrene) {
              const dist =
                Math.abs(syrene.position.x - unit.position.x) +
                Math.abs(syrene.position.y - unit.position.y);
              if (dist <= 5) {
                const syreneDialog: DialogueLine[] = [
                  {
                    speaker:  'Syrene',
                    text:     'Vanessa... The aura — I can feel it weakening me!',
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
  // Aura tutorial warning
  // ==========================================================================

  private auraTutorialShown: boolean = false;

  private checkAuraTutorialWarning(): void {
    if (this.auraTutorialShown) return;
    const vanessa = this.allUnits.get('vanessa');
    if (!vanessa || vanessa.state === UnitState.ACTIVE) return;

    const syrene = this.allUnits.get('syrene');
    if (!syrene || syrene.state !== UnitState.ACTIVE) return;

    const dist =
      Math.abs(syrene.position.x - vanessa.position.x) +
      Math.abs(syrene.position.y - vanessa.position.y);
    if (dist > 5) return;

    this.auraTutorialShown = true;

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

    // Check deaths / combat petrification (CHANGE L/CHANGE M):
    // Player units at HP=0 are petrified rather than killed.
    if (defender.stats.hp <= 0) {
      if (defender.team === Team.PLAYER) {
        this.petrifyFromCombat(defender);
      } else {
        this.killUnit(defender);
      }
    }
    if (attacker.stats.hp <= 0) {
      if (attacker.team === Team.PLAYER) {
        this.petrifyFromCombat(attacker);
      } else {
        this.killUnit(attacker);
      }
    }

    this.refreshAllUnitGraphics();
    this.drawOverlays();
    this.checkWinLose();
  }

  /**
   * CHANGE B: Award EXP after combat and trigger level-up display if applicable.
   * Returns the LevelUpResult if a level-up occurred, else null.
   */
  private awardCombatExp(
    attacker: Unit,
    defenderDead: boolean,
    defenderLevel: number,
  ): LevelUpResult | null {
    if (attacker.team !== Team.PLAYER) return null;

    let expAmount: number;
    if (defenderDead) {
      expAmount = Math.max(10, Math.min(100, 20 + Math.max(0, defenderLevel - attacker.level) * 3));
    } else {
      expAmount = 5;
    }

    const result = attacker.gainExp(expAmount);
    return result;
  }

  /**
   * CHANGE J: Show level-up flash and stat panel.
   * Overlays without pausing the game.
   */
  private showLevelUpDisplay(unit: Unit, levelUpResult: LevelUpResult): void {
    const px = unit.position.x * TILE_SIZE + TILE_SIZE / 2;
    const py = unit.position.y * TILE_SIZE - 8;

    // Gold "LEVEL UP!" flash at unit position
    const levelFlash = this.add.text(px, py, 'LEVEL UP!', {
      fontSize:        '18px',
      color:           '#ffd700',
      fontFamily:      'monospace',
      fontStyle:       'bold',
      stroke:          '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 1).setDepth(80);

    this.tweens.add({
      targets:  levelFlash,
      y:        py - 40,
      alpha:    0,
      duration: 1500,
      ease:     'Linear',
      onComplete: () => { levelFlash.destroy(); },
    });

    // Small panel listing gained stats
    const gained = levelUpResult.gained;
    const statParts: string[] = [];
    if (gained.str) statParts.push(`STR +${gained.str}`);
    if (gained.mag) statParts.push(`MAG +${gained.mag}`);
    if (gained.skl) statParts.push(`SKL +${gained.skl}`);
    if (gained.spd) statParts.push(`SPD +${gained.spd}`);
    if (gained.def) statParts.push(`DEF +${gained.def}`);
    if (gained.res) statParts.push(`RES +${gained.res}`);
    if (gained.lck) statParts.push(`LCK +${gained.lck}`);
    if (gained.maxHp) statParts.push(`HP +${gained.maxHp}`);

    if (statParts.length === 0) statParts.push('(no stats gained)');

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2 - 60;

    const panelBg = this.add.rectangle(cx, cy, 260, 50, 0x112244, 0.9)
      .setOrigin(0.5, 0.5).setDepth(81);

    const panelText = this.add.text(cx, cy, statParts.join('  '), {
      fontSize:   '13px',
      color:      '#aaddff',
      fontFamily: 'monospace',
      align:      'center',
    }).setOrigin(0.5, 0.5).setDepth(82);

    // Auto-dismiss after 2 seconds
    this.time.delayedCall(2000, () => {
      panelBg.destroy();
      panelText.destroy();
    });
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

  /**
   * CHANGE L (CHANGE M): Called when a player unit reaches HP=0 in combat.
   * Instead of dying, the unit is petrified (initially PETRIFIED_SAFE).
   * Shows the unit's defeat dialogue, then a CG placeholder, then petrifies.
   * If an enemy is adjacent at the start of the next enemy phase, it becomes PETRIFIED_CAPTURED.
   *
   * FIX 2A: Unit HP, state, and grid presence are set IMMEDIATELY before the async
   * dialogue chain so the unit cannot act or be acted upon during dialogue.
   * FIX 2B: awaitingPetrificationDialogue defers checkWinLose while Eirika's dialogue runs.
   */
  private petrifyFromCombat(unit: Unit): void {
    // Map unit id → combat petrification dialogue
    const scriptMap: Record<string, DialogueLine[]> = {
      eirika:  eirikaCombatPetrifiedDialogue,
      tana:    tanaCombatPetrifiedDialogue,
      vanessa: vanessaCombatPetrifiedDialogue,
      syrene:  syreneCombatPetrifiedDialogue,
    };
    const script = scriptMap[unit.id] ?? [
      { speaker: 'Narrator', text: `${unit.name} has been petrified.`, portrait: '' },
    ];

    // FIX 2A: Immediately set HP=0, state, remove from walkable grid, update visual.
    // This prevents the unit from being selected or acting during the async dialogue.
    unit.stats.hp = 0;
    unit.state    = UnitState.PETRIFIED_SAFE;
    this.gameMap.removeUnit(unit);
    this.updateUnitGraphic(unit);

    // FIX 2B: For Eirika, raise the guard flag so checkWinLose defers game-over
    // until after the full dialogue + CG chain completes.
    if (unit.id === 'eirika') {
      this.awaitingPetrificationDialogue = true;
    }

    this.showDialogue(script, () => {
      this.showCGPlaceholder(unit.name, () => {
        // Full petrify call: sets internal flags and fires UNIT_PETRIFIED trigger
        unit.petrify(false);
        this.updateUnitGraphic(unit);
        this.eventTrigger.checkTriggers(EventType.UNIT_PETRIFIED, { unitId: unit.id });

        if (unit.id === 'eirika') {
          // FIX 2B: Clear guard flag then trigger game-over
          this.awaitingPetrificationDialogue = false;
          this.triggerGameOver('Eirika has been petrified!');
        }

        this.drawOverlays();
        this.checkWinLose();
      });
    });
  }

  private killUnit(unit: Unit): void {
    unit.state = UnitState.DEAD;
    this.gameMap.removeUnit(unit);
    this.destroyUnitGraphic(unit.id);
    this.allUnits.delete(unit.id);

    // CHANGE L: Weak Gorgon tutorial defeat acknowledgement
    if (unit.id === 'weak_gorgon') {
      this.showFlashText('The Gorgon has been defeated. The passage is clear.');
    }
  }

  // ==========================================================================
  // Win / Lose
  // ==========================================================================

  private checkWinLose(): void {
    // FIX 2B / FIX 7: Eirika's petrification dialogue is still playing — defer.
    if (this.awaitingPetrificationDialogue) return;

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

    const tana    = this.allUnits.get('tana');
    const vanessa = this.allUnits.get('vanessa');
    const syrene  = this.allUnits.get('syrene');

    const tanaLost    = !tana    || tana.state    === UnitState.PETRIFIED_SAFE || tana.state    === UnitState.PETRIFIED_CAPTURED;
    const vanessaLost = !vanessa || vanessa.state === UnitState.PETRIFIED_SAFE || vanessa.state === UnitState.PETRIFIED_CAPTURED;
    const syreneLost  = !syrene  || syrene.state  === UnitState.PETRIFIED_SAFE || syrene.state  === UnitState.PETRIFIED_CAPTURED;

    const allLost  = tanaLost && vanessaLost && syreneLost;
    const noneLost = !tanaLost && !vanessaLost && !syreneLost;

    let script: DialogueLine[];
    if (allLost)        script = closingDialogue_allLost;
    else if (tanaLost)  script = closingDialogue_tanaLost;
    else if (noneLost)  script = closingDialogue_allSurvived;
    else                script = closingDialogue_someLost;

    this.showDialogue(script, () => {
      this.showEndScreen('Chapter 1 Complete', 0x224422);
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
  // CG placeholder
  // ==========================================================================

  showCGPlaceholder(characterName: string, onDismiss: () => void): void {
    const overlay = this.add.rectangle(
      0, 0,
      this.scale.width, this.scale.height,
      0x000000, 1,
    ).setOrigin(0, 0).setDepth(100).setInteractive();

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const cgBox = this.add.rectangle(cx, cy - 20, 400, 300, 0x333333)
      .setOrigin(0.5, 0.5).setDepth(101);

    const titleText = this.add.text(cx, cy - 20, `${characterName} — Petrification CG`, {
      fontSize:   '18px',
      color:      '#ffffff',
      fontFamily: 'monospace',
      align:      'center',
    }).setOrigin(0.5, 0.5).setDepth(102);

    const subText = this.add.text(cx, cy + 20, '(CG artwork pending)', {
      fontSize:   '13px',
      color:      '#888888',
      fontFamily: 'monospace',
      align:      'center',
    }).setOrigin(0.5, 0.5).setDepth(102);

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
  // CHANGE H / FIX 6: Unified statue popup
  // ==========================================================================

  /**
   * FIX 6: Unified statue / petrified-unit info popup.
   * Replaces showPetrifiedUnitPopup, showDecorativeStatuePopup, showAuraStatuePopup.
   *
   * Layout:
   *   [NAME] — [STATUS]
   *   ─────────────────────────────
   *   STR/SKL/SPD / DEF/RES/STO    ← if stats present
   *   OR "Stats: Unknown"
   *   ─────────────────────────────
   *   Aura (Tier X, X tile radius):   ← if aura present
   *   • All player stats: −X
   *   • STO-RES decay: +X/turn
   *   ─────────────────────────────
   *   [Close]
   */
  private showStatuePopup(info: StatuePopupInfo): void {
    this.closePopup();

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const w  = 420;
    const h  = info.auraTier !== undefined ? 260 : 200;

    const container = this.add.container(cx, cy).setDepth(90);

    const bg     = this.add.rectangle(0, 0, w, h, 0x111133, 0.95).setOrigin(0.5, 0.5);
    const border = this.add.rectangle(0, 0, w, h, 0x000000, 0)
      .setOrigin(0.5, 0.5).setStrokeStyle(2, 0x8888cc, 1);

    const statusLabel =
      info.status === 'Captured'     ? 'Captured' :
      info.status === 'Safe'         ? 'Safe'      :
                                       'Environmental';

    const titleTxt = this.add.text(0, -h / 2 + 18, `${info.name} — ${statusLabel}`, {
      fontSize:   '15px', color: '#eeeeff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    let yOffset = -h / 2 + 42;

    const div1 = this.add.rectangle(0, yOffset, w - 20, 1, 0x555577).setOrigin(0.5, 0.5);
    yOffset += 16;

    // Origin note for Environmental
    let statsStr: string;
    if (info.status === 'Environmental') {
      statsStr = 'Origin: Unknown. Petrified before this battle.';
    } else if (info.stats) {
      const s = info.stats;
      statsStr =
        `STR: ${s.str}  SKL: ${s.skl}  SPD: ${s.spd}\n` +
        `DEF: ${s.def}  RES: ${s.res}  STO: ${s.stoRes}/${s.maxStoRes}`;
    } else {
      statsStr = 'Stats: Unknown';
    }

    const statsTxt = this.add.text(0, yOffset, statsStr, {
      fontSize: '11px', color: '#aabbcc', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5, 0);
    yOffset += statsTxt.height + 12;

    const auraObjects: Phaser.GameObjects.GameObject[] = [];
    if (info.auraTier !== undefined) {
      const tierNames: Record<AuraTier, string> = {
        [AuraTier.TIER_S]: 'S',
        [AuraTier.TIER_A]: 'A',
        [AuraTier.TIER_B]: 'B',
      };
      const div2 = this.add.rectangle(0, yOffset, w - 20, 1, 0x555577).setOrigin(0.5, 0.5);
      auraObjects.push(div2);
      yOffset += 14;

      const auraTitle = this.add.text(
        0, yOffset,
        `Aura (Tier ${tierNames[info.auraTier]}, ${info.auraRadius ?? '?'} tile radius):`,
        { fontSize: '11px', color: '#cc8888', fontFamily: 'monospace' },
      ).setOrigin(0.5, 0);
      auraObjects.push(auraTitle);
      yOffset += auraTitle.height + 4;

      const statDebuffVal = info.statDebuff ?? 1;
      const auraDetail = this.add.text(
        0, yOffset,
        `• All player stats: −${statDebuffVal}\n• STO-RES decay: +${info.stoDecay ?? 0}/turn`,
        { fontSize: '10px', color: '#bb8888', fontFamily: 'monospace', align: 'center' },
      ).setOrigin(0.5, 0);
      auraObjects.push(auraDetail);
    }

    // Close button
    const closeBtnBg = this.add.rectangle(0, h / 2 - 22, 80, 26, 0x334466)
      .setOrigin(0.5, 0.5).setInteractive({ cursor: 'pointer' });
    const closeBtnTxt = this.add.text(0, h / 2 - 22, 'Close', {
      fontSize: '12px', color: '#88aaff', fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5);

    container.add([bg, border, titleTxt, div1, statsTxt, ...auraObjects, closeBtnBg, closeBtnTxt]);
    this.activePopup = container;

    closeBtnBg.on('pointerdown', () => { this.closePopup(); });
    closeBtnBg.on('pointerover',  () => { closeBtnBg.setFillStyle(0x556688); });
    closeBtnBg.on('pointerout',   () => { closeBtnBg.setFillStyle(0x334466); });
  }

  private closePopup(): void {
    if (this.activePopup) {
      this.activePopup.destroy();
      this.activePopup = null;
    }
  }

  /** Build and show popup for a petrified unit. FIX 6: delegates to showStatuePopup. */
  private showPetrifiedUnitPopup(unit: Unit): void {
    const status = unit.state === UnitState.PETRIFIED_CAPTURED ? 'Captured' as const : 'Safe' as const;
    const auraSource = this.auraManager.sources.find(
      s => s.position.x === unit.position.x && s.position.y === unit.position.y,
    );

    this.showStatuePopup({
      name:        unit.name,
      status,
      stats:       unit.stats,
      auraTier:    auraSource ? auraSource.tier : undefined,
      auraRadius:  auraSource ? auraSource.radius : undefined,
      stoDecay:    auraSource ? this.getAuraDecay(unit.auraTier) : undefined,
      statDebuff:  1,
    });
  }

  private getAuraDecay(tier: AuraTier): number {
    const map: Record<AuraTier, number> = {
      [AuraTier.TIER_S]: 2,
      [AuraTier.TIER_A]: 1,
      [AuraTier.TIER_B]: 0,
    };
    return map[tier] ?? 0;
  }

  /** Build and show popup for a decorative statue. FIX 6: delegates to showStatuePopup. */
  private showDecorativeStatuePopup(statue: DecorativeStatue): void {
    this.showStatuePopup({
      name:   statue.label,
      status: 'Environmental',
    });
  }

  /**
   * CHANGE L (CHANGE 1): Show popup for a pre-placed aura statue stored in auraManager.sources.
   * FIX 6: delegates to showStatuePopup.
   */
  private showAuraStatuePopup(source: AuraSource): void {
    const decay = this.getAuraDecay(source.tier);
    this.showStatuePopup({
      name:       source.unitName,
      status:     'Captured',
      auraTier:   source.tier,
      auraRadius: source.radius,
      stoDecay:   decay,
      statDebuff: 1,
    });
  }

  // ==========================================================================
  // UI
  // ==========================================================================

  private buildUI(): void {
    // Background panel (bottom bar — phase/turn/end-turn only; unit info moved to floating panel)
    this.add.rectangle(0, UI_Y, this.scale.width, UI_HEIGHT, 0x111122)
      .setOrigin(0, 0);

    // CHANGE N: old unit info rows replaced by floating statusPanel (see below)

    // CHANGE N: Right-side floating status panel (top-right, 232×200px)
    const PANEL_X = 720;
    const PANEL_Y = 8;
    const PANEL_W = 232;
    const PANEL_H = 200;

    this.statusPanel = this.add.container(PANEL_X + PANEL_W / 2, PANEL_Y + PANEL_H / 2)
      .setDepth(20)
      .setVisible(false);

    const panelBg = this.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x1a1a2e, 0.85)
      .setOrigin(0.5, 0.5);
    const panelBorder = this.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x000000, 0)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(2, 0xccaa44, 1);

    this.statusPanelText = this.add.text(-PANEL_W / 2 + 6, -PANEL_H / 2 + 6, '', {
      fontSize:    '11px',
      color:       '#ccddee',
      fontFamily:  'monospace',
      lineSpacing: 2,
      wordWrap:    { width: PANEL_W - 12 },
    }).setOrigin(0, 0);

    this.statusPanel.add([panelBg, panelBorder, this.statusPanelText]);

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

  /**
   * CHANGE N: Update the floating right-side status panel.
   * Hides the panel when no unit is provided; shows it otherwise.
   * Layout:
   *   [Name]          Lv [X]
   *   [Class]
   *   HP:  xx / xx   STO: xx / xx
   *   STR: xx  SKL: xx  SPD: xx
   *   DEF: xx  RES: xx
   *   EXP: xx / 100
   *   Equipped: [weapon name]
   */
  private updateUnitInfoPanel(unit: Unit | null): void {
    if (!unit) {
      this.statusPanel.setVisible(false);
      return;
    }

    const weapon    = unit.getEquippedWeapon();
    const weaponStr = weapon ? weapon.name : '—';
    const classStr  = unit.unitClass.replace('_', ' ');
    const stoLine   = unit.stats.maxStoRes > 0
      ? `   STO: ${unit.stats.stoRes}/${unit.stats.maxStoRes}`
      : '';

    const lines: string[] = [
      `${unit.name}          Lv ${unit.level}`,
      classStr,
      `HP:  ${unit.stats.hp} / ${unit.stats.maxHp}${stoLine}`,
      `STR: ${unit.stats.str}  SKL: ${unit.stats.skl}  SPD: ${unit.stats.spd}`,
      `DEF: ${unit.stats.def}  RES: ${unit.stats.res}`,
      `EXP: ${unit.exp} / 100`,
      `Equipped: ${weaponStr}`,
    ];

    this.statusPanelText.setText(lines.join('\n'));
    this.statusPanel.setVisible(true);
  }

  // ==========================================================================
  // Action menu (DOM overlay)
  // ==========================================================================

  /**
   * Shows the action menu near the unit (post-move).
   * Buttons: Attack (if targets exist), Item (if usable consumables), Break Wall (if adjacent),
   *          Wait.
   */
  private showActionMenu(unit: Unit): void {
    this.inputState = InputState.ACTION_MENU;

    const canvasEl   = this.game.canvas;
    const canvasRect = canvasEl.getBoundingClientRect();
    const parentRect = canvasEl.parentElement!.getBoundingClientRect();

    const tilePixelX = unit.position.x * TILE_SIZE + TILE_SIZE;
    const tilePixelY = unit.position.y * TILE_SIZE;

    const menuWidth  = 120;
    const clampedX   = Math.min(tilePixelX, MAP_COLS * TILE_SIZE - menuWidth);
    const clampedY   = Math.max(0, Math.min(tilePixelY, MAP_HEIGHT - 140));

    const offsetX = canvasRect.left - parentRect.left;
    const offsetY = canvasRect.top  - parentRect.top;

    this.actionMenuEl.style.left = `${clampedX + offsetX}px`;
    this.actionMenuEl.style.top  = `${clampedY + offsetY}px`;

    const attackRange    = this.gameMap.getAttackRange(unit);
    const hasTargets     = this.getValidAttackTargets(unit, attackRange).length > 0;
    const hasUsable      = unit.inventory.some(i => i.kind === 'consumable' && i.uses > 0);
    const breakWallPos   = this.findAdjacentBreakableWall(unit);
    // CHANGE M: Trade button available if this unit has items and an adjacent ally exists
    const hasItems       = unit.inventory.length > 0;
    const adjacentAllies = this.findAdjacentPlayerUnits(unit);
    const canTrade       = hasItems && adjacentAllies.length > 0;

    let html = '';
    if (hasTargets)  html += `<button id="amenu-attack">Attack</button>`;
    if (hasUsable)   html += `<button id="amenu-item">Item</button>`;
    if (canTrade)    html += `<button id="amenu-trade">Trade</button>`;
    if (breakWallPos) html += `<button id="amenu-break">Break Wall</button>`;
    html += `<button id="amenu-wait">Wait</button>`;

    this.actionMenuEl.innerHTML = html;
    this.actionMenuEl.style.display = 'block';

    if (hasTargets) {
      document.getElementById('amenu-attack')!.addEventListener('click', () => {
        this.onActionMenuAttack(unit);
      }, { once: true });
    }
    if (hasUsable) {
      document.getElementById('amenu-item')!.addEventListener('click', () => {
        this.onActionMenuItem(unit);
      }, { once: true });
    }
    if (canTrade) {
      document.getElementById('amenu-trade')!.addEventListener('click', () => {
        this.onActionMenuTrade(unit, adjacentAllies);
      }, { once: true });
    }
    if (breakWallPos) {
      document.getElementById('amenu-break')!.addEventListener('click', () => {
        this.onActionMenuBreakWall(unit, breakWallPos);
      }, { once: true });
    }
    document.getElementById('amenu-wait')!.addEventListener('click', () => {
      this.onActionMenuWait(unit);
    }, { once: true });
  }

  /** CHANGE D: Returns position of an adjacent BREAKABLE_WALL tile, or null. */
  private findAdjacentBreakableWall(unit: Unit): { x: number; y: number } | null {
    const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
    for (const dir of dirs) {
      const nx = unit.position.x + dir.dx;
      const ny = unit.position.y + dir.dy;
      const tile = this.gameMap.getTile(nx, ny);
      if (tile && tile.type === TileType.BREAKABLE_WALL) {
        return { x: nx, y: ny };
      }
    }
    return null;
  }

  /** CHANGE M: Returns all ACTIVE player units adjacent to the given unit. */
  private findAdjacentPlayerUnits(unit: Unit): Unit[] {
    const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
    const result: Unit[] = [];
    for (const dir of dirs) {
      const nx  = unit.position.x + dir.dx;
      const ny  = unit.position.y + dir.dy;
      const occ = this.gameMap.getUnit(nx, ny);
      if (occ && occ.team === Team.PLAYER && occ.id !== unit.id) result.push(occ);
    }
    return result;
  }

  /**
   * CHANGE M: Trade action — if multiple allies adjacent, show ally picker first.
   * Otherwise, open the trade UI directly.
   */
  private onActionMenuTrade(unit: Unit, allies: Unit[]): void {
    this.hideActionMenu();
    if (allies.length === 1) {
      this.openTradeUI(unit, allies[0]);
    } else {
      // Show ally picker
      let html = '';
      allies.forEach((ally, i) => {
        html += `<button id="trade-ally-${i}">${ally.name}</button>`;
      });
      html += `<button id="trade-ally-cancel">Cancel</button>`;
      this.actionMenuEl.innerHTML = html;
      this.actionMenuEl.style.display = 'block';
      allies.forEach((ally, i) => {
        document.getElementById(`trade-ally-${i}`)!.addEventListener('click', () => {
          this.hideActionMenu();
          this.openTradeUI(unit, ally);
        }, { once: true });
      });
      document.getElementById('trade-ally-cancel')!.addEventListener('click', () => {
        this.hideActionMenu();
        this.showActionMenu(unit);
      }, { once: true });
    }
  }

  /**
   * CHANGE M: Trade UI — Phaser container popup with two-column inventory display.
   *
   * Left column:  current unit's inventory (5 slots)
   * Right column: target ally's inventory (5 slots)
   * Click an item to "hold" it, click a destination slot to place/swap.
   * Confirm Trade → finalise, mark unit DONE.
   * Cancel → revert, return to action menu.
   *
   * Inventory snapshots are deep-cloned at open time; Confirm applies them.
   */
  private tradePopup: Phaser.GameObjects.Container | null = null;

  private openTradeUI(unitA: Unit, unitB: Unit): void {
    this.inputState = InputState.TRADE;

    // Deep-clone inventories for rollback
    const snapA = unitA.inventory.map(i => ({ ...i }));
    const snapB = unitB.inventory.map(i => ({ ...i }));

    // Working copies (live during trade session)
    let invA = unitA.inventory.map(i => ({ ...i }));
    let invB = unitB.inventory.map(i => ({ ...i }));
    let heldItem: (typeof invA[number]) | null = null;
    let heldFrom: 'A' | 'B' | null = null;
    let heldIdx: number = -1;

    const SLOTS = 5;
    const PW = 200;  // panel width per column
    const PH = 280;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const buildPopup = (): void => {
      if (this.tradePopup) { this.tradePopup.destroy(); this.tradePopup = null; }

      const container = this.add.container(cx, cy).setDepth(95);
      this.tradePopup  = container;

      const totalW = PW * 2 + 40;
      const bg     = this.add.rectangle(0, 0, totalW, PH + 60, 0x111133, 0.96)
        .setOrigin(0.5, 0.5);
      const border = this.add.rectangle(0, 0, totalW, PH + 60, 0x000000, 0)
        .setOrigin(0.5, 0.5).setStrokeStyle(2, 0xccaa44, 1);

      container.add([bg, border]);

      const titleTxt = this.add.text(0, -(PH / 2 + 22), `Trade: ${unitA.name}  ↔  ${unitB.name}`, {
        fontSize: '13px', color: '#eeeeff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      container.add(titleTxt);

      // Status line for held item
      const statusTxt = this.add.text(0, -(PH / 2 + 6), heldItem
        ? `Holding: ${(heldItem as any).name ?? (heldItem as any).data?.name ?? '?'} — click a slot to place`
        : 'Click an item to pick up', {
        fontSize: '10px', color: '#aabbcc', fontFamily: 'monospace',
      }).setOrigin(0.5, 0.5);
      container.add(statusTxt);

      const drawColumn = (
        inv:    (typeof invA),
        side:   'A' | 'B',
        offX:   number,
        label:  string,
      ): void => {
        const lblTxt = this.add.text(offX, -PH / 2 + 14, label, {
          fontSize: '11px', color: '#ffcc66', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);
        container.add(lblTxt);

        for (let idx = 0; idx < SLOTS; idx++) {
          const slotY = -PH / 2 + 34 + idx * 42;
          const item  = inv[idx] as (typeof invA[number]) | undefined;

          const isHeld = (heldFrom === side && heldIdx === idx);
          const bgCol  = isHeld ? 0x445566 : (item ? 0x223344 : 0x1a1a2e);

          const slotBg = this.add.rectangle(offX, slotY, PW - 10, 36, bgCol, 0.95)
            .setOrigin(0.5, 0.5).setInteractive({ cursor: 'pointer' });
          container.add(slotBg);

          if (item) {
            const itemName =
              (item as any).data?.name ??
              (item as any).name ??
              '?';
            const uses = (item as any).uses != null
              ? ` (${(item as any).uses}/${(item as any).maxUses})`
              : '';
            const itemTxt = this.add.text(offX - (PW / 2 - 10), slotY, `${itemName}${uses}`, {
              fontSize: '10px', color: isHeld ? '#ffee88' : '#ccddee', fontFamily: 'monospace',
            }).setOrigin(0, 0.5);
            container.add(itemTxt);
          } else {
            const emptyTxt = this.add.text(offX, slotY, '— empty —', {
              fontSize: '9px', color: '#445566', fontFamily: 'monospace',
            }).setOrigin(0.5, 0.5);
            container.add(emptyTxt);
          }

          slotBg.on('pointerdown', () => {
            if (heldItem === null) {
              // Pick up item from this slot
              if (item) {
                heldItem = { ...item } as typeof invA[number];
                heldFrom = side;
                heldIdx  = idx;
                buildPopup();
              }
            } else {
              // Place held item into this slot
              const targetInv = side === 'A' ? invA : invB;
              const srcInv    = heldFrom === 'A' ? invA : invB;

              const displaced = targetInv[idx]
                ? { ...(targetInv[idx] as typeof invA[number]) }
                : undefined;

              targetInv[idx] = heldItem! as typeof invA[number];

              if (displaced) {
                srcInv[heldIdx] = displaced;
              } else {
                srcInv.splice(heldIdx, 1);
              }

              // Trim to SLOTS and pad with placeholders if needed
              while (invA.length > SLOTS) invA.pop();
              while (invB.length > SLOTS) invB.pop();

              heldItem = null;
              heldFrom = null;
              heldIdx  = -1;
              buildPopup();
            }
          });
          slotBg.on('pointerover',  () => { slotBg.setFillStyle(bgCol === 0x1a1a2e ? 0x2a2a3e : bgCol + 0x111111); });
          slotBg.on('pointerout',   () => { slotBg.setFillStyle(bgCol); });
        }
      };

      drawColumn(invA, 'A', -(PW / 2 + 10), unitA.name);
      drawColumn(invB, 'B',  (PW / 2 + 10), unitB.name);

      // Confirm button
      const confirmBg = this.add.rectangle(-(PW / 2 + 10), PH / 2 + 18, 80, 28, 0x335533)
        .setOrigin(0.5, 0.5).setInteractive({ cursor: 'pointer' });
      const confirmTxt = this.add.text(-(PW / 2 + 10), PH / 2 + 18, 'Confirm', {
        fontSize: '12px', color: '#88ff88', fontFamily: 'monospace',
      }).setOrigin(0.5, 0.5);
      container.add([confirmBg, confirmTxt]);

      confirmBg.on('pointerover',  () => { confirmBg.setFillStyle(0x446644); });
      confirmBg.on('pointerout',   () => { confirmBg.setFillStyle(0x335533); });
      confirmBg.on('pointerdown', () => {
        // Apply inventories
        unitA.inventory.length = 0;
        invA.forEach(i => unitA.inventory.push(i));
        unitB.inventory.length = 0;
        invB.forEach(i => unitB.inventory.push(i));

        if (this.tradePopup) { this.tradePopup.destroy(); this.tradePopup = null; }
        unitA.state    = UnitState.DONE;
        unitA.hasActed = true;
        this.selectedUnit = null;
        this.moveRange.clear();
        this.attackRange.clear();
        this.inputState = InputState.IDLE;
        this.updateUnitGraphic(unitA);
        this.drawOverlays();
      });

      // Cancel button
      const cancelBg = this.add.rectangle((PW / 2 + 10), PH / 2 + 18, 80, 28, 0x553333)
        .setOrigin(0.5, 0.5).setInteractive({ cursor: 'pointer' });
      const cancelTxt = this.add.text((PW / 2 + 10), PH / 2 + 18, 'Cancel', {
        fontSize: '12px', color: '#ff8888', fontFamily: 'monospace',
      }).setOrigin(0.5, 0.5);
      container.add([cancelBg, cancelTxt]);

      cancelBg.on('pointerover',  () => { cancelBg.setFillStyle(0x664444); });
      cancelBg.on('pointerout',   () => { cancelBg.setFillStyle(0x553333); });
      cancelBg.on('pointerdown', () => {
        // Revert — restore original inventories
        unitA.inventory.length = 0;
        snapA.forEach(i => unitA.inventory.push(i));
        unitB.inventory.length = 0;
        snapB.forEach(i => unitB.inventory.push(i));

        if (this.tradePopup) { this.tradePopup.destroy(); this.tradePopup = null; }
        this.inputState = InputState.ACTION_MENU;
        this.showActionMenu(unitA);
      });
    };

    buildPopup();
  }

  private hideActionMenu(): void {
    this.actionMenuEl.style.display = 'none';
    this.actionMenuEl.innerHTML = '';
  }

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
        !occ.isPursuer
      ) {
        targets.push(occ);
      }
    }
    return targets;
  }

  private onActionMenuAttack(unit: Unit): void {
    this.hideActionMenu();
    this.attackRange = this.gameMap.getAttackRange(unit);
    this.inputState  = InputState.ATTACK_TARGETING;
    this.drawOverlays();
  }

  private onActionMenuItem(unit: Unit): void {
    this.hideActionMenu();
    this.inputState = InputState.ITEM_SELECT;
    this.showItemSelectMenu(unit);
  }

  /** CHANGE D: Break adjacent wall — no combat animation, costs unit's action. */
  private onActionMenuBreakWall(unit: Unit, wallPos: { x: number; y: number }): void {
    this.hideActionMenu();

    this.gameMap.breakTile(wallPos.x, wallPos.y);
    this.redrawTile(wallPos.x, wallPos.y);

    // Flash text at wall position
    const px = wallPos.x * TILE_SIZE + TILE_SIZE / 2;
    const py = wallPos.y * TILE_SIZE + TILE_SIZE / 2;
    const flash = this.add.text(px, py, 'Wall broken!', {
      fontSize:        '14px',
      color:           '#ffcc44',
      fontFamily:      'monospace',
      fontStyle:       'bold',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(50);

    this.tweens.add({
      targets:  flash,
      y:        py - 30,
      alpha:    0,
      duration: 1500,
      ease:     'Linear',
      onComplete: () => { flash.destroy(); },
    });

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
  // Item select (CHANGE C: now handles ConsumableItem from inventory)
  // ==========================================================================

  private showItemSelectMenu(unit: Unit): void {
    const usableItems: Array<{ item: ConsumableItem; index: number }> = [];
    unit.inventory.forEach((slot, idx) => {
      if (slot.kind === 'consumable' && slot.uses > 0) {
        usableItems.push({ item: slot, index: idx });
      }
    });

    if (usableItems.length === 0) {
      this.deselectUnit();
      return;
    }

    let html = '';
    usableItems.forEach(({ item }, i) => {
      html += `<button id="item-btn-${i}">${item.name} (${item.uses}/${item.maxUses})</button>`;
    });
    html += `<button id="item-btn-cancel">Cancel</button>`;

    this.actionMenuEl.innerHTML = html;
    this.actionMenuEl.style.display = 'block';

    const canvasEl  = this.game.canvas;
    const canvasRect = canvasEl.getBoundingClientRect();
    const parentRect = canvasEl.parentElement!.getBoundingClientRect();
    const offsetX    = canvasRect.left - parentRect.left;
    const offsetY    = canvasRect.top  - parentRect.top;
    const tilePixelX = unit.position.x * TILE_SIZE + TILE_SIZE;
    const tilePixelY = unit.position.y * TILE_SIZE;
    this.actionMenuEl.style.left = `${tilePixelX + offsetX}px`;
    this.actionMenuEl.style.top  = `${tilePixelY + offsetY}px`;

    usableItems.forEach(({ item, index }, i) => {
      document.getElementById(`item-btn-${i}`)!.addEventListener('click', () => {
        this.hideActionMenu();
        this.useConsumable(unit, item, index);
      }, { once: true });
    });
    document.getElementById('item-btn-cancel')!.addEventListener('click', () => {
      this.hideActionMenu();
      this.showActionMenu(unit);
    }, { once: true });
  }

  /** CHANGE C: Use a ConsumableItem — supports heal and stoResBoost effects. */
  private useConsumable(unit: Unit, item: ConsumableItem, _inventoryIndex: number): void {
    let flashMsg = '';

    if (item.effect.type === 'heal') {
      const healed = Math.min(item.effect.amount, unit.stats.maxHp - unit.stats.hp);
      unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + item.effect.amount);
      flashMsg = `${unit.name} uses ${item.name}! +${healed} HP`;
      // CHANGE B: EXP for using a healing item on self
      const lvUp = unit.gainExp(3);
      if (lvUp) this.showLevelUpDisplay(unit, lvUp);
    } else if (item.effect.type === 'stoResBoost') {
      unit.stats.stoRes = Math.min(unit.stats.maxStoRes, unit.stats.stoRes + item.effect.amount);
      flashMsg = `${unit.name} uses ${item.name}! STO-RES +${item.effect.amount}`;
    }

    item.uses--;

    this.showFlashText(flashMsg);

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
  // Battle preview overlay
  // ==========================================================================

  private showBattlePreview(attacker: Unit, defender: Unit): void {
    const atkWeapon = attacker.getEquippedWeapon();
    const defWeapon = defender.getEquippedWeapon();

    const atkDmg = atkWeapon ? calcDamage(attacker, defender, this.gameMap) : 0;
    const atkHit = atkWeapon ? calcHit(attacker, defender, this.gameMap) : 0;

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

    // Save defender level before combat (might die)
    const defLevel = defender.level;

    this.executeCombat(attacker, defender);

    // CHANGE B: Award EXP to attacker after combat
    const defIsDead = !this.allUnits.has(defender.id) || defender.state === UnitState.DEAD;
    if (attacker.team === Team.PLAYER && this.allUnits.has(attacker.id)) {
      const lvUp = this.awardCombatExp(attacker, defIsDead, defLevel);
      if (lvUp) {
        this.showLevelUpDisplay(attacker, lvUp);
      }
    }

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

  private cancelCombatPreview(): void {
    this.attackRange.clear();
    this.moveRange.clear();
    this.drawOverlays();
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
      // FIX 8: Block all map clicks while a dialogue is active
      if (this.dialogueActive) return;
      this.handlePointerDown(pointer);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerMove(pointer);
    });
    // Keyboard ESC wired in create() to also handle popup dismiss
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.y >= MAP_HEIGHT) {
      // Pointer moved off the map — hide panel unless something selected
      if (this.hoveredUnit) {
        this.hoveredUnit = null;
        this.updateUnitInfoPanel(this.selectedUnit);
      }
      return;
    }

    const col = Math.floor(pointer.x / TILE_SIZE);
    const row = Math.floor(pointer.y / TILE_SIZE);

    if (!this.gameMap.isInBounds(col, row)) return;

    const unit = this.gameMap.getUnit(col, row);
    if (unit !== this.hoveredUnit) {
      this.hoveredUnit = unit;
      // CHANGE N: show hovered unit in panel; fall back to selected unit
      this.updateUnitInfoPanel(unit ?? this.selectedUnit);
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.y >= MAP_HEIGHT) return;
    if (this.inputState === InputState.GAME_OVER) return;
    if (this.inputState === InputState.ENEMY_PHASE) return;
    if (this.inputState === InputState.MOVING) return;

    // Dismiss popup on any click outside a popup button (CHANGE H)
    if (this.activePopup) {
      // The popup's close button handles itself; any other click also closes
      this.closePopup();
      return;
    }

    const col = Math.floor(pointer.x / TILE_SIZE);
    const row = Math.floor(pointer.y / TILE_SIZE);

    if (!this.gameMap.isInBounds(col, row)) return;

    const clickedUnit = this.gameMap.getUnit(col, row);

    // CHANGE H: Check if a petrified unit was clicked
    if (
      clickedUnit &&
      (clickedUnit.state === UnitState.PETRIFIED_SAFE || clickedUnit.state === UnitState.PETRIFIED_CAPTURED)
    ) {
      this.showPetrifiedUnitPopup(clickedUnit);
      return;
    }

    // CHANGE H: Check if a decorative statue was clicked
    const decorStatue = this.decorativeStatueData.find(s => s.x === col && s.y === row);
    if (decorStatue) {
      this.showDecorativeStatuePopup(decorStatue);
      return;
    }

    // CHANGE L (CHANGE 1): Check if a pre-placed aura statue was clicked
    const auraStatue = this.auraManager.sources.find(
      s => s.position.x === col && s.position.y === row,
    );
    if (auraStatue) {
      this.showAuraStatuePopup(auraStatue);
      return;
    }

    switch (this.inputState) {
      case InputState.IDLE:
        this.handleIdleClick(col, row, clickedUnit);
        break;

      case InputState.UNIT_SELECTED:
        this.handleSelectedClick(col, row, clickedUnit);
        break;

      case InputState.ACTION_MENU:
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
      if (clickedUnit && clickedUnit.team === Team.NPC) {
        // FIX 9: Rescue only fires when a player unit is adjacent to the NPC.
        // Without adjacency, just show the NPC info panel.
        const adjacentPlayer = this.findAdjacentPlayerUnit(clickedUnit);
        if (adjacentPlayer) {
          this.eventTrigger.checkTimerSuccess(clickedUnit.id);
        }
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

    // CHANGE I / FIX 3: Click same unit — open action menu if MOVED or ACTIVE.
    // For ACTIVE: treat as "stand ground" — set preMovePos to current tile then
    // temporarily advance state to MOVED so menu logic works normally.
    // Cancel (Escape) from the menu will restore ACTIVE state via cancelMove().
    if (clickedUnit && clickedUnit.id === this.selectedUnit?.id) {
      if (this.selectedUnit!.state === UnitState.MOVED) {
        this.showActionMenu(this.selectedUnit!);
      } else if (this.selectedUnit!.state === UnitState.ACTIVE) {
        // Store current position so Cancel can return the unit to this spot
        this.preMovePos = {
          x: this.selectedUnit!.position.x,
          y: this.selectedUnit!.position.y,
        };
        // Temporarily promote to MOVED so showActionMenu behaves identically
        this.selectedUnit!.state = UnitState.MOVED;
        this.showActionMenu(this.selectedUnit!);
      }
      // Otherwise do nothing (keep selected)
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

    this.preMovePos = { x: unit.position.x, y: unit.position.y };
    this.inputState = InputState.MOVING;

    this.animateUnitMove(unit, col, row).then(() => {
      unit.hasMoved = true;
      unit.state    = UnitState.MOVED;

      this.checkAdjacentNPCs(unit);
      this.checkEscape(unit);
      if (this.inputState === InputState.GAME_OVER) return;

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
      const nx       = unit.position.x + dir.dx;
      const ny       = unit.position.y + dir.dy;
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

  /**
   * Queues and launches DialogueScene overlays.
   * BUG 1 FIX: If a dialogue is already active, enqueue the new one so it runs after.
   * FIX 8: Sets dialogueActive=true for the duration so pointer input is blocked.
   */
  private showDialogue(script: DialogueLine[], onComplete: () => void): void {
    if (this.dialogueActive) {
      this.dialogueQueue.push({ script, onComplete });
      return;
    }
    this.launchDialogueNow(script, onComplete);
  }

  private launchDialogueNow(script: DialogueLine[], onComplete: () => void): void {
    this.dialogueActive = true;
    this.scene.launch('DialogueScene', {
      script,
      onComplete: () => {
        this.dialogueActive = false;
        onComplete();
        if (this.dialogueQueue.length > 0) {
          const next = this.dialogueQueue.shift()!;
          this.launchDialogueNow(next.script, next.onComplete);
        }
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.time.delayedCall(ms, resolve);
    });
  }
}
