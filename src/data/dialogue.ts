/*
 * src/data/dialogue.ts
 * Chapter 1 dialogue scripts for Petr-FE-Like.
 *
 * DialogueLine:
 *   speaker  — display name shown in the UI box
 *   text     — dialogue text
 *   portrait — key string used to colour the portrait placeholder
 *              ('eirika' | 'tana' | 'vanessa' | 'syrene' | 'narrator')
 *
 * DialogueScript: DialogueLine[]
 *
 * Exported scripts:
 *   openingDialogue        — 3 lines; Eirika/Tana react to the stone plague
 *   mayaPetrifiedDialogue  — 1 narrator line
 *   closingDialogue        — 2 lines; Eirika/Tana at the escape
 *   gateHoldDialogue       — 2 lines; Vanessa/Syrene decide to hold the gate
 *   vanessaPetrifiedDialogue — 1 narrator line
 *   syreneCapturedDialogue   — 1 narrator line
 */

export interface DialogueLine {
  speaker:  string;
  text:     string;
  portrait: string;
}

export type DialogueScript = DialogueLine[];

// ---------------------------------------------------------------------------
// Opening: Eirika and Tana see the stone plague advancing
// ---------------------------------------------------------------------------

export const openingDialogue: DialogueScript = [
  {
    speaker:  'Eirika',
    text:     'Tana, look — those people are turning to stone! The plague is spreading faster than we feared.',
    portrait: 'eirika',
  },
  {
    speaker:  'Tana',
    text:     'The Gorgons are driving it northward. We have to get the civilians out before the wave reaches the gate!',
    portrait: 'tana',
  },
  {
    speaker:  'Eirika',
    text:     'Vanessa, Syrene — hold the gate as long as you can. We will evacuate whoever we can find.',
    portrait: 'eirika',
  },
];

// ---------------------------------------------------------------------------
// Maya petrified (onFail for her timer)
// ---------------------------------------------------------------------------

export const mayaPetrifiedDialogue: DialogueScript = [
  {
    speaker:  'Narrator',
    text:     'Maya has been petrified. Her stone form stands silent beside the well.',
    portrait: 'narrator',
  },
];

// ---------------------------------------------------------------------------
// Closing: escape reached
// ---------------------------------------------------------------------------

export const closingDialogue: DialogueScript = [
  {
    speaker:  'Eirika',
    text:     '…I look back and I still see the statues. How many people did we lose today?',
    portrait: 'eirika',
  },
  {
    speaker:  'Tana',
    text:     'We cannot save them all, Eirika — but we must keep moving, or we become statues too.',
    portrait: 'tana',
  },
];

// ---------------------------------------------------------------------------
// Gate hold: Vanessa and Syrene
// ---------------------------------------------------------------------------

export const gateHoldDialogue: DialogueScript = [
  {
    speaker:  'Vanessa',
    text:     'Syrene, we hold here. Not one Gorgon passes through this gate.',
    portrait: 'vanessa',
  },
  {
    speaker:  'Syrene',
    text:     'Understood. Stay mobile — if a Gorgon fixes its gaze on you, your lance is useless.',
    portrait: 'syrene',
  },
];

// ---------------------------------------------------------------------------
// Vanessa petrified
// ---------------------------------------------------------------------------

export const vanessaPetrifiedDialogue: DialogueScript = [
  {
    speaker:  'Narrator',
    text:     'Vanessa has been petrified. She stands frozen at the gate, lance still raised.',
    portrait: 'narrator',
  },
];

// ---------------------------------------------------------------------------
// Syrene captured (enemy reaches adjacent to her petrified form)
// ---------------------------------------------------------------------------

export const syreneCapturedDialogue: DialogueScript = [
  {
    speaker:  'Narrator',
    text:     'Syrene has been taken. The Gorgons carry her stone form away into the dark.',
    portrait: 'narrator',
  },
];
