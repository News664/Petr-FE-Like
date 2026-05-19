/*
 * src/scenes/TitleScene.ts
 * Title screen for Inevitable Eternity.
 *
 * Layout:
 *   - Deep dark background (#0d0d1a)
 *   - Amber particle field (slow upward drift, 60 particles)
 *   - Subtitle "Inevitable Eternity" in large serif-style pixel text
 *   - Game sub-label "A GBA Fire Emblem Fan Game" in small text
 *   - "Press ENTER or Click to Begin" prompt with slow fade blink
 *   - Version string bottom-right
 *
 * Flow:
 *   Any click or ENTER key → fade out → start ChapterSelectScene
 *
 * Particle system is faked with Phaser Graphics objects and tweens
 * (no external assets required, consistent with the rest of the project).
 *
 * Scene key: 'TitleScene'
 */

import Phaser from 'phaser';

const AMBER   = 0xffb347;
const GOLD    = 0xffd700;
const DARK_BG = 0x0d0d1a;

interface Particle {
  gfx:  Phaser.GameObjects.Graphics;
  vx:   number;
  vy:   number;
  life: number;
  maxLife: number;
  size: number;
}

export class TitleScene extends Phaser.Scene {
  private particles: Particle[] = [];
  private promptText!: Phaser.GameObjects.Text;
  private started = false;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // ── Background ──────────────────────────────────────────────────────────
    this.cameras.main.setBackgroundColor(DARK_BG);

    // Horizontal rule — faint amber line across middle-upper area
    const rule = this.add.graphics();
    rule.lineStyle(1, AMBER, 0.25);
    rule.lineBetween(width * 0.1, height * 0.38, width * 0.9, height * 0.38);
    rule.lineBetween(width * 0.1, height * 0.66, width * 0.9, height * 0.66);

    // ── Particle field ───────────────────────────────────────────────────────
    this.spawnInitialParticles();

    // ── Title text ───────────────────────────────────────────────────────────
    const titleText = this.add.text(width / 2, height * 0.42, 'Inevitable Eternity', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize:   '64px',
      color:      '#ffd700',
      stroke:     '#3a2800',
      strokeThickness: 6,
      shadow: {
        offsetX: 2,
        offsetY: 4,
        color:   '#000000',
        blur:    8,
        fill:    true,
      },
    }).setOrigin(0.5).setAlpha(0);

    const subLabel = this.add.text(width / 2, height * 0.56, 'A GBA Fire Emblem Fan Game', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize:   '20px',
      color:      '#c89040',
    }).setOrigin(0.5).setAlpha(0);

    // ── Prompt ───────────────────────────────────────────────────────────────
    this.promptText = this.add.text(width / 2, height * 0.74, 'Press ENTER or Click to Begin', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize:   '18px',
      color:      '#ffb347',
    }).setOrigin(0.5).setAlpha(0);

    // ── Version ───────────────────────────────────────────────────────────────
    this.add.text(width - 12, height - 12, 'v0.1-alpha', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize:   '12px',
      color:      '#555577',
    }).setOrigin(1, 1);

    // ── Fade-in sequence ──────────────────────────────────────────────────────
    this.tweens.add({
      targets:  titleText,
      alpha:    1,
      duration: 1800,
      ease:     'Quad.easeIn',
    });
    this.tweens.add({
      targets:  subLabel,
      alpha:    1,
      delay:    600,
      duration: 1400,
      ease:     'Quad.easeIn',
      onComplete: () => this.startPromptBlink(),
    });

    // ── Input ─────────────────────────────────────────────────────────────────
    this.input.once('pointerdown', () => this.beginGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.beginGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.beginGame());
  }

  update(_time: number, delta: number): void {
    this.updateParticles(delta);
    this.spawnParticleIfNeeded();
  }

  // ── Particles ──────────────────────────────────────────────────────────────

  private spawnInitialParticles(): void {
    for (let i = 0; i < 60; i++) {
      this.spawnParticle(true);
    }
  }

  private spawnParticleIfNeeded(): void {
    if (this.particles.length < 60) {
      this.spawnParticle(false);
    }
  }

  private spawnParticle(scatter: boolean): void {
    const { width, height } = this.scale;
    const size    = Phaser.Math.Between(1, 3);
    const maxLife = Phaser.Math.Between(3000, 8000);
    const life    = scatter ? Phaser.Math.Between(0, maxLife) : maxLife;

    const x = scatter
      ? Phaser.Math.Between(0, width)
      : Phaser.Math.Between(0, width);
    const y = scatter
      ? Phaser.Math.Between(0, height)
      : height + size * 2;

    const gfx = this.add.graphics().setDepth(1);
    const alpha = Phaser.Math.FloatBetween(0.15, 0.55);
    const color = Phaser.Math.Between(0, 1) ? AMBER : GOLD;
    gfx.fillStyle(color, alpha);
    gfx.fillRect(x, y, size, size);

    const particle: Particle = {
      gfx,
      vx:      Phaser.Math.FloatBetween(-0.2, 0.2),
      vy:      Phaser.Math.FloatBetween(-0.4, -1.2),
      life,
      maxLife,
      size,
    };
    this.particles.push(particle);
  }

  private updateParticles(delta: number): void {
    const dt = delta / 16.67; // normalise to ~60fps
    const dead: Particle[] = [];

    for (const p of this.particles) {
      p.life -= delta;
      if (p.life <= 0) {
        dead.push(p);
        continue;
      }
        p.gfx.x += p.vx * dt;
      p.gfx.y += p.vy * dt;

      // Fade out as life decreases
      const lifeRatio = p.life / p.maxLife;
      p.gfx.setAlpha(lifeRatio * 0.55);
    }

    for (const p of dead) {
      p.gfx.destroy();
      this.particles.splice(this.particles.indexOf(p), 1);
    }
  }

  // ── Prompt blink ───────────────────────────────────────────────────────────

  private startPromptBlink(): void {
    this.tweens.add({
      targets:  this.promptText,
      alpha:    { from: 0, to: 1 },
      duration: 800,
      ease:     'Sine.easeInOut',
      onComplete: () => {
        this.tweens.add({
          targets:    this.promptText,
          alpha:      { from: 1, to: 0.2 },
          duration:   900,
          ease:       'Sine.easeInOut',
          yoyo:       true,
          repeat:     -1,
          repeatDelay: 200,
        });
      },
    });
  }

  // ── Transition ────────────────────────────────────────────────────────────

  private beginGame(): void {
    if (this.started) return;
    this.started = true;

    this.cameras.main.fadeOut(600, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.scene.start('ChapterSelectScene');
      }
    });
  }
}
