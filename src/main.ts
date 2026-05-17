/*
 * src/main.ts
 * Entry point for Petr-FE-Like.
 * Initialises the Phaser.Game instance with pixel-art rendering and registers
 * all three scenes: BootScene (asset preload/setup), ChapterScene (main gameplay),
 * and DialogueScene (FE-style dialogue overlay).
 *
 * Game dimensions:
 *   Width:  960px  (20 tiles × 48px)
 *   Height: 768px  (14 tiles × 48px = 672px map + 96px UI panel)
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { ChapterScene } from './scenes/ChapterScene';
import { DialogueScene } from './scenes/DialogueScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 768,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  parent: 'game-container',
  scene: [BootScene, ChapterScene, DialogueScene],
};

new Phaser.Game(config);
