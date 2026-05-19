/*
 * src/scenes/ChapterSelectScene.ts
 * Chapter selection screen for Inevitable Eternity.
 *
 * Layout:
 *   - Dark background with two horizontal amber rule lines framing the card area
 *   - Header "Select Chapter"
 *   - Scrollable grid of chapter cards (3 per row)
 *   - Each card shows: chapter number, title, description, lock icon if locked
 *   - Locked chapters are greyed out and non-interactive
 *   - In debug mode (?debug=1) all chapters are selectable regardless of lock
 *   - "Back" button → returns to TitleScene
 *
 * Card interaction:
 *   Click unlocked card → load ChapterStartData for that chapter, then start the
 *   appropriate Phaser scene with the canonical state injected as scene data.
 *
 * Debug mode:
 *   Detected from window.location.search (?debug=1).
 *   When active, a gold "DEBUG" badge is shown top-right and all chapters unlock.
 *
 * Scene key: 'ChapterSelectScene'
 */

import Phaser from 'phaser';
import { CHAPTER_DATA, type ChapterStartData } from '../data/chapterData';

const AMBER      = 0xffb347;
const GOLD       = 0xffd700;
const DARK_BG    = 0x0d0d1a;
const CARD_W     = 260;
const CARD_H     = 110;
const CARD_PAD_X = 30;
const CARD_PAD_Y = 24;
const COLS       = 3;
const CARD_AREA_TOP = 110;

function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('debug') === '1';
}

export class ChapterSelectScene extends Phaser.Scene {
  private debugMode = false;
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollY     = 0;
  private scrollMin   = 0;
  private scrollMax   = 0;
  private isDragging  = false;
  private dragStartY  = 0;
  private dragScrollY = 0;

  constructor() {
    super({ key: 'ChapterSelectScene' });
  }

  create(): void {
    this.debugMode = isDebugMode();
    const { width, height } = this.scale;

    // ── Background ────────────────────────────────────────────────────────────
    this.cameras.main.setBackgroundColor(DARK_BG);

    // Decorative rules
    const rules = this.add.graphics().setDepth(0);
    rules.lineStyle(1, AMBER, 0.3);
    rules.lineBetween(40, 88, width - 40, 88);
    rules.lineBetween(40, height - 52, width - 52, height - 52);

    // ── Header ────────────────────────────────────────────────────────────────
    this.add.text(width / 2, 44, 'Select Chapter', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize:   '36px',
      color:      '#ffd700',
      stroke:     '#3a2800',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1);

    // ── Debug badge ───────────────────────────────────────────────────────────
    if (this.debugMode) {
      this.add.text(width - 12, 12, 'DEBUG', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize:   '14px',
        color:      '#ffd700',
        backgroundColor: '#3a2800',
        padding: { x: 6, y: 3 },
      }).setOrigin(1, 0).setDepth(2);
    }

    // ── Back button ───────────────────────────────────────────────────────────
    const backBtn = this.add.text(40, height - 26, '← Back', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize:   '16px',
      color:      '#c89040',
    }).setOrigin(0, 0.5).setDepth(2).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover',  () => backBtn.setColor('#ffd700'));
    backBtn.on('pointerout',   () => backBtn.setColor('#c89040'));
    backBtn.on('pointerdown',  () => {
      this.cameras.main.fadeOut(400, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p === 1) this.scene.start('TitleScene');
      });
    });

    // ── Card grid ─────────────────────────────────────────────────────────────
    this.scrollContainer = this.add.container(0, CARD_AREA_TOP).setDepth(1);
    this.buildCards();

    // Calculate scroll bounds
    const totalRows = Math.ceil(CHAPTER_DATA.length / COLS);
    const gridHeight = totalRows * (CARD_H + CARD_PAD_Y) + CARD_PAD_Y;
    const visibleH   = height - CARD_AREA_TOP - 60;
    this.scrollMin = 0;
    this.scrollMax = Math.max(0, gridHeight - visibleH);

    // Mask to clip cards outside the visible area
    const maskShape = this.make.graphics();
    maskShape.fillRect(0, CARD_AREA_TOP, width, visibleH);
    this.scrollContainer.setMask(maskShape.createGeometryMask());

    // Mouse-wheel scroll
    this.input.on('wheel', (_ptr: unknown, _objs: unknown, _dx: number, dy: number) => {
      this.setScroll(this.scrollY + dy * 0.6);
    });

    // Touch/drag scroll
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < CARD_AREA_TOP || ptr.y > height - 60) return;
      this.isDragging  = true;
      this.dragStartY  = ptr.y;
      this.dragScrollY = this.scrollY;
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const delta = this.dragStartY - ptr.y;
      this.setScroll(this.dragScrollY + delta);
    });
    this.input.on('pointerup', () => { this.isDragging = false; });

    // Fade in
    this.cameras.main.fadeIn(400);
  }

  // ── Card construction ────────────────────────────────────────────────────────

  private buildCards(): void {
    const { width } = this.scale;
    const totalW    = COLS * CARD_W + (COLS - 1) * CARD_PAD_X;
    const startX    = (width - totalW) / 2;

    CHAPTER_DATA.forEach((chapter, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x   = startX + col * (CARD_W + CARD_PAD_X);
      const y   = CARD_PAD_Y + row * (CARD_H + CARD_PAD_Y);
      this.buildCard(chapter, x, y);
    });
  }

  private buildCard(chapter: ChapterStartData, x: number, y: number): void {
    const unlocked = chapter.unlocked || this.debugMode;
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.graphics();
    if (unlocked) {
      bg.fillStyle(0x1a1a2e, 1);
      bg.lineStyle(1, AMBER, 0.5);
    } else {
      bg.fillStyle(0x111118, 1);
      bg.lineStyle(1, 0x333344, 0.4);
    }
    bg.fillRoundedRect(0, 0, CARD_W, CARD_H, 6);
    bg.strokeRoundedRect(0, 0, CARD_W, CARD_H, 6);
    container.add(bg);

    // Chapter number badge
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(unlocked ? 0x3a2800 : 0x222230, 1);
    badgeBg.fillRect(0, 0, CARD_W, 24);
    container.add(badgeBg);

    // Title
    const titleColor = unlocked ? '#ffd700' : '#555566';
    const titleText  = this.add.text(10, 6, chapter.title, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize:   '13px',
      color:      titleColor,
    });
    container.add(titleText);

    // Description
    const descColor = unlocked ? '#c0a060' : '#444455';
    const descText  = this.add.text(10, 34, chapter.description, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize:   '11px',
      color:      descColor,
      wordWrap:   { width: CARD_W - 20 },
    });
    container.add(descText);

    // Lock icon
    if (!unlocked) {
      const lockText = this.add.text(CARD_W - 12, CARD_H - 12, '🔒', {
        fontSize: '14px',
      }).setOrigin(1, 1);
      container.add(lockText);
    }

    // Debug unlock indicator
    if (!chapter.unlocked && this.debugMode) {
      const dbgTag = this.add.text(CARD_W - 8, 6, 'DBG', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize:   '9px',
        color:      '#ffd700',
      }).setOrigin(1, 0);
      container.add(dbgTag);
    }

    // Interactivity
    if (unlocked) {
      bg.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, CARD_W, CARD_H),
        Phaser.Geom.Rectangle.Contains,
      );

      bg.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x2a2a4e, 1);
        bg.lineStyle(2, GOLD, 0.9);
        bg.fillRoundedRect(0, 0, CARD_W, CARD_H, 6);
        bg.strokeRoundedRect(0, 0, CARD_W, CARD_H, 6);
        this.input.setDefaultCursor('pointer');
      });

      bg.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x1a1a2e, 1);
        bg.lineStyle(1, AMBER, 0.5);
        bg.fillRoundedRect(0, 0, CARD_W, CARD_H, 6);
        bg.strokeRoundedRect(0, 0, CARD_W, CARD_H, 6);
        this.input.setDefaultCursor('default');
      });

      bg.on('pointerdown', () => {
        this.input.setDefaultCursor('default');
        this.launchChapter(chapter);
      });
    }

    this.scrollContainer.add(container);
  }

  // ── Scroll helpers ────────────────────────────────────────────────────────────

  private setScroll(value: number): void {
    this.scrollY = Phaser.Math.Clamp(value, this.scrollMin, this.scrollMax);
    this.scrollContainer.y = CARD_AREA_TOP - this.scrollY;
  }

  // ── Chapter launch ────────────────────────────────────────────────────────────

  private launchChapter(chapter: ChapterStartData): void {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress !== 1) return;

      // Pass canonical start state to the scene via init data
      this.scene.start(chapter.sceneKey, {
        chapterStartData: chapter,
        debugMode:        this.debugMode,
      });
    });
  }
}
