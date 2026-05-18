/*
 * src/data/dialogue.ts
 * Chapter 1 dialogue scripts for Petr-FE-Like.
 *
 * DialogueLine:
 *   speaker  — display name shown in the UI box
 *   text     — dialogue text
 *   portrait — key string used to colour the portrait placeholder
 *              ('eirika' | 'tana' | 'vanessa' | 'syrene' | 'narrator'
 *               | 'maya' | 'npc' | 'hand')
 *
 * DialogueScript: DialogueLine[]
 *
 * Exported scripts:
 *   openingDialogue              — 3 lines; Eirika/Tana react to the stone plague
 *   mayaPetrifiedDialogue        — 1 narrator line (old timer-fail line)
 *   closingDialogue              — 2 lines; Eirika/Tana at the escape
 *   gateHoldDialogue             — 2 lines; Vanessa/Syrene decide to hold the gate
 *   vanessaPetrifiedDialogue     — 2 lines; Vanessa + narrator (The Hand capture)
 *   syrenePetrifiedDialogue      — 2 lines; Syrene + narrator
 *   tanaPetrifiedDialogue        — 2 lines; Tana + narrator
 *   syreneCapturedDialogue       — 1 narrator line (old capture line, kept for compat)
 *   handincomingDialogue         — 4 lines; The Hand first appears
 *   mayaCalloutDialogue          — 1 line; fires on turn 2 start
 *   fleeingNPCDialogue           — 1 line; fires on turn 3 start
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
// Named character petrification dialogues (The Hand capture)
// ---------------------------------------------------------------------------

export const vanessaPetrifiedDialogue: DialogueScript = [
  {
    speaker:  'Vanessa',
    text:     'Princess Eirika — please, run! Don\'t look back!',
    portrait: 'vanessa',
  },
  {
    speaker:  'Narrator',
    text:     'Vanessa has been petrified.',
    portrait: '',
  },
];

export const syrenePetrifiedDialogue: DialogueScript = [
  {
    speaker:  'Syrene',
    text:     'Vanessa... I\'m sorry. I couldn\'t hold on.',
    portrait: 'syrene',
  },
  {
    speaker:  'Narrator',
    text:     'Syrene has been petrified.',
    portrait: '',
  },
];

export const tanaPetrifiedDialogue: DialogueScript = [
  {
    speaker:  'Tana',
    text:     'I\'m — I can\'t move. Eirika, go! Go now!',
    portrait: 'tana',
  },
  {
    speaker:  'Narrator',
    text:     'Tana has been petrified.',
    portrait: '',
  },
];

// ---------------------------------------------------------------------------
// Syrene captured (old capture line — kept for backward compatibility)
// ---------------------------------------------------------------------------

export const syreneCapturedDialogue: DialogueScript = [
  {
    speaker:  'Narrator',
    text:     'Syrene has been taken. The Gorgons carry her stone form away into the dark.',
    portrait: 'narrator',
  },
];

// ---------------------------------------------------------------------------
// The Hand incoming — first-encounter lines
// ---------------------------------------------------------------------------

export const handincomingDialogue: DialogueScript = [
  {
    speaker:  '???',
    text:     '...How many have you collected tonight, I wonder.',
    portrait: 'hand',
  },
  {
    speaker:  'Eirika',
    text:     'What — who are you?!',
    portrait: 'eirika',
  },
  {
    speaker:  '???',
    text:     'Run, little lord. The Amber Hand is patient.',
    portrait: 'hand',
  },
];

// ---------------------------------------------------------------------------
// NPC hint dialogues — fired by turn-start triggers
// ---------------------------------------------------------------------------

/** Fires on turn 2 start: Maya calls out from north of the wall. */
export const mayaCalloutDialogue: DialogueLine[] = [
  { speaker: 'Maya', text: 'Someone — please! They\'re turning to stone out here!', portrait: 'maya' },
];

/** Fires on turn 3 start: fleeing NPC warns about The Hand. */
export const fleeingNPCDialogue: DialogueLine[] = [
  { speaker: '???', text: 'We can\'t outrun it! The stone spreads wherever it steps!', portrait: 'npc' },
];
