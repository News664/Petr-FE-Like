/*
 * src/data/dialogue.ts
 * Chapter 1 dialogue scripts for Petr-FE-Like.
 *
 * DialogueLine:
 *   speaker  — display name shown in the UI box
 *   text     — dialogue text
 *   portrait — key string used to colour the portrait placeholder
 *              ('eirika' | 'tana' | 'vanessa' | 'syrene' | 'narrator'
 *               | 'maya' | 'npc' | 'npc_west' | 'npc_east' | 'hand' | 'enemy')
 *              npc_west = NW fleeing girl (younger, panicked); npc_east = NE fleeing girl (exhausted, resigned)
 *
 * DialogueScript: DialogueLine[]
 *
 * Exported scripts (CHANGE L — full rewrite, tone: player = despair/helplessness,
 *                    enemy = appreciative collector;
 *                    BUG 4 FIX — all petrification dialogues fully rewritten with 4-part structure:
 *                    last words / collector monologue / "..." / narrator closing):
 *   openingDialogue               — 4 lines; Eirika/Tana react to petrified gate guards
 *   weakGorgonOpeningDialogue     — 4 lines; inner-hall cutscene before turn 1
 *   mayaCalloutDialogue           — 2 lines; fires on turn 2 start
 *   fleeingNPCDialogue            — 2 lines; fires on turn 3 start (portrait: npc_west for '???' speaker)
 *   gateHoldDialogue              — 4 lines; Vanessa/Syrene decide to hold the gate
 *   handincomingDialogue          — 6 lines; The Hand first appears
 *   breachGuardDialogue           — 3 lines; The Hand petrifies breach guards (no "..." — simultaneous)
 *   vanessaHandPetrifiedDialogue  — 5 lines; Vanessa captured by The Hand (incl. "..." line)
 *   syreneHandPetrifiedDialogue   — 5 lines; Syrene captured by The Hand (incl. "..." line)
 *   tanaHandPetrifiedDialogue     — 4 lines; Tana captured by The Hand (incl. "..." line)
 *   mayaPetrifiedDialogue         — 4 lines; Maya petrified (timer fail / enemy) (incl. "..." line)
 *   amberShardFoundDialogue       — 2 lines; Amber Shard pick-up
 *
 * FIX 7: NPC-specific petrification dialogues (timer onFail):
 *   fleeingWestPetrifiedDialogue  — 4 lines; NW girl (npc_west portrait, panicked/younger)
 *   fleeingEastPetrifiedDialogue  — 4 lines; NE girl (npc_east portrait, resigned/exhausted)
 *   (mayaPetrifiedDialogue already had a specific dialogue and is unchanged)
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
 * CHANGE Q: New closing dialogue variants for specific Vanessa/Syrene loss states:
 *   closingDialogue_vanessaLost   — Vanessa petrified, Syrene survived; Syrene speaks first
 *   closingDialogue_syreneLost    — Syrene petrified, Vanessa survived; Eirika/Tana speak
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
  { speaker: '???', text: "It got Mira — right in front of me — she just stopped moving and I couldn't—", portrait: 'npc_west' },
  { speaker: '???', text: "Run! Don't let it look at you!", portrait: 'npc_west' },
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
  { speaker: 'Vanessa',  text: "Syrene — don't look. Just don't look at it.", portrait: 'vanessa' },
  { speaker: 'The Hand', text: "Shoulders squared, lance vertical, gaze fixed at exactly the angle of someone still standing their post. She held the form even at the end — that kind of discipline is written into the body and doesn't leave. But the head is turned slightly, still watching for her partner. She was protecting someone even in the final instant. She'll stand in the eastern corridor, where every visitor who passes will feel watched.", portrait: 'hand' },
  { speaker: 'Vanessa',  text: "...", portrait: 'vanessa' },
  { speaker: 'Narrator', text: "Vanessa has been petrified.", portrait: '' },
];

export const syreneHandPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Syrene',   text: "Vanessa... I held the line as long as I could. I hope it was enough.", portrait: 'syrene' },
  { speaker: 'The Hand', text: "A veteran who outlasted every expectation. That grip on the lance — she could have dropped it, freed her hands to run, and chose not to. The head is bowed slightly, as if still bearing something invisible. I'll stand her beside Vanessa. A matched pair carries different weight than two singles — visitors understand, without being told, that these two belong together.", portrait: 'hand' },
  { speaker: 'Syrene',   text: "...", portrait: 'syrene' },
  { speaker: 'Narrator', text: "Syrene has been petrified.", portrait: '' },
];

export const tanaHandPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Tana',     text: "Eirika — run, run now, don't stop for me—!", portrait: 'tana' },
  { speaker: 'The Hand', text: "Wings at full spread mid-flight, lance angled forward, and the eyes fixed not on the threat but on the girl she was calling to. Concern rather than fear — I have taken dozens of pieces this season and I have not seen concern once. The Queen herself has been asking for something extraordinary. This is it. She'll be displayed where the light falls on those wings from above.", portrait: 'hand' },
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
  { speaker: 'Maya',     text: "I see... There was never going to be enough time, was there.", portrait: 'maya' },
  { speaker: 'Enemy',    text: "The hands are the finest detail — pressed together, fingers lightly interlaced, as though she had simply accepted what was coming. Most subjects struggle. Acceptance is rare. I'll place her in the garden alcove, half-hidden by the hedgerow, where someone walking alone might come upon her and feel, for a moment, that they've stumbled on a secret.", portrait: 'enemy' },
  { speaker: 'Maya',     text: "...", portrait: 'maya' },
  { speaker: 'Narrator', text: "Maya has been petrified and collected.", portrait: '' },
];

// ---------------------------------------------------------------------------
// FIX 7: NPC-specific petrification dialogues (timer onFail)
// ---------------------------------------------------------------------------

export const fleeingWestPetrifiedDialogue: DialogueLine[] = [
  { speaker: '???',      text: "No — no no no — my legs won't — please, I don't want to — PLEASE—!", portrait: 'npc_west' },
  { speaker: 'Enemy',    text: "One knee still bent from the stride, arms pitched forward, hair caught streaming behind her — the posture of arrested momentum. Still poses are easy to come by. A figure caught mid-flight, weight already committed to the next step? Considerably rarer. I'll set her in the courtyard where visitors must walk around her to reach the fountain.", portrait: 'enemy' },
  { speaker: '???',      text: "...", portrait: 'npc_west' },
  { speaker: 'Narrator', text: "The fleeing girl has been petrified.", portrait: '' },
];

export const fleeingEastPetrifiedDialogue: DialogueLine[] = [
  { speaker: '???',      text: "...I knew. I've been in it too long. I could feel it working up from my feet.", portrait: 'npc_east' },
  { speaker: 'Enemy',    text: "Arms extended, reaching for something she could almost touch — the eastern gate was perhaps six steps away, and the angle of her gaze still points toward it. You can see where she was going. I find that detail quietly devastating. She'll stand in a hallway entrance, so she is always almost arriving.", portrait: 'enemy' },
  { speaker: '???',      text: "...", portrait: 'npc_east' },
  { speaker: 'Narrator', text: "The fleeing girl has been petrified.", portrait: '' },
];

// ---------------------------------------------------------------------------
// Closing: escape reached — four variants based on who survived (CHANGE P)
// ---------------------------------------------------------------------------

/** All named units survived (unlikely but possible). */
export const closingDialogue_allSurvived: DialogueLine[] = [
  { speaker: 'Tana',   text: "We made it. Everyone.", portrait: 'tana' },
  { speaker: 'Eirika', text: "Barely. Tana... we can't face that again without something to fight back with.", portrait: 'eirika' },
  { speaker: 'Tana',   text: "Then we find a way. We have to.", portrait: 'tana' },
  { speaker: 'Eirika', text: "We will. But next time — I fight back. I refuse to run from this twice.", portrait: 'eirika' },
];

/** Tana survived, some others lost (default). */
export const closingDialogue_someLost: DialogueLine[] = [
  { speaker: 'Tana',   text: "We made it out. Eirika... we made it.", portrait: 'tana' },
  { speaker: 'Eirika', text: "We lost people in there. I heard them. I kept running.", portrait: 'eirika' },
  { speaker: 'Tana',   text: "...", portrait: 'tana' },
  { speaker: 'Eirika', text: "I need their names. Every one of them. Then I'm going back.", portrait: 'eirika' },
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

/**
 * CHANGE Q: Vanessa was petrified, Syrene survived.
 * Syrene speaks first — she held on but couldn't save Vanessa.
 */
export const closingDialogue_vanessaLost: DialogueLine[] = [
  { speaker: 'Syrene',   text: "She told me not to look. So I held the line and I didn't look. She's still in there.", portrait: 'syrene' },
  { speaker: 'Eirika',   text: "Syrene...", portrait: 'eirika' },
  { speaker: 'Syrene',   text: "I'm fine. We're out. That's what she wanted.", portrait: 'syrene' },
  { speaker: 'Eirika',   text: "We'll come back for her. That's not a promise I'm making lightly.", portrait: 'eirika' },
  { speaker: 'Narrator', text: "Vanessa remains behind. Syrene does not speak again for a long time.", portrait: '' },
];

/**
 * CHANGE Q: Syrene was petrified, Vanessa survived.
 * Eirika acknowledges the cost; Tana (if present) or narrator closes.
 */
export const closingDialogue_syreneLost: DialogueLine[] = [
  { speaker: 'Eirika',   text: "Syrene was the one who held that gate. She bought us every second we had.", portrait: 'eirika' },
  { speaker: 'Tana',     text: "She knew what she was doing. She knew.", portrait: 'tana' },
  { speaker: 'Eirika',   text: "That doesn't make it easier. A commander who gives everything — we owe her more than escape.", portrait: 'eirika' },
  { speaker: 'Narrator', text: "Syrene remains behind, stone at the gate she refused to abandon.", portrait: '' },
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
  { speaker: 'Eirika',   text: "How did it spread so fast — I had my guard up, I was still fighting—", portrait: 'eirika' },
  { speaker: 'Enemy',    text: "The Rapier still half-raised in a guard stance, hair fanned out from the motion of the strike she never completed, and the expression — not fear, but disbelief. The bearing of someone who fully expected to fight back. The royal crest on her dress will be a conversation piece for years. She belongs at the center of a great reception hall, where every visitor sees her first.", portrait: 'enemy' },
  { speaker: 'Eirika',   text: "...", portrait: 'eirika' },
  { speaker: 'Narrator', text: "Eirika has been petrified. The retreat has failed.", portrait: '' },
];

export const tanaCombatPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Tana',     text: "Eirika — I'm sorry — just run, don't stop for me—!", portrait: 'tana' },
  { speaker: 'Enemy',    text: "Wings caught mid-downstroke, lance angled forward — and she was looking back over her shoulder, not at the threat but at the girl she was calling to. Concern rather than fear, even at the very last moment. A pose that implies connection is extraordinarily difficult to acquire. I'll suspend her from the vaulted ceiling of the long hall, where the light from the high windows catches the wings at different angles through the day.", portrait: 'enemy' },
  { speaker: 'Tana',     text: "...", portrait: 'tana' },
  { speaker: 'Narrator', text: "Tana has been petrified.", portrait: '' },
];

export const vanessaCombatPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Vanessa',  text: "Someone — the gate still needs to be held—!", portrait: 'vanessa' },
  { speaker: 'Enemy',    text: "At attention even in stone — shoulders squared, lance vertical, gaze fixed forward as though she is still standing watch. One hand is slightly extended, as if she had begun to reach for something and thought better of it. I find that small detail compelling. She'll stand in the eastern corridor where every guest who passes must walk beneath her eye.", portrait: 'enemy' },
  { speaker: 'Vanessa',  text: "...", portrait: 'vanessa' },
  { speaker: 'Narrator', text: "Vanessa has been petrified.", portrait: '' },
];

export const syreneCombatPetrifiedDialogue: DialogueLine[] = [
  { speaker: 'Syrene',   text: "Vanessa... I held the line as long as I could. I hope it was enough.", portrait: 'syrene' },
  { speaker: 'Enemy',    text: "The grip on the lance shows experience — not white-knuckled panic, the tight hold of someone who has trained for years and simply applied that training to the last possible moment. The slight upturn of the chin suggests she had already made her peace with this outcome. She'll stand at the staircase landing, where visitors must look up to reach her.", portrait: 'enemy' },
  { speaker: 'Syrene',   text: "...", portrait: 'syrene' },
  { speaker: 'Narrator', text: "Syrene has been petrified.", portrait: '' },
];
