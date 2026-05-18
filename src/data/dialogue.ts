/*
 * src/data/dialogue.ts
 * Chapter 1 dialogue scripts for Petr-FE-Like.
 *
 * DialogueLine:
 *   speaker  — display name shown in the UI box
 *   text     — dialogue text
 *   portrait — key string used to colour the portrait placeholder
 *              ('eirika' | 'tana' | 'vanessa' | 'syrene' | 'narrator'
 *               | 'maya' | 'npc' | 'hand' | 'enemy')
 *
 * DialogueScript: DialogueLine[]
 *
 * Exported scripts (CHANGE L — full rewrite, tone: player = despair/helplessness,
 *                    enemy = appreciative collector):
 *   openingDialogue               — 4 lines; Eirika/Tana react to petrified gate guards
 *   weakGorgonOpeningDialogue     — 4 lines; inner-hall cutscene before turn 1
 *   mayaCalloutDialogue           — 2 lines; fires on turn 2 start
 *   fleeingNPCDialogue            — 2 lines; fires on turn 3 start
 *   gateHoldDialogue              — 4 lines; Vanessa/Syrene decide to hold the gate
 *   handincomingDialogue          — 6 lines; The Hand first appears
 *   breachGuardDialogue           — 3 lines; The Hand petrifies breach guards (no "..." — simultaneous)
 *   vanessaHandPetrifiedDialogue  — 5 lines; Vanessa captured by The Hand (incl. "..." line)
 *   syreneHandPetrifiedDialogue   — 5 lines; Syrene captured by The Hand (incl. "..." line)
 *   tanaHandPetrifiedDialogue     — 4 lines; Tana captured by The Hand (incl. "..." line)
 *   mayaPetrifiedDialogue         — 4 lines; Maya petrified (timer fail / enemy) (incl. "..." line)
 *   amberShardFoundDialogue       — 2 lines; Amber Shard pick-up
 *
 * Combat petrification dialogues (HP=0, CHANGE M — all now include "..." line):
 *   eirikaCombatPetrifiedDialogue  — 4 lines
 *   tanaCombatPetrifiedDialogue    — 4 lines
 *   vanessaCombatPetrifiedDialogue — 4 lines
 *   syreneCombatPetrifiedDialogue  — 4 lines
 *
 * Variant stage-clear dialogues (CHANGE P — picked by triggerChapterClear):
 *   closingDialogue_allSurvived   — all named units made it out
 *   closingDialogue_someLost      — Tana survived, some others lost (default)
 *   closingDialogue_tanaLost      — Tana petrified, Eirika escaped
 *   closingDialogue_allLost       — all named units lost, only Eirika escaped
 *   closingDialogue               — alias of closingDialogue_someLost (backward compat)
 *
 * Compatibility re-exports (names used by ChapterScene before this rewrite):
 *   vanessaPetrifiedDialogue  → alias of vanessaHandPetrifiedDialogue
 *   syrenePetrifiedDialogue   → alias of syreneHandPetrifiedDialogue
 *   tanaPetrifiedDialogue     → alias of tanaHandPetrifiedDialogue
 *   syreneCapturedDialogue    → 1 narrator line (kept for compat)
 */

export interface DialogueLine {
  speaker:  string;
  text:     string;
  portrait: string;
}

export type DialogueScript = DialogueLine[];

// ---------------------------------------------------------------------------
// Opening: Eirika and Tana see the petrified gate guards
// ---------------------------------------------------------------------------

export const openingDialogue: DialogueLine[] = [
  { speaker: 'Tana',   text: "Eirika — those aren't statues. Those were the gate guards.", portrait: 'tana' },
  { speaker: 'Eirika', text: "...How fast did this spread? We've only just arrived.", portrait: 'eirika' },
  { speaker: 'Tana',   text: "We can't do anything for them now. If we stay, we'll end up just like them.", portrait: 'tana' },
  { speaker: 'Eirika', text: "Then we move. North. Before I have to watch anyone else freeze.", portrait: 'eirika' },
];

// ---------------------------------------------------------------------------
// Weak Gorgon opening cutscene (fires at chapter start, before turn 1)
// ---------------------------------------------------------------------------

export const weakGorgonOpeningDialogue: DialogueLine[] = [
  { speaker: 'Narrator', text: "Inside the stronghold, a Gorgon has already breached the inner hall.", portrait: '' },
  { speaker: 'Guard',    text: "Stay back — don't look at it—!", portrait: 'npc' },
  { speaker: 'Narrator', text: "Too late.", portrait: '' },
  { speaker: 'Gorgon',   text: "...Lovely. The arm raised like that — it almost looks heroic.", portrait: 'enemy' },
];

// ---------------------------------------------------------------------------
// NPC hint dialogues — fired by turn-start triggers
// ---------------------------------------------------------------------------

/** Fires on turn 2 start: Maya calls out from north of the wall. */
export const mayaCalloutDialogue: DialogueLine[] = [
  { speaker: 'Maya', text: "Please — I can't feel my feet! It's spreading, I can't—", portrait: 'maya' },
  { speaker: 'Maya', text: "Don't leave me like this. Please. I don't want to be left here.", portrait: 'maya' },
];

/** Fires on turn 3 start: fleeing NPC warns about The Hand. */
export const fleeingNPCDialogue: DialogueLine[] = [
  { speaker: '???', text: "It got Mira — right in front of me — she just stopped moving and I couldn't—", portrait: 'npc' },
  { speaker: '???', text: "Run! Don't let it look at you!", portrait: 'npc' },
];

// ---------------------------------------------------------------------------
// Gate hold: Vanessa and Syrene
// ---------------------------------------------------------------------------

export const gateHoldDialogue: DialogueLine[] = [
  { speaker: 'Vanessa', text: "Syrene. The princess needs passage.", portrait: 'vanessa' },
  { speaker: 'Syrene',  text: "Then we give her passage.", portrait: 'syrene' },
  { speaker: 'Vanessa', text: "We may not make it out with her.", portrait: 'vanessa' },
  { speaker: 'Syrene',  text: "I know. Hold until she's clear.", portrait: 'syrene' },
];

// ---------------------------------------------------------------------------
// The Hand incoming — first-encounter lines
// ---------------------------------------------------------------------------

export const handincomingDialogue: DialogueLine[] = [
  { speaker: '???',    text: "You've been trying so hard. All this running — and for what?", portrait: 'hand' },
  { speaker: 'Eirika', text: "Who — what are you?!", portrait: 'eirika' },
  { speaker: '???',    text: "The Amber Hand. I've been collecting the ones you left behind.", portrait: 'hand' },
  { speaker: '???',    text: "Don't worry. They're beautiful. I'll find somewhere worthy to display them.", portrait: 'hand' },
  { speaker: 'Eirika', text: "They're people — you can't just—", portrait: 'eirika' },
  { speaker: '???',    text: "People are temporary. Stone is eternal. Now run, little lord. I have work to do.", portrait: 'hand' },
];

// ---------------------------------------------------------------------------
// Breach guards petrified (The Hand spawn sequence — CHANGE K)
// ---------------------------------------------------------------------------

export const breachGuardDialogue: DialogueLine[] = [
  { speaker: 'Guard',    text: "S-stop — don't come any—", portrait: 'npc' },
  { speaker: 'Narrator', text: "The Hand doesn't slow. Both guards are stone before the echo fades.", portrait: '' },
  { speaker: 'The Hand', text: "A matched pair. I'll place them symmetrically.", portrait: 'hand' },
];

// ---------------------------------------------------------------------------
// Named character petrification dialogues (The Hand capture)
// ---------------------------------------------------------------------------

export const vanessaHandPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Vanessa',  text: "...Don't look, Syrene.", portrait: 'vanessa' },
  { speaker: 'The Hand', text: "A pegasus knight at her post. There's something almost noble about it.", portrait: 'hand' },
  { speaker: 'The Hand', text: "She'll stand at the eastern corridor. The wings will catch the light beautifully.", portrait: 'hand' },
  { speaker: 'Vanessa',  text: "...", portrait: 'vanessa' },
  { speaker: 'Narrator', text: "Vanessa has been petrified.", portrait: '' },
];

export const syreneHandPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Syrene',   text: "Vanessa... I held as long as I could.", portrait: 'syrene' },
  { speaker: 'The Hand', text: "Loyalty to the end. I appreciate that in a subject.", portrait: 'hand' },
  { speaker: 'The Hand', text: "She'll stand beside her partner. A pair, as they were in life.", portrait: 'hand' },
  { speaker: 'Syrene',   text: "...", portrait: 'syrene' },
  { speaker: 'Narrator', text: "Syrene has been petrified.", portrait: '' },
];

export const tanaHandPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Tana',     text: "Eirika — run! Don't stop for me—!", portrait: 'tana' },
  { speaker: 'The Hand', text: "Mid-flight. The wings, the expression — exquisite. This one goes to the Queen herself.", portrait: 'hand' },
  { speaker: 'Tana',     text: "...", portrait: 'tana' },
  { speaker: 'Narrator', text: "Tana has been petrified.", portrait: '' },
];

// ---------------------------------------------------------------------------
// Backward-compatibility aliases (used by ChapterScene petrifyNamedCharacter)
// ---------------------------------------------------------------------------

export const vanessaPetrifiedDialogue: DialogueLine[] = vanessaHandPetrifiedDialogue;
export const syrenePetrifiedDialogue:  DialogueLine[] = syreneHandPetrifiedDialogue;
export const tanaPetrifiedDialogue:    DialogueLine[] = tanaHandPetrifiedDialogue;

/** Kept for backward compatibility — superseded by syreneHandPetrifiedDialogue. */
export const syreneCapturedDialogue: DialogueLine[] = [
  { speaker: 'Narrator', text: "Syrene has been taken. The Gorgons carry her stone form away into the dark.", portrait: '' },
];

// ---------------------------------------------------------------------------
// Maya petrified (timer-fail / enemy petrifies her)
// ---------------------------------------------------------------------------

export const mayaPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Maya',     text: "I knew... you weren't going to make it in time...", portrait: 'maya' },
  { speaker: 'Enemy',    text: "A commoner, but the expression is genuine terror. Those are rare. She'll sell well.", portrait: 'enemy' },
  { speaker: 'Maya',     text: "...", portrait: 'maya' },
  { speaker: 'Narrator', text: "Maya has been petrified and collected.", portrait: '' },
];

// ---------------------------------------------------------------------------
// Closing: escape reached — four variants based on who survived (CHANGE P)
// ---------------------------------------------------------------------------

/** All named units survived (unlikely but possible). */
export const closingDialogue_allSurvived: DialogueLine[] = [
  { speaker: 'Tana',   text: "We made it. Everyone.", portrait: 'tana' },
  { speaker: 'Eirika', text: "Barely. Tana... we can't face that again without something to fight back with.", portrait: 'eirika' },
  { speaker: 'Tana',   text: "Then we find a way. We have to.", portrait: 'tana' },
];

/** Tana survived, some others lost (default). */
export const closingDialogue_someLost: DialogueLine[] = [
  { speaker: 'Tana',   text: "We made it out. Eirika... we made it.", portrait: 'tana' },
  { speaker: 'Eirika', text: "How many did we leave behind?", portrait: 'eirika' },
  { speaker: 'Tana',   text: "...", portrait: 'tana' },
  { speaker: 'Eirika', text: "I need to know exactly how many. Every single one.", portrait: 'eirika' },
  { speaker: 'Tana',   text: "I'll count.", portrait: 'tana' },
];

/** Tana petrified, Eirika escaped (alone or with Vanessa/Syrene). */
export const closingDialogue_tanaLost: DialogueLine[] = [
  { speaker: 'Eirika',   text: "Tana... I couldn't even—", portrait: 'eirika' },
  { speaker: 'Eirika',   text: "I'll come back. I'll come back for all of them.", portrait: 'eirika' },
  { speaker: 'Narrator', text: "Eirika escapes. The list of those left behind grows longer.", portrait: '' },
];

/** All named units lost, only Eirika escaped. */
export const closingDialogue_allLost: DialogueLine[] = [
  { speaker: 'Eirika', text: "They're all gone. Every one of them.", portrait: 'eirika' },
  { speaker: 'Eirika', text: "She said stone is eternal. Then I have time.", portrait: 'eirika' },
  { speaker: 'Eirika', text: "I'll come back. Even if it takes everything I have.", portrait: 'eirika' },
];

/** Backward-compat alias — same as closingDialogue_someLost. */
export const closingDialogue = closingDialogue_someLost;

// ---------------------------------------------------------------------------
// Amber Shard found
// ---------------------------------------------------------------------------

export const amberShardFoundDialogue: DialogueLine[] = [
  { speaker: 'Eirika',   text: "This shard... there's something warm in it, despite everything.", portrait: 'eirika' },
  { speaker: 'Narrator', text: "A fragment of ancient stone-resistance. Max STO-RES +5.", portrait: '' },
];

// ---------------------------------------------------------------------------
// Combat petrification dialogues (HP=0 triggers petrification, CHANGE M)
// ---------------------------------------------------------------------------

export const eirikaCombatPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Eirika',   text: "I can't... move. It's spreading so fast—", portrait: 'eirika' },
  { speaker: 'Enemy',    text: "A lord. They always make the finest centerpieces.", portrait: 'enemy' },
  { speaker: 'Eirika',   text: "...", portrait: 'eirika' },
  { speaker: 'Narrator', text: "Eirika has been petrified. The retreat has failed.", portrait: '' },
];

export const tanaCombatPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Tana',     text: "Eirika—! I'm sorry, I can't—", portrait: 'tana' },
  { speaker: 'Enemy',    text: "Mid-flight. The wings almost look real. The Order will want this one.", portrait: 'enemy' },
  { speaker: 'Tana',     text: "...", portrait: 'tana' },
  { speaker: 'Narrator', text: "Tana has been petrified.", portrait: '' },
];

export const vanessaCombatPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Vanessa',  text: "Hold... someone has to hold the gate—", portrait: 'vanessa' },
  { speaker: 'Enemy',    text: "Two pegasus knights at the same post. The entrance hall will suit them well.", portrait: 'enemy' },
  { speaker: 'Vanessa',  text: "...", portrait: 'vanessa' },
  { speaker: 'Narrator', text: "Vanessa has been petrified.", portrait: '' },
];

export const syreneCombatPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Syrene',   text: "Vanessa... I held as long as I could.", portrait: 'syrene' },
  { speaker: 'Enemy',    text: "The older one. Experienced posture — there's dignity in it. She'll look fine on a pedestal.", portrait: 'enemy' },
  { speaker: 'Syrene',   text: "...", portrait: 'syrene' },
  { speaker: 'Narrator', text: "Syrene has been petrified.", portrait: '' },
];
