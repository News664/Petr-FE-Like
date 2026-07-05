# Inevitable Eternity — Gameplay Redesign (No-Growth Puzzle Model)

> **What this file does:** Re-specifies the core game procedure after the decision to
> drop character growth entirely. Each chapter is a hand-authored tactical puzzle with
> fixed character kits; the difficulty curve comes from the board and the shrinking
> roster, not from leveling. This file governs *procedure and systems*. Narrative and
> per-chapter capture schedules remain in `chapter-overview.md`; defeat prose in
> `defeat-scenes-act*.md`.
>
> **Key definitions used here:**
> - **Kit** — a character's fixed, unchanging stat block + one signature action (verb).
> - **Integrity** — the single unit resource that replaces HP *and* STO-RES (see §3).
> - **Telegraph** — an enemy's declared next-turn action, shown to the player in advance.
> - **Pressure Tier** — a per-act global scalar that raises fixed enemy/aura numbers
>   without giving any character growth.
>
> **Where this conflicts with `game-design.md` or `chapter-overview.md`:** flag and
> discuss before implementing. This document supersedes the RPG-progression assumptions
> in those files (EXP, levels, weapon ranks, gold) but not their narrative or schedule.

---

## 1. Design Pillars

1. **No growth.** No EXP, no levels, no stat gains, no weapon ranks, no gold. A character
   is the same on the last turn she is playable as on the first.
2. **Characters are tools, not investments.** Each is defined by *one verb* nobody else
   has. Losing her is losing a capability from the puzzle, permanently.
3. **Perfect information.** No hit/avoid rolls, no crits, no hidden damage. Enemies
   telegraph their next action. Every chapter is solvable by reasoning, not luck.
4. **The board is the difficulty.** The curve rises through denser aura-terrain (your own
   losses), tighter turn/fog limits, and stronger *fixed* enemy numbers — never through
   the player's units getting weaker or the enemy units getting statistically opaque.
5. **Loss is the difficulty *and* the content.** The roster shrinks as the game
   progresses. Fewer tools against harder boards is the intended curve. The mechanical
   difficulty spike and the emotional payload are the same event.
6. **You cannot win by killing.** No map is cleared by routing the enemy. Objectives are
   escape, endure, or protect. The enemy is a logistics operation, not an army.

---

## 2. What Is Removed, Kept, and Added

### Removed
- Experience points and levels.
- Per-character stat growth / growth rates.
- Weapon ranks and the weapon triangle.
- Gold, shops, item economy.
- Hit / avoid / critical RNG. All combat is deterministic.
- Separate HP and STO-RES tracks (merged — see §3).
- "Rout the enemy" and most "Boss kill" objectives (see §7).
- Reinforcement-wave attrition as a primary difficulty source.

### Kept (retuned)
- Grid movement, MOV stat, terrain costs.
- Player Phase / Enemy Phase turn structure.
- The aura system as **terrain** (`chapter-overview.md` §Aura System), now the central
  map-design element rather than a debuff appendix.
- Petrifying Fog as an advancing board hazard.
- Collectors and the PETRIFIED_SAFE rescue window.
- The Queen's Designation as a unique late-game threat.
- The full capture schedule and flag system in `chapter-overview.md`.

### Added
- **Single Integrity resource** replacing HP + STO-RES (§3).
- **Enemy telegraphs** — perfect-information declarations (§5).
- **Fixed character kits** — one signature verb each (§6).
- **Pressure Tiers** — the no-growth difficulty scalar (§8).

---

## 3. The Single Resource: Integrity

HP and STO-RES collapse into one track, **Integrity**. It is the only per-unit number
that changes during a chapter.

- Every source of harm reduces Integrity: GAZE, Stone Warden contact, Dark Witch magic,
  aura decay, fog. There is no separate "HP damage vs stone damage" bookkeeping.
- **Integrity reaches 0 → the unit is petrified**, in place, in her current posture.
- Integrity is **fixed per character** (her kit value) and **does not carry between
  chapters** — it resets to full at the start of each chapter. There is no healing
  economy to manage across the campaign, only within a single puzzle.
- Because there is no growth, Integrity values are *puzzle-balance knobs*, not
  progression. A "fragile" character (low Integrity) is a piece you must keep out of
  aura range; a "sturdy" one is a piece you can spend as a blocker.

This removes an entire layer of bookkeeping, makes the capture math legible at a glance,
and means the player is always reasoning about one number per unit against a telegraphed
threat.

### Integrity bands (fixed, illustrative)
| Band | Integrity | Typical kit role |
|------|-----------|------------------|
| Very Low | 4–6 | Ranged/support who must never be exposed (mages, healers, dancers) |
| Low | 7–9 | Fliers, thieves, light fighters |
| Medium | 10–12 | Line fighters |
| High | 13–16 | Armors / blockers (the pieces you deliberately place in danger) |

---

## 4. The Chapter Procedure (Turn Loop)

Each chapter is a discrete, self-contained puzzle. Nothing mechanical carries forward
except *which characters still exist* (roster) and *which are now aura-terrain* (flags).

1. **Briefing.** Objective, turn/fog limit, deploy cap, and the board are shown. All
   starting aura rings, fog line, statue-terrain, and enemy telegraphs are visible before
   the first move. No fog-of-war on information — only the literal Petrifying Fog.
2. **Deploy.** Player places up to the chapter's **Deploy Cap** (§9) from the available
   roster onto marked start tiles.
3. **Player Phase.** Each deployed unit may **move** (up to MOV) and take **one action**
   (attack, signature verb, wait). Order is free.
4. **Enemy Phase.** Telegraphed actions resolve in a fixed, shown order. Integrity is
   reduced; any unit hitting 0 is petrified in place. Collectors advance along their
   telegraphed paths.
5. **Retelegraph.** Surviving enemies declare next turn's actions. New aura rings appear
   for any newly captured ally. The board updates visibly.
6. **Resolve captures.** Petrified units enter PETRIFIED_SAFE (Act 3+) or
   PETRIFIED_CAPTURED (Act 1–2, or if a Collector reached them). Captured units become
   aura-terrain immediately.
7. Repeat until the **objective** is met (success) or the **lord is captured / all units
   captured** (defeat → the chapter's defeat scene).

**Scripted captures** fire on their authored turn regardless of play (see
`chapter-overview.md` type **S**). In the puzzle framing, an S-capture is a *fixed board
event*: the puzzle is never "prevent it," it is "given that she falls on turn 3 at that
position, who else do you save and where does everyone stand when it happens." Optional
(**O**) captures are the solvable part of the puzzle.

---

## 5. Perfect Information & Enemy Telegraphs

This is the change that makes chapters *puzzles* rather than *battles*.

- Every enemy shows its **next-turn action** on the board during Player Phase: which tile
  a Gorgon will GAZE, which unit a Gaze Hunter will target, where a Collector will step,
  how far the fog advances.
- All damage is **fixed and shown**. A Gorgon's GAZE does a known number to Integrity.
  There is no roll.
- The player plans the whole Player Phase against a known Enemy Phase. Success is a
  *solution*, not a *gamble*.
- **Enemy priority rules are deterministic and documented** (e.g. Gaze Hunters always
  target the lowest-Integrity unit in range; Collectors always path toward the nearest
  PETRIFIED_SAFE ally). The player can exploit these rules — bait a Hunter, body-block a
  Collector's only path — which *is* the gameplay.

Consequence: difficulty can be authored precisely. A hard chapter is a hard puzzle, not a
run of bad rolls.

---

## 6. Character Kits (Fixed Verbs)

With no growth, a character's entire identity is her **signature verb** plus her fixed
MOV / Integrity / range. Kits are designed so each is a distinct *tool* in the puzzle. The
verb is what makes losing her hurt mechanically — you lose the only piece that could do
that thing.

Illustrative kit framework (final numbers set at implementation; each verb is unique):

| Archetype | Example | MOV | Integ. | Signature verb (the reason she exists) |
|-----------|---------|-----|--------|----------------------------------------|
| **Lord (protect-piece)** | Eirika | 5 | Med | *Rally*: reposition one adjacent ally 1 tile after her own move. Her capture = game over — she is the piece the whole puzzle protects. |
| **Runner** | Lyn | 7 | Low | *Pull*: move through an ally and drag her out of a hazard tile to safety. |
| **Restorer** | Natasha | 5 | V.Low | *Steady*: restore Integrity to one adjacent ally (the only in-chapter recovery). |
| **Blocker** | Wendy | 4 | High | *Wall*: becomes impassable terrain; body-blocks a Collector or enemy path. Spendable on purpose. |
| **Flier/Ferry** | Vanessa | 7(fly) | Low | *Ferry*: pick up and carry an adjacent ally, ignoring terrain and aura tiles in transit. |
| **Breaker** | Nino / Lilina | 5 | V.Low | *Shatter*: destroy a Petrified Construct or delay a Gorgon's telegraph by one turn. |
| **Interceptor** | Rebecca | 5 | Low | *Knock*: at range, push a Gaze Hunter back and cancel its telegraph. |
| **Tempo (dancer)** | Tethys / Larum / Ninian | 6 | V.Low | *Refresh*: grant one already-acted ally a second full action. The key tempo tool; its loss collapses turn economy. |
| **Disruptor (thief)** | Cath | 6 | Low | *Jam*: disable one Collector for a turn / open a locked route. |
| **Line fighter** | Amelia / Fir / Marisa | 5 | Med | *Guard-strike*: trade Integrity to stagger an adjacent Stone Warden (skip its next telegraph). |

Design rules for kits:
- **No two shared verbs.** If two characters would do the same thing, one gets a twist
  (range, cost, side-effect) or the redundancy is intentional and both can be benched.
- **Verbs interact.** Ferry + Restorer, Refresh + any high-value verb, Wall + Jam on a
  Collector lane. Puzzle solutions come from *combining* verbs, so losing one verb closes
  off classes of solutions in later chapters. This is how attrition raises difficulty.
- **Kits never change.** A restored character (Sunstone Shard) returns at exactly her kit.

---

## 7. Objectives (No "Win by Killing")

| Objective | Verb | Used for |
|-----------|------|----------|
| **Escape** | Get the lord (and as many others as chosen) to exit tiles before the turn/fog limit | Act 1–2 retreats, Act 4 corridors |
| **Endure** | Keep the lord uncaptured for N turns | Sieges, Morrha's self-petrification (Ch13) |
| **Protect** | Prevent Collectors from reaching downed allies for N turns / until extraction | Act 3 rescue chapters — the triage puzzle |
| **Reach** | Move a specific unit to a specific tile (a person, a Sunstone Shard, Myrrh) | Rescue side-routes, Ch18 Myrrh path |

There is no "defeat all enemies." Enemies can be destroyed *as a means* (killing a
Collector to save an ally, shattering a Construct blocking the exit), never *as the win
condition*. The Queen is never a killable boss; Ch18 is **Endure/Reach**, not a duel.

---

## 8. Difficulty Without Growth: Pressure Tiers

Because characters never get stronger, the game cannot lean on the enemy getting
*numerically* harder to match player power creep — there is no player power creep. Instead
difficulty is authored on four fixed axes, indexed by a per-act **Pressure Tier**:

1. **Aura density** — how much of the board is hazard-terrain made of your own losses.
   This rises *automatically* as the campaign proceeds (more captured allies exist to
   deploy as installations). The single most important curve.
2. **Fixed enemy output** — GAZE/contact Integrity damage per hit. Set per Pressure Tier,
   the same for every enemy of that type in that act. No per-unit variance.
3. **Time pressure** — turn limits and fog speed tighten in later acts.
4. **Roster size** — the *player's* toolset shrinks (§9). Fewer verbs against denser
   boards is the intended late-game state.

| Act | Pressure Tier | Typical GAZE dmg | Aura sources/map | Board pressure |
|-----|---------------|------------------|------------------|----------------|
| 1 | I | low | 1–2 | Learn the verbs; generous limits |
| 2 | II | low–mid | 2–3 + fog | Fog introduced; mass-loss authored |
| 3 | III | mid | 3–4 | Rescue triage becomes central |
| 4 | IV | high | 4–5 + Queen's Designation | Small roster, saturated boards |

"Progressively raised status" is expressed here: *the fixed numbers ratchet up per act*,
identically for all units of a type, while no individual character's kit ever changes. The
world gets harder; the pieces stay the same; you have fewer of them.

---

## 9. Roster & Deploy Caps

Roster (who exists) is campaign-persistent and only ever shrinks (barring Sunstone
restoration). **Deploy Cap** (how many you field) is authored per chapter to keep every
map playable and prevent bench bloat. Reproduced from the gameplay review, now canonical:

| Chapter | Deploy Cap | Notes |
|---------|-----------|-------|
| Ch1 | 4 | All deploy |
| Ch2 | all (3–4) | Tight by design |
| Side Ch2A | 6 | 1 benched; 2 scripted losses |
| Ch3 | 5 | All deploy |
| Ch4 | 6 | Split map 3 + 3 |
| Ch5 | 6 | First combined map |
| Ch6 | 7 | **Stagger joins** — open with Lilina + 5, rest join mid-chapter |
| Ch7 | 7 | Mass-loss chapter |
| Ch8 | all | Fragmented clusters |
| Ch9 | all | 3 scripted losses |
| Ch10–11 | 8 | **Split two fronts** (Eirika lane / Lyn lane) so nobody benches |
| Ch12–13 | 7 | Shrinking |
| Ch14 | 6 | |
| Ch15–16 | all | |
| Ch17–18 | all (4–6) | Endgame; everyone fields |

Rules:
- **Never field fewer than 4.** If the roster drops below 4 before Act 4, an authored
  join or a forced Sunstone restoration backfills to keep boards playable.
- **Bench ≤ 2** on any chapter with a cap. If a roster would bench more, split the map
  into fronts (Ch10–11) or stagger joins (Ch6) instead of raising the cap.
- Benched characters take no harm and are not at risk that chapter — the bench is safe.
  Risk only happens on the board.

---

## 10. Restoration (Sunstone Shards)

Unchanged in intent, clarified for the no-growth model:
- A Sunstone Shard restores one PETRIFIED_SAFE character to the roster at **her exact
  kit** — restoration returns a *tool*, not an upgrade.
- Shards are scarce and the choice is permanent, so restoration is a *puzzle-capability*
  decision ("I need a Ferry back for the Act 4 corridors"), not a power decision.
- PETRIFIED_CAPTURED characters cannot be restored. The Act 1–2 losses are final; the
  Act 3+ rescue window is the only path to keeping a character.

---

## 11. Feasibility Note (Browser Game)

Everything here is *simpler* to build than the RPG model it replaces:
- No RNG engine, no growth tables, no item/shop/gold systems, no weapon-rank logic.
- Deterministic combat = trivially testable puzzles with known-good solutions.
- Perfect-information telegraphs are a rendering task (overlay icons on tiles), not an AI
  task — enemy "AI" is a documented priority rule, fully deterministic.
- One Integrity number per unit instead of two tracks.
- The three-stage petrification sprite, persistent statue-terrain, and aura rings from the
  graphics discussion carry over unchanged and are the main art investment.

The net effect: a smaller, more authored, more testable game whose systems all point at
the same thing — you are managing an inevitable, legible loss, one solvable board at a
time.

---

## 12. Open Questions for Discussion

1. **Integrity reset per chapter** (proposed) vs. carrying wounded state between chapters.
   Reset is simpler and keeps each chapter a clean puzzle; carrying adds a campaign layer
   but reintroduces bookkeeping. *Recommend reset.*
2. **Any RNG at all?** Proposed: none. If some variance is wanted for replay texture, it
   should be in *enemy spawn/telegraph selection between attempts*, never in combat
   resolution.
3. **Does the lord have a verb, or is she purely the protect-piece?** Proposed: a light
   verb (Rally) so she is not dead weight, but her defining role is that her capture ends
   the run.
4. **Construct/enemy destruction permanence** within a chapter — do shattered Constructs
   stay cleared on a retry, or reset? (Puzzle retries should reset fully.)
