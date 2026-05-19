/*
 * src/scenes/DialogueScene.ts
 * FE-style dialogue overlay scene for Petr-FE-Like.
 *
 * Launched by ChapterScene via:
 *   this.scene.launch('DialogueScene', { script, onComplete })
 *
 * Layout (bottom 180px):
 *   - Semi-transparent dark bar (full width × 180px, y = 588)
 *   - Portrait area: 160×180px at x=0, coloured rectangle + speaker initial
 *   - Text box: x=170 onward — speaker name in gold, dialogue text in white
 *   - "▶" advance indicator at bottom-right
 *
 * Advance: pointer-down anywhere or Spacebar.
 * When the last line is shown and the player advances, onComplete() is called
 * and this scene is stopped.
 *
 * Data format expected from scene.launch:
 *   { script: DialogueLine[], onComplete: () => void }
 *
 * Portrait colours by portrait key:
 *   eirika=0x3355cc, tana=0x33aa55, vanessa=0x33aacc, syrene=0xcc7733, narrator=0x444444
 */

import Phaser from 'phaser';
import type { DialogueLine } from '../data/dialogue';

const PORTRAIT_COLORS: Record<string, number> = {
  eirika:   0x3355cc,
  tana:     0x33aa55,
  vanessa:  0x33aacc,
  syrene:   0xcc7733,
  narrator: 0x444444,
};

const PANEL_Y      = 588;  // 768 - 180
const PANEL_HEIGHT = 180;
const PORTRAIT_W   = 160;

export class DialogueScene extends Phaser.Scene {
  private script:     DialogueLine[] = [];
  private onComplete: (() => void)   = () => {};
  private lineIndex:  number         = 0;

  // Graphics/text objects
  private portraitBg!:  Phaser.GameObjects.Rectangle;
  private portraitText!: Phaser.GameObjects.Text;
  private speakerText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private advanceText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'DialogueScene' });
  }

  init(data: { script: DialogueLine[]; onComplete: () => void }): void {
    this.script     = data.script ?? [];
    this.onComplete = data.onComplete ?? (() => {});
    this.lineIndex  = 0;
  }

  create(): void {
    const { width } = this.scale;

    // Semi-transparent overlay
    this.add.rectangle(0, PANEL_Y, width, PANEL_HEIGHT, 0x000000, 0.85)
      .setOrigin(0, 0);

    // Portrait box
    this.portraitBg = this.add.rectangle(0, PANEL_Y, PORTRAIT_W, PANEL_HEIGHT, 0x333333)
      .setOrigin(0, 0);

    this.portraitText = this.add.text(PORTRAIT_W / 2, PANEL_Y + PANEL_HEIGHT / 2, '', {
      fontSize:  '48px',
      color:     '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5);

    // Speaker name
    this.speakerText = this.add.text(PORTRAIT_W + 12, PANEL_Y + 10, '', {
      fontSize:  '18px',
      color:     '#ffcc44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0, 0);

    // Dialogue body
    this.dialogueText = this.add.text(PORTRAIT_W + 12, PANEL_Y + 38, '', {
      fontSize:   '16px',
      color:      '#ffffff',
      fontFamily: 'monospace',
      wordWrap:   { width: width - PORTRAIT_W - 24 },
      lineSpacing: 6,
    }).setOrigin(0, 0);

    // Advance indicator
    this.advanceText = this.add.text(width - 16, PANEL_Y + PANEL_HEIGHT - 16, '▶', {
      fontSize:  '18px',
      color:     '#ffcc44',
      fontFamily: 'monospace',
    }).setOrigin(1, 1);

    // Blink the advance indicator
    this.tweens.add({
      targets: this.advanceText,
      alpha:   0,
      duration: 400,
      yoyo:    true,
      repeat:  -1,
    });

    // Input
    this.input.on('pointerdown', this.advance, this);
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', this.advance, this);
    }

    this.showLine(0);
  }

  private showLine(index: number): void {
    if (index >= this.script.length) {
      this.finish();
      return;
    }

    const line = this.script[index];
    const portraitColor = PORTRAIT_COLORS[line.portrait] ?? 0x444444;

    this.portraitBg.setFillStyle(portraitColor);
    this.portraitText.setText(line.speaker.charAt(0).toUpperCase());
    this.speakerText.setText(line.speaker);
    this.dialogueText.setText(line.text);
  }

  private advance(): void {
    this.lineIndex++;
    if (this.lineIndex >= this.script.length) {
      this.finish();
    } else {
      this.showLine(this.lineIndex);
    }
  }

  private finish(): void {
    this.input.off('pointerdown', this.advance, this);
    if (this.input.keyboard) {
      this.input.keyboard.off('keydown-SPACE', this.advance, this);
    }
    this.scene.stop();
    this.onComplete();
  }
}
