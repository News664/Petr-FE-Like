/*
 * src/main.ts
 * Entry point for Inevitable Eternity (Petr-FE-Like).
 * Initialises the Phaser.Game instance with pixel-art rendering and registers
 * all scenes in load order.
 *
 * Scene order (first listed = first started):
 *   BootScene          — asset preload stub, transitions to TitleScene
 *   TitleScene         — "Inevitable Eternity" title screen, amber particles
 *   ChapterSelectScene — chapter card selector, debug mode support
 *   ChapterScene       — Chapter 1 main gameplay
 *   DialogueScene      — FE-style dialogue overlay (launched on top of gameplay)
 *
 * Game dimensions:
 *   Width:  960px  (20 tiles × 48px)
 *   Height: 768px  (14 tiles × 48px = 672px map + 96px UI panel)
 */

import Phaser from 'phaser';
import { BootScene }          from './scenes/BootScene';
import { TitleScene }         from './scenes/TitleScene';
import { ChapterSelectScene } from './scenes/ChapterSelectScene';
import { ChapterScene }       from './scenes/ChapterScene';
import { DialogueScene }      from './scenes/DialogueScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 768,
  backgroundColor: '#0d0d1a',
  pixelArt: true,
  parent: 'game-container',
  scene: [BootScene, TitleScene, ChapterSelectScene, ChapterScene, DialogueScene],
};

new Phaser.Game(config);
