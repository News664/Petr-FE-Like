/*
 * src/scenes/BootScene.ts
 * Asset preload and initialisation scene for Inevitable Eternity.
 *
 * Since all graphics are drawn programmatically (no external image assets),
 * this scene's only job is to be a defined preload stage before TitleScene.
 * It immediately transitions to TitleScene on create().
 *
 * If real sprite sheets are added in future, load them here in preload().
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // No external assets to load — all tiles and units are drawn with Graphics.
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
