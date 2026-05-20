# Inevitable Eternity — Game Design Reference

> Working title. All-female cast, GBA Fire Emblem mechanics, petrification as the central loss condition.
> This document is the canonical reference for story structure, character arcs, and petrification design.

---

## Tone Guide

- **Player side:** despair, helplessness, grief. Characters know they are outmatched. Retreat is the only option and retreat keeps failing.
- **Enemy side:** collector's detachment. Petrified characters are *acquisitions* — objects to be appraised, arranged, and displayed. The enemy is never cruel in a rage sense; they are cruel in the way a collector is cruel: clinical, appreciative, and completely indifferent to the person inside the stone.
- **Key rule:** the enemy never treats a petrified character as a person. They comment on pose, expression, body, placement. "She" becomes "the piece" or "this one" or "it."

---

## Petrification Mechanics

### STO-RES (Stone Resistance) Tiers

| Tier | Characters | Rationale |
|------|-----------|-----------|
| Very High | Ninian, Myrrh, Fae | Dragon/divine heritage — innate resistance |
| High | L'Arachel, Natasha, Elen | Light/divine magic affinity |
| Medium-High | Sophia, Guinivere | Dark magic affinity — partial resonance with the curse |
| Medium | Eirika, Lyn, Tana, Florina, Fiora, Fir, Marisa | Physical lords, fliers, swordswomen |
| Low | Serra, Priscilla, Clarine, Neimi, Rebecca, Dorothy, Sue, Larum | Support, archer, nomad types |
| Very Low | Lute, Lilina, Nino, Vanessa, Amelia | Anima mages and recruits |
| Unique (Armor) | Wendy, Amelia | High body resistance but once stone starts, rigid frame accelerates spread |

STO-RES stat range: Very High ≈ 18–20, High ≈ 14–16, Medium ≈ 10–12, Low ≈ 6–8, Very Low ≈ 4–6.

### Petrification Triggers

- HP reaches 0 → PETRIFIED_SAFE (player-side gallery, no aura)
- STO-RES reaches 0 → PETRIFIED_SAFE (player-side)
- PETRIFIED_SAFE + adjacent enemy at start of enemy phase → PETRIFIED_CAPTURED (enemy gallery, aura active)

### Two Gallery States

| State | Aura | Rescue |
|-------|------|--------|
| PETRIFIED_SAFE | None | Can be restored with Sunstone Shard (late game only) |
| PETRIFIED_CAPTURED | Active (debuffs all nearby player units) | Requires dedicated rescue chapter or mid-map recovery |

### Permanence Note

Serra's dialogue in Ch2/3 establishes that no current magic can reverse petrification. Sunstone Shards are hinted at but not accessible until late Act 3. All petrification before that point should feel permanent.

---

## Aura System

Captured statues emit passive stone auras affecting all player units within range.

### Tier S — Lords and closest named companions (radius 7)
- All player units in range: −6 to all combat stats, −20 hit/avoid, STO-RES decays 4/turn
- Enemies within a 3-tile sub-radius act twice per enemy phase
- Each lord has a unique additional effect (see Lord Defeat Entries)

### Tier A — Named recurring characters (radius 6)
- All player units in range: −4 to all combat stats, −15 hit/avoid, STO-RES decays 3/turn

### Tier B — Named characters, secondary role (radius 5)
- All player units in range: −2 to all combat stats, −10 hit/avoid, STO-RES decays 2/turn

### Stacking
Multiple auras stack linearly. Two overlapping Tier B sources = −4 stats, −20 hit/avoid, STO-RES decay 4/turn. Three Tier B sources = −6 stats, −30 hit/avoid, decay 6/turn. Late-game maps with 4–5 sources make navigation the primary challenge — a Medium unit (STO-RES 10) in two stacked Tier B auras lasts under 3 turns.

### Morrha (Special)
Not morale-based — magically active. Forces STO-RES decay of 3/turn in a 3-tile chokepoint radius. Does not stack with tier interactions; overrides them. Permanent, irreversible.

---

## Equipment Damage — Lore Note

The Gorgon Gaze petrifies **living tissue only**. It is surgical about the body but catastrophically violent to anything non-living in its path. Armor, weapons, staves, and bows shatter or crumble on contact. Clothing scorches or tears at the edges.

**Result:** The body is in *perfect* stone — flawless, every feature, every strand of hair preserved exactly. The gear is destroyed, sometimes completely. What remains is often just the hands in the shape of what they were holding.

Enemy inspection comments focus on: **expression, pose, body, gesture** — the things preserved. Equipment is mentioned only as context ("the hands still curl around nothing," "the grip shape remains without the weapon"). This contrast — ruined gear around a perfect form — is the defining aesthetic of the collection.

---

## Story Overview

**Title:** Inevitable Eternity

**Acts:** 4 main acts + side chapters. Approximately 18 main chapters.

**Three protagonist groups:**
- **Eirika** (FE8, Magvel) — main viewpoint, retreat from Renais
- **Lyn** (FE7, Elibe West) — parallel retreat, converges with Eirika in Act 3
- **Lilina** (FE6, Elibe Central) — caught in a trap, the act 2 disaster

**Sunstone Shard:** Introduced as a concept in Act 3 (scholar NPC explains). One shard per major chapter reward at best. Player must choose who to restore first. Not available before Act 3 — all Act 1 and 2 losses should feel permanent.

---

## Chapter Outline

### Act 1 — Retreat (Ch1–5, Magvel, Eirika's group)

| Ch | Title | Key Events | Petrifications |
|----|-------|-----------|----------------|
| 1 | The Stone Tide | Eirika and Tana escape besieged stronghold. The Hand appears. | Gate Guards (scripted), Vanessa/Syrene/Tana (optional, The Hand) |
| 2 | The Amber Wake | Eirika's group pushed further back; first encounter with Gorgon squad | Natasha (scripted, Ch2 opening) |
| 3 | West by Firelight | Lyn's group (parallel): first major flight through Elibe villages | Serra (scripted), Rebecca (optional) |
| 4 | The Cost of Flight | Both groups' retreats intensify. Enemy deploys aerial Gorgons | Vanessa (Eirika, guaranteed if not Ch1), Nino (Lyn, scripted), Florina (Lyn, optional) |
| 5 | Last Out | Final stretch before groups reach the border. Rearguard action | Amelia (Eirika, scripted), Farina (Lyn, scripted), Priscilla (Lyn, scripted) |

### Side Chapter 2A — "The Price of a Head Start" (Lyn's perspective, between Ch2 and Ch3)
Playable flashback. Shows exactly how Lyn escaped. Priscilla and Farina fall covering her.
Serra fires the "can't cure it" dialogue here.

### Act 2 — Lilina's Disaster (Ch6–9, Elibe Central, Lilina's group)

Morrha's Dark Veil suppresses light and anima magic across all Act 2 maps.

| Ch | Title | Key Events | Petrifications |
|----|-------|-----------|----------------|
| 6 | Into the Veil | Lilina's group arrives; Morrha's trap begins closing | Shanna (scripted) |
| 7 | The Mass Petrification | Three-front encirclement; Lilina barely escapes | Wendy, Clarine (scripted); Larum, Sue, Cath (optional) |
| 8 | The Rout | Survivors of Ch7 scatter; enemy picks them off | Dorothy, Thea (optional); Elen (optional) |
| 9 | Collapse | Final fall of Lilina's stronghold; Cecilia and Guinivere captured as political pieces | Cecilia (scripted), Guinivere (scripted), Tethys (scripted) |

### Side Chapter 7A — "The Foreseen" (Sophia's vision)
Single-map chapter. Sophia shows Lilina her vision of Ch12. Lilina doesn't fully believe her.

### Side Chapter 8A — "The Collection" (Enemy gallery reveal)
Player sends Cath to infiltrate. She is ambushed. Player sees the collected statues from previous chapters — named characters the player already lost, lit and arranged. Designed as an emotional gut punch.

### Act 3 — Convergence & First Rescues (Ch10–13, Elibe)

Three groups converge. Sunstone Shards introduced. Two dedicated rescue missions into Morrha's stronghold.

| Ch | Title | Key Events | Petrifications |
|----|-------|-----------|----------------|
| 10 | The Meeting That Wasn't | Eirika and Lyn converge; Tana's return is immediately undone | Tana (scripted, second capture) |
| 11 | Debris | Survivors regroup; limited advance toward Morrha | Neimi (optional) |
| 12 | The Prophet Was Right | Sophia petrified exactly as she described | Sophia (scripted) |
| 13 | The Stronghold Below | Raid on Morrha's base; Morrha's irreversible petrification | Marisa, Isadora (optional); **Morrha** (irreversible, cutscene) |

### Act 4 — The Push (Ch14–18, Toward the Queen)

Captured statues deployed as map installations. Pedestal mechanic active.

| Ch | Title | Key Events | Petrifications |
|----|-------|-----------|----------------|
| 14 | Through the Galleries | Maps with enemy-placed statues; first pedestal encounters | Fir, Echidna (optional) |
| 15 | The Commander's Hall | Advance toward Queen's outer fortress | Fiora, L'Arachel, Igrene (optional) |
| 16 | The Long Hall | Final approach; enemy uses prior captures as obstacles | Lute, Juno, Karla (optional) |
| 17 | The Trophy Room | Queen's inner sanctum; Ninian and Fae targeted specifically | Louise (optional), Fae (optional), **Ninian** (scripted) |
| 18 | Inevitable Eternity | Final chapter; Myrrh rescue optional; confrontation with the Queen | Myrrh (optional rescue) |

---

## Character Canonical Petrification Schedule

**Type key:** S = scripted (cannot be prevented), O = optional (player-preventable), G = game-over

| # | Character | Game | Chapter | Type | Aura Tier | Aura Effect if Captured |
|---|-----------|------|---------|------|-----------|------------------------|
| 1 | Gate Guards ×2 | FE8 NPC | Ch1 | S | — | Decorative only |
| 2 | Vanessa | FE8 | Ch1/Ch4 | O | B | −1 stats, −10 hit/avoid |
| 3 | Syrene | FE8 | Ch1/Ch4 | O | B | −1 stats, −10 hit/avoid |
| 4 | Tana | FE8 | Ch1/Ch10 | O/S | A | −2 stats, STO decay 1/turn |
| 5 | Natasha | FE8 | Ch2 | S | A | Healer inversion: −1 HP from all healing in range |
| 6 | Serra | FE7 | Ch3 | S | A | Stacks with Natasha: cleric inversion |
| 7 | Rebecca | FE7 | Ch3 | O | B | − |
| 8 | Nino | FE7 | Ch4 | S | A | Enemy mages in range +2 magic |
| 9 | Florina | FE7 | Ch4 | O | A | Flying enemies in range +1 movement |
| 10 | Amelia | FE8 | Ch5 | S | B | Enemies in range +1 all stats |
| 11 | Farina | FE7 | Ch5 | S | B | Aerial echo: flying enemies +1 movement |
| 12 | Priscilla | FE7 | Ch5 | S | B | Cavalry enemies ignore terrain cost |
| 13 | Shanna | FE6 | Ch6 | S | B | − |
| 14 | Wendy | FE6 | Ch7 | S | B | Enemies in range +2 defense |
| 15 | Clarine | FE6 | Ch7 | S | B | Player units lose 1 RES/turn in range |
| 16 | Larum | FE6 | Ch7 | O | B | − |
| 17 | Sue | FE6 | Ch7 | O | B | − |
| 18 | Cath | FE6 | Ch8 side | S | B | Blocks alternate path |
| 19 | Dorothy | FE6 | Ch8 | O | B | Enemy archers +1 range |
| 20 | Thea | FE6 | Ch8 | O | B | All enemies on map +5 avoid |
| 21 | Elen | FE6 | Ch8 | O | B | − |
| 22 | Cecilia | FE6 | Ch9 | S | A | Enemy generals and paladins +1 movement |
| 23 | Guinivere | FE6 | Ch9 | S | A | Enemy bosses +3 all stats |
| 24 | Tethys | FE6 | Ch9 | S | A | − |
| 25 | Neimi | FE8 | Ch11 | O | B | − |
| 26 | Sophia | FE6 | Ch12 | S | A | Player STO-RES decays 1 extra/turn in range |
| 27 | Marisa | FE8 | Ch13 | O | A | Enemy units +10 critical in range |
| 28 | Isadora | FE6 | Ch13 | O | B | − |
| 29 | Fir | FE6 | Ch14 | O | B | Enemy myrmidons +5 speed in range |
| 30 | Echidna | FE6 | Ch14 | O | B | − |
| 31 | Fiora | FE7 | Ch15 | O | A | Flying enemies act twice (once extra) |
| 32 | L'Arachel | FE8 | Ch15 | O | A | Divine weapons −2 damage in range |
| 33 | Igrene | FE6 | Ch15 | O | B | − |
| 34 | Lute | FE8 | Ch16 | O | A | Enemy mages +3 magic in range |
| 35 | Juno | FE6 | Ch16 | O | B | − |
| 36 | Karla | FE6 | Ch16 | O | B | − |
| 37 | Louise | FE7 | Ch17 | O | B | − |
| 38 | Fae | FE6 | Ch17 | O | A | Player dragon units cannot transform in range |
| 39 | Ninian | FE7 | Ch17 | S | S | Enemies in 3-tile range act twice per enemy phase |
| 40 | Myrrh | FE8 | Ch18 | O | A | Divine suppression AoE if unrescued |
| M | **Morrha** | Original | Ch13 | S (irreversible) | Special | STO-RES decay 3/turn, permanent chokepoint |
| — | **Eirika** | FE8 | Any | G | S | Game over |
| — | **Lyn** | FE7 | Any | not G | S | See lord defeat entries |
| — | **Lilina** | FE6 | Any | not G | S | See lord defeat entries |

---

## Lord Defeat Entries

### Eirika — Game Over

Still game over. The retreat has failed.

*"A lord. Not just by birth — by bearing. The hands are in the guard position without the sword, which crumbled on contact. The hands don't know it's gone. That expression — not fear, disbelief. The bearing of someone who expected to fight back and ran out of options before she ran out of will. She goes at the center of the great reception hall. First thing anyone sees."*

**Eirika:** *...*

*"Good."*

---

### Lyn — Not Game Over, but

Effect: Serra (if alive) takes −2 STO-RES/turn for the rest of the game. Florina (if alive) gains +10 critical but −20 avoid — she fights recklessly. Lyn's captured statue emits Tier S aura on whatever map the enemy places it. All subsequent chapters with Lyn's statue on the map have it active permanently.

*She walks around the piece slowly. The Wind Sword crumbled — only the grip remains, held in a guard posture.*

"The sword is gone. Of course. The hands are still in the guard position — she was protecting someone. That's clear from the angle of the body. She put herself between the threat and whoever was behind her."

*She stops in front of the face.*

"That expression isn't for me. She's not looking at me, she's looking at whoever she was protecting. The grief is there — the specific grief of someone who failed at the one thing that mattered. Not the fight. The protection."

**Lyn:** *...*

"She'll go somewhere her allies have to pass. I want them to see it every time they move."

---

### Lilina — Not Game Over, but

Effect: Morrha's chokepoint aura expands by 2 tiles globally for the rest of the game. All enemies gain +2 stats for the next chapter. Maps with both Lilina and Morrha's statues become nearly impassable without specific routing.

*She approaches. Lilina is small. The fire tome is ash in the stone hands — the binding holds nothing.*

"She was casting. The tome is gone — burned through from the interrupted spell — but the hands are still in the release position. She was going to burn her way out."

*She leans close to the face. The expression is fury.*

"Look at that. Not afraid. Furious. She was angry at me right up until the instant she couldn't be anything anymore. That's Hector's daughter — I've seen the portraits. Same jaw. Same absolute refusal to accept the situation."

*A pause.*

"The fury will be completely helpless forever. I find that a better outcome than fear would have been."

**Lilina:** *...*

"She goes where everyone has to pass her to reach the objective. Let the outrage watch them go."

---

## Chapter Canonical Start States

Used when launching a chapter directly from the chapter selector (not continuing from a save).
Represents an "average case" playthrough — a player who fought well but didn't optimise.

### Chapter 1 — "The Stone Tide"
All units at starting stats. No prior history.

| Unit | Level | EXP | State |
|------|-------|-----|-------|
| Eirika | 1 | 0 | Active |
| Tana | 1 | 0 | Active |
| Vanessa | 1 | 0 | Active |
| Syrene | 1 | 0 | Active |

### Chapter 2 — Canonical state after Ch1
Average case: Eirika and Tana survived; Syrene was captured at the gate (canonical Ch1 loss); Vanessa escaped but fought little. Maya was rescued (3 turns available, achievable). Fleeing west girl escaped. Fleeing east girl failed (1-turn timer from chapter start, hardest rescue).

EXP note: Current formula gives ~26 EXP per kill (L1 attacker vs L3 enemy). 3–4 kills in Ch1 → ~80–104 EXP → level 2. This is the expected Eirika state.

| Unit | Level | EXP | State |
|------|-------|-----|-------|
| Eirika | 2 | 20 | Active |
| Tana | 1 | 70 | Active |
| Vanessa | 1 | 30 | Active |
| Syrene | 1 | 0 | PETRIFIED_CAPTURED |

Flags: `maya_rescued`, `fleeing_west_escaped`, `fleeing_east_failed`, `syrene_lost_ch1`

---

## Serra's "No Cure" Dialogue (Side Ch2A)

Fires when Serra tries her staff on a freshly petrified Priscilla or Farina:

```
Serra:    "Wait — let me try. I have a Recover staff, I have—"
Serra:    "It's not working. The magic just... dissipates. Like pouring water on stone."
Serra:    "This isn't like a wound or a curse. Whatever they did to her goes all the way through."
Lyn:      "Serra."
Serra:    "I KNOW. I know. I just — she's right there."
Narrator: "Serra lowers her staff. There is nothing to be done here."
```

---

*Last updated: Chapter 1 complete. Next: implement Chapter 2 + Side Ch2A.*
