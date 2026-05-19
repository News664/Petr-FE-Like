/*
 * src/data/chapterData.ts
 * Canonical chapter-start states for Inevitable Eternity.
 *
 * ChapterStartData defines the game state assumed when launching a chapter
 * directly from the chapter selector (not continuing from a prior save).
 * Each entry represents an "average-case" playthrough — good play, no min/maxing.
 *
 * UnitStartState:
 *   unitId   — matches the factory id used in ChapterScene / UNIT_PLACEMENTS
 *   level    — unit level at chapter start
 *   exp      — EXP within that level (0–99)
 *   state    — 'active' | 'petrified_safe' | 'petrified_captured' | 'absent'
 *   items    — optional override for starting inventory (string ids)
 *
 * ChapterStartData:
 *   chapterId      — numeric chapter index (1-based)
 *   title          — display name for the chapter selector card
 *   description    — one-line flavour text shown on the card
 *   sceneKey       — Phaser scene key to start ('ChapterScene', 'Chapter2Scene', …)
 *   units          — canonical unit states (only those present / relevant)
 *   flags          — boolean flags set by prior chapter outcomes
 *   unlocked       — whether this chapter is selectable by default (debug overrides)
 *
 * CHAPTER_DATA is an ordered array indexed by chapterId − 1 (i.e. CHAPTER_DATA[0] = Ch1).
 */

export type UnitCombatState = 'active' | 'petrified_safe' | 'petrified_captured' | 'absent';

export interface UnitStartState {
  unitId: string;
  level:  number;
  exp:    number;
  state:  UnitCombatState;
  items?: string[];
}

export interface ChapterStartData {
  chapterId:   number;
  title:       string;
  description: string;
  sceneKey:    string;
  units:       UnitStartState[];
  flags:       Record<string, boolean>;
  unlocked:    boolean;
}

// ---------------------------------------------------------------------------
// Chapter 1 — "The Stone Tide"
// ---------------------------------------------------------------------------
// All units at starting stats. No prior history.

const CHAPTER_1: ChapterStartData = {
  chapterId:   1,
  title:       'Ch.1 — The Stone Tide',
  description: 'Eirika and Tana escape a besieged stronghold as The Hand closes in.',
  sceneKey:    'ChapterScene',
  units: [
    { unitId: 'eirika',  level: 1, exp:  0, state: 'active' },
    { unitId: 'tana',    level: 1, exp:  0, state: 'active' },
    { unitId: 'vanessa', level: 1, exp:  0, state: 'active' },
    { unitId: 'syrene',  level: 1, exp:  0, state: 'active' },
  ],
  flags:    {},
  unlocked: true,
};

// ---------------------------------------------------------------------------
// Chapter 2 — "The Amber Wake"
// ---------------------------------------------------------------------------
// Canonical state after Ch1 (average-case playthrough):
//   Eirika and Tana survived; Syrene was captured at the gate (canonical Ch1 loss).
//   Vanessa escaped but fought little.
//   Maya was rescued (achievable in 3 turns).
//   Fleeing west girl escaped. Fleeing east girl failed (1-turn timer, hardest rescue).
//
// EXP note: ~26 EXP per kill at L1 vs L3 enemy. 3–4 kills → ~80–104 EXP → level 2.
// Eirika is the expected combat unit; Tana mixed damage; Vanessa minimal engagement.

const CHAPTER_2: ChapterStartData = {
  chapterId:   2,
  title:       'Ch.2 — The Amber Wake',
  description: 'Pushed further back. A Gorgon squad deploys ahead of the retreat.',
  sceneKey:    'Chapter2Scene',
  units: [
    { unitId: 'eirika',  level: 2, exp: 20, state: 'active' },
    { unitId: 'tana',    level: 1, exp: 70, state: 'active' },
    { unitId: 'vanessa', level: 1, exp: 30, state: 'active' },
    { unitId: 'syrene',  level: 1, exp:  0, state: 'petrified_captured' },
  ],
  flags: {
    maya_rescued:          true,
    fleeing_west_escaped:  true,
    fleeing_east_failed:   true,
    syrene_lost_ch1:       true,
  },
  unlocked: true,
};

// ---------------------------------------------------------------------------
// Locked placeholder chapters (content not yet implemented)
// ---------------------------------------------------------------------------

const makeLockedChapter = (
  id: number,
  title: string,
  desc: string,
): ChapterStartData => ({
  chapterId:   id,
  title,
  description: desc,
  sceneKey:    `Chapter${id}Scene`,
  units:       [],
  flags:       {},
  unlocked:    false,
});

// ---------------------------------------------------------------------------
// Master array — CHAPTER_DATA[chapterId − 1]
// ---------------------------------------------------------------------------

export const CHAPTER_DATA: ChapterStartData[] = [
  CHAPTER_1,
  CHAPTER_2,
  makeLockedChapter(3,  'Ch.3 — West by Firelight', "Lyn's group flees through Elibe villages."),
  makeLockedChapter(4,  'Ch.4 — The Cost of Flight', 'Aerial Gorgons deploy against both retreating groups.'),
  makeLockedChapter(5,  'Ch.5 — Last Out',           'Final stretch before the border. Rearguard action.'),
  makeLockedChapter(6,  'Ch.6 — Into the Veil',      "Lilina's group arrives. Morrha's trap begins closing."),
  makeLockedChapter(7,  'Ch.7 — The Mass Petrification', 'Three-front encirclement. Lilina barely escapes.'),
  makeLockedChapter(8,  'Ch.8 — The Rout',           'Survivors scatter. The enemy picks them off.'),
  makeLockedChapter(9,  'Ch.9 — Collapse',           "Lilina's stronghold falls. Cecilia and Guinivere captured."),
  makeLockedChapter(10, 'Ch.10 — The Meeting That Wasn\'t', 'Eirika and Lyn converge. Tana\'s return is undone.'),
  makeLockedChapter(11, 'Ch.11 — Debris',            'Survivors regroup. Slow advance toward Morrha.'),
  makeLockedChapter(12, 'Ch.12 — The Prophet Was Right', "Sophia petrified exactly as she described."),
  makeLockedChapter(13, 'Ch.13 — The Stronghold Below', "Raid on Morrha's base. Morrha's irreversible capture."),
  makeLockedChapter(14, 'Ch.14 — Through the Galleries', 'Enemy-placed statues litter the map. Pedestal mechanics active.'),
  makeLockedChapter(15, 'Ch.15 — The Commander\'s Hall', "Advance toward the Queen's outer fortress."),
  makeLockedChapter(16, 'Ch.16 — The Long Hall',     'Final approach. Prior captures used as obstacles.'),
  makeLockedChapter(17, 'Ch.17 — The Trophy Room',   "Queen's inner sanctum. Ninian and Fae targeted."),
  makeLockedChapter(18, 'Ch.18 — Inevitable Eternity', 'The final confrontation.'),
];
