# Inevitable Eternity — Chapter Overview

> **Design bible for all chapters.** Must be consulted before designing or implementing any chapter.
> Sources: game-design.md (canonical) and petrification-compendium.md (canonical).
> Where this file conflicts with game-design.md, treat game-design.md as authoritative and flag the conflict for resolution.
> ⚠️ markers indicate unresolved inconsistencies between existing canonical documents.

---

## How to Use This File

Before designing a chapter:
1. Read the chapter's entry here in full.
2. Check "Mechanics Introduced" — do not re-implement mechanics that already exist.
3. Check "Statue Installations (Start)" — these must be present before the player has control.
4. Check "Flags In" — the chapter must behave correctly for all valid flag combinations.
5. Check "Flags Out" — set the correct flags on completion.

Petrification type key: **S** = scripted (cannot be prevented), **O** = optional (player-preventable).

---

## Act 1 — Retreat
*Chapters 1–5. Location: Magvel (Eirika's group) and Elibe West (Lyn's group, from Ch3). Tone: overwhelmed retreat, no time to recover.*

---

### Ch1 — The Stone Tide

| | |
|---|---|
| **Setting** | Besieged Renais stronghold — interior courtyard and gate |
| **Map type** | Escape (east edge) |
| **Enemy composition** | Gate guards (friendly NPC → immediate scripted petrification), soldiers, Gorgons, The Hand (boss, does not fight — directs) |
| **Playable units** | Eirika, Tana, Vanessa, Syrene |

**Mechanics introduced:**
- STO-RES stat (displayed in unit info)
- GAZE attack (enemy skill, reduces STO-RES on hit; HP damage is incidental)
- PETRIFIED_SAFE state (unit petrified on player side — no aura, can be restored in theory)
- PETRIFIED_CAPTURED state (enemy picks up a PETRIFIED_SAFE unit on enemy phase → aura activates)
- Tier B aura (gate guards, decorative — no capture, no aura. Sets visual precedent only)

**Statue installations (chapter start):** None.

**Statue installations (mid-chapter, scripted):**
- Gate guards ×2 petrified in the opening sequence. Decorative, no aura. Tier classification: none (NPC guards, not named characters).

**Statue installations (mid-chapter, conditional):**
- Syrene — Tier B — if captured by enemy (PETRIFIED_SAFE + adjacent enemy)
- Vanessa — Tier B — same condition
- Tana — Tier A — same condition (she is a named recurring character)

**Flags out:**
| Flag | Condition |
|------|-----------|
| `syrene_lost_ch1` | Syrene reached PETRIFIED_CAPTURED |
| `vanessa_lost_ch1` | Vanessa reached PETRIFIED_CAPTURED |
| `tana_lost_ch1` | Tana reached PETRIFIED_CAPTURED |
| `maya_rescued` | Optional village NPC rescued |
| `fleeing_west_escaped` | Optional civilian escaped |
| `fleeing_east_failed` | Optional civilian failed to escape (1-turn window from chapter start) |

**Canonical Ch1 start state:** No prior history. All units level 1, full HP, no flags.

---

### Ch2 — The Amber Wake

| | |
|---|---|
| **Setting** | Riverside trading post / road village, dawn |
| **Map type** | Escape (east edge) |
| **Enemy composition** | Gorgon squad (Gorgons + soldiers), pushing from west and south |
| **Playable units** | Eirika, Tana, Vanessa (+ Syrene if `syrene_lost_ch1` = false) |

**Mechanics introduced:**
- Tier A aura (Natasha — first named-character aura the player experiences)
- Pre-installed enemy statue on the map at chapter start (gate guard statue from a prior conflict, Tier B — not one of the playable characters)
- Aura active before player has any control — the chapter opens inside a debuff

**Opening sequence (scripted, before player control):**
1. Eirika and Natasha notice the pre-installed gate guard statue at the road chokepoint.
2. Natasha approaches and tries her staff on the statue. The staff fails silently — not shattered, just dark. She lowers it.
3. Natasha does not fully verbalise why it failed. Beat of silence. *She didn't know yet; she will never get to know.*
4. Gorgon squad arrives. One breaks through immediately. Natasha is petrified (scripted) — staff shatters on contact, hands in healing position.
5. Enemy inspection beat fires (from petrification-compendium.md Ch2 entry).
6. Natasha's statue is placed near the gate guard statue. Both auras now active.
7. Player control begins.

**Statue installations (chapter start):**
- Pre-installed gate guard statue — Tier B — at road chokepoint. Present before the opening sequence.

**Statue installations (after opening, before player control):**
- Natasha — Tier A — placed near the gate guard statue. Active from turn 1.
- Combined aura at chapter start: −1 stats −10 hit/avoid (Tier B) + −2 stats STO decay 1/turn (Tier A). Stacked: −3 stats −10 hit/avoid, STO decay 1/turn across the central map area.

**Aura effect note (Natasha, Tier A):** Healer inversion — all healing received by player units inside Natasha's aura radius is reduced by −1 HP. (HP healed = normal result − 1, minimum 0.)

**Flags in:** `syrene_lost_ch1`, `vanessa_lost_ch1`

**Flags out:** None new. Vanessa petrification here is not a separate flag — her Ch4 logic checks `vanessa_lost_ch1` (set in Ch1) rather than a Ch2 flag, since she is guaranteed in Ch4 regardless.

**Canonical Ch2 start state** (from game-design.md):

| Unit | Level | EXP | State |
|------|-------|-----|-------|
| Eirika | 2 | 20 | Active |
| Tana | 1 | 70 | Active |
| Vanessa | 1 | 30 | Active |
| Syrene | 1 | 0 | PETRIFIED_CAPTURED |

Flags assumed: `syrene_lost_ch1`, `fleeing_west_escaped`, `fleeing_east_failed`. (`maya_rescued` varies by player.)

---

### Side Ch2A — The Price of a Head Start

| | |
|---|---|
| **Setting** | Western Elibe village road, night — playable flashback |
| **Map type** | Escape (Lyn must reach the east edge) |
| **Enemy composition** | Gorgons, cavalry |
| **Playable units** | Lyn's group — Lyn, Serra, Priscilla, Farina, Rebecca, Florina, Nino (first appearance of Lyn's group as a playable roster) |

**Mechanics introduced:**
- Parallel campaign: Lyn's group first becomes playable here
- "No cure" established: Serra's dialogue fires when she tries her staff on a freshly petrified ally (see game-design.md for full dialogue). This is the *discovery* moment for Lyn's group — they learn petrification cannot be reversed with current magic.

**Petrifications:**
⚠️ **Inconsistency in source docs:** The Side Ch2A description in game-design.md says "Priscilla and Farina fall covering her." However, the character petrification schedule lists both as Ch5 scripted (S). Two possible resolutions — one must be chosen before implementing this chapter:
- **Option A:** Priscilla and Farina reach PETRIFIED_SAFE in Side Ch2A covering Lyn's escape, but are not captured by the enemy yet. They rejoin in Ch3 or Ch5 and are then scripted-captured in Ch5. Serra's "no cure" dialogue fires here on whichever one goes down first.
- **Option B:** Priscilla and Farina are fully captured (PETRIFIED_CAPTURED) in Side Ch2A, which contradicts the Ch5 schedule. The Ch5 entry would need to be revised.
- **Option A is recommended** — it reconciles both documents without losing the Ch5 scripted beats.

**Flags out:** `serra_found_no_cure` (triggers specific dialogue callbacks in later chapters)

---

### Ch3 — West by Firelight

| | |
|---|---|
| **Setting** | Elibe villages, night — Lyn's group in parallel retreat |
| **Map type** | Escape (west-to-east through village chain) — inferred |
| **Enemy composition** | Gorgons, village-level soldiers |
| **Playable units** | Lyn's group |

**Mechanics introduced:**
- Aura stacking example: if both Serra and Rebecca are captured, their auras stack (Serra Tier A + Rebecca Tier B = −3 stats −10 hit/avoid, STO decay 1/turn). First in-chapter demonstration of linear stacking.

**Petrifications:**
- Serra — S — Tier A. Aura: Stacks with Natasha's if both are on same map (healer inversion compounds).
- Rebecca — O — Tier B.

**Flags in:** `serra_found_no_cure`

**Flags out:** `serra_lost`, `rebecca_lost`

---

### Ch4 — The Cost of Flight

| | |
|---|---|
| **Setting** | Open terrain, aerial Gorgon attack — both groups' retreat corridors intersect |
| **Map type** | Escape — inferred |
| **Enemy composition** | Aerial Gorgons (new enemy type: flying, Gaze from above), ground soldiers |
| **Playable units** | Eirika's group + Lyn's group (parallel maps or shared map — TBD) |

**Mechanics introduced:**
- Aerial Gorgons: flying enemies with Gaze attack. Different threat model — ground units cannot easily counterattack.
- Guaranteed late petrification: Vanessa is scripted in this chapter if she survived Ch1. The player knows they cannot save her, only delay.

**Petrifications:**
- Vanessa — S (guaranteed if `vanessa_lost_ch1` = false) — Tier B. Note: if `vanessa_lost_ch1` is true, a different scripted petrification fills this slot (TBD — possibly a named minor character).
- Nino — S — Tier A. Aura: enemy mages in radius +2 magic.
- Florina — O — Tier A. Aura: flying enemies in radius +1 movement.

**Flags in:** `vanessa_lost_ch1`

**Flags out:** `vanessa_lost` (universal, covers both Ch1 and Ch4 paths), `nino_lost`, `florina_lost`

---

### Ch5 — Last Out

| | |
|---|---|
| **Setting** | Border crossing — final rearguard action before the groups reach safety (temporarily) |
| **Map type** | Escape — inferred |
| **Enemy composition** | Heavy assault — mixed Gorgons, cavalry, heavy infantry |
| **Playable units** | Eirika's group + Lyn's group |

**Mechanics introduced:**
- Multiple scripted losses in a single chapter — the player knows some characters will not make it regardless of play quality.
- Priscilla's mounted piece: horse + rider as a single statue (special installation note — requires dedicated pedestal, not a shelf piece).

**Petrifications:**
- Amelia — S — Tier B. Aura: enemies in radius +1 all stats. (Eirika's group.)
- Farina — S — Tier B. Aura: aerial echo — flying enemies +1 movement. (Lyn's group.)
- Priscilla — S — Tier B. Aura: cavalry enemies ignore terrain cost. (Lyn's group.)

⚠️ **Note on Priscilla/Farina:** If Option A is chosen for Side Ch2A (they went PETRIFIED_SAFE there), they must be recovered and re-active by Ch5 for the scripted capture to fire correctly. Ensure Side Ch2A's PETRIFIED_SAFE → recovery pipeline works before Ch5 implementation.

**Flags in:** `vanessa_lost`, `nino_lost`, `florina_lost`

**Flags out:** `amelia_lost`, `farina_lost`, `priscilla_lost`

---

## Act 2 — Lilina's Disaster
*Chapters 6–9. Location: Elibe Central (Lilina's group). Tone: a trap that closes completely. Morrha's Dark Veil suppresses light and anima magic across all Act 2 maps.*

---

### Ch6 — Into the Veil

| | |
|---|---|
| **Setting** | Elibe Central — Morrha's territory, first contact |
| **Map type** | TBD — probably Rout or Escape |
| **Enemy composition** | Morrha's forces, Dark Veil active |
| **Playable units** | Lilina's group — Lilina, Wendy, Clarine, Larum, Sue, Shanna, Dorothy, Thea, Elen, Cath, Sophia (first appearance) |

**Mechanics introduced:**
- Dark Veil: passive map mechanic. Light magic and anima magic deal 0 damage (spells still expend uses; staves still work for healing). Dark magic functions normally.
- Lilina's group as a third protagonist roster.
- Morrha introduced as a non-combat enemy presence (not yet fought).

**Petrifications:**
- Shanna — S — Tier B. No special aura effect.

**Flags out:** `shanna_lost`

---

### Ch7 — The Mass Petrification

| | |
|---|---|
| **Setting** | Three-front encirclement — Lilina's group surrounded |
| **Map type** | Escape (Lilina barely escapes — scripted partial success) |
| **Enemy composition** | Three-direction assault; enemy forces coordinate across all vectors |
| **Playable units** | Lilina's group (depleted from Ch6) |

**Mechanics introduced:**
- Three-front pressure map: enemies approach from north, south, and west simultaneously.
- Mass petrification event: multiple scripted losses fire within a short window mid-chapter, demonstrating that the player cannot save everyone even with good play.
- Heavy aura stacking: multiple Tier B auras active simultaneously by chapter end.

**Petrifications:**
- Wendy — S — Tier B. Aura: enemies in radius +2 defense.
- Clarine — S — Tier B. Aura: player units lose 1 RES/turn in radius.
- Larum — O — Tier B. No special aura.
- Sue — O — Tier B. No special aura.

⚠️ **Inconsistency:** game-design.md chapter outline lists Cath as optional in Ch7. The character petrification schedule lists Cath as Side Ch8A scripted. These are not necessarily contradictory (she survives Ch7 as an optional loss, is definitively captured in Side Ch8A), but the Ch7 optional petrification for Cath should be verified against intended narrative. Recommended: Cath is **not** petrifiable in Ch7 — her Ch8A capture is her defining scene and should not be pre-empted.

**Flags out:** `wendy_lost`, `clarine_lost`, `larum_lost`, `sue_lost`

---

### Side Ch7A — The Foreseen

| | |
|---|---|
| **Setting** | Sophia's vision — single map |
| **Map type** | Survive N turns or scripted end condition |
| **Playable units** | Sophia + Lilina (vision participants only) |

**Mechanics introduced:**
- Vision/flashforward: player sees a preview of Ch12's map layout and Sophia's scripted petrification. Lilina does not fully believe it. Sophia does not try to prevent it.

**Petrifications:** None (vision, not real events).

**Notes:** This chapter is the setup for Ch12's payoff — "The Prophet Was Right." The vision shown here must match Ch12's actual events exactly. Implement after Ch12 is finalized.

---

### Side Ch8A — The Collection

| | |
|---|---|
| **Setting** | Enemy gallery — Cath infiltrates to gather intelligence |
| **Map type** | Stealth/infiltration — Cath alone, cannot fight, must avoid detection |
| **Playable units** | Cath (solo) |

**Mechanics introduced:**
- Enemy gallery view: player sees all named statues collected so far, lit and arranged. This is the emotional gut punch chapter — designed to make prior losses feel permanent and deliberate.
- Gallery inspection mechanics: player can examine each statue the enemy has collected (all characters the player already lost are present).

**Petrifications:**
- Cath — S — Tier B. Scripted: she is ambushed while escaping. Aura: blocks alternate path on subsequent maps.

**Flags in:** All `_lost` flags from Ch1–Ch7. Used to populate the gallery with the correct statues.

**Flags out:** `cath_lost`

---

### Ch8 — The Rout

| | |
|---|---|
| **Setting** | Scattered — survivors of Ch7 separated and picked off |
| **Map type** | Multiple small engagements (rout structure) |
| **Enemy composition** | Gorgon pursuit squads, mixed |
| **Playable units** | Lilina's group (Ch7 survivors) |

**Mechanics introduced:**
- Rout map with fragmented survivor groups: player must manage multiple isolated unit clusters rather than a unified front.

**Petrifications:**
- Dorothy — O — Tier B. Aura: enemy archers +1 range.
- Thea — O — Tier B. Aura: all enemies on map +5 avoid.
- Elen — O — Tier B. No special aura.

**Flags out:** `dorothy_lost`, `thea_lost`, `elen_lost`

---

### Ch9 — Collapse

| | |
|---|---|
| **Setting** | Lilina's stronghold — final fall |
| **Map type** | Survive until escape route opens, or Boss — Lilina escapes but the stronghold falls |
| **Enemy composition** | Morrha's elite forces + generals |
| **Playable units** | Lilina's group (remaining) |

**Mechanics introduced:**
- Political captures: Cecilia and Guinivere are taken as deliberate political acquisitions, not random casualties. Their auras reflect their strategic value (enemy commanders/bosses enhanced).
- Three scripted Tier A losses in one chapter — the most oppressive multi-aura load the game has delivered so far.

**Petrifications:**
- Cecilia — S — Tier A. Aura: enemy generals and paladins +1 movement.
- Guinivere — S — Tier A. Aura: enemy bosses +3 all stats.
- Tethys — S — Tier A. No special aura effect listed.

**Flags out:** `cecilia_lost`, `guinivere_lost`, `tethys_lost`

---

## Act 3 — Convergence & First Rescues
*Chapters 10–13. Location: Elibe. Tone: the three groups converge; Sunstone Shards introduced as hope deferred. Two rescue missions into Morrha's stronghold.*

---

### Ch10 — The Meeting That Wasn't

| | |
|---|---|
| **Setting** | Elibe — Eirika and Lyn's groups meet |
| **Map type** | TBD |
| **Enemy composition** | TBD |
| **Playable units** | Eirika's group + Lyn's group (combined) |

**Mechanics introduced:**
- Three-group convergence: Lilina's surviving members begin joining Eirika/Lyn in this act.
- Recapture: Tana was previously saved in Ch1 (optional). Even if she survived Ch1, she is scripted-captured here on her return — the game takes back what was saved. This is intentional. If Tana was already PETRIFIED_CAPTURED from Ch1, a different named unit may fill this scripted loss slot (TBD).

**Petrifications:**
- Tana — S — Tier A. Scripted second capture (or first, if she survived Ch1). Aura: −2 stats, STO decay 1/turn.

**Flags in:** `tana_lost_ch1` (affects scripted beat dialogue but not whether petrification fires)

**Flags out:** `tana_lost` (universal — covers Ch1 and Ch10 paths)

---

### Ch11 — Debris

| | |
|---|---|
| **Setting** | Elibe — survivors regroup, limited advance |
| **Map type** | TBD |
| **Enemy composition** | Morrha's pursuing forces |
| **Playable units** | All surviving units from all three groups |

**Mechanics introduced:**
- Sunstone Shard concept introduced: scholar NPC explains the shards exist and could in theory reverse petrification. No shards available yet. Establishes the late-game restoration mechanic as a future possibility without making current losses feel reversible.
- First chapter with full combined roster — player manages the largest available unit pool.

**Petrifications:**
- Neimi — O — Tier B. No special aura. (Note: Neimi's compendium entry details the preserved stone tears — unique visual detail for close-viewing display.)

**Flags out:** `neimi_lost`

---

### Ch12 — The Prophet Was Right

| | |
|---|---|
| **Setting** | Elibe — location matching Sophia's Ch7A vision exactly |
| **Map type** | Must match the map shown in Side Ch7A |
| **Enemy composition** | Morrha's forces |
| **Playable units** | All surviving units |

**Mechanics introduced:**
- Vision payoff: the map and events match what the player saw in Side Ch7A. If Sophia's vision was shown accurately, the player watches something they foresaw unfold anyway.
- Sophia's aura is specifically threatening: player STO-RES decays 1 extra/turn for all units in her capture radius, stacking with all existing auras.

**Petrifications:**
- Sophia — S — Tier A. Aura: player STO-RES decays 1 extra/turn in radius.

**Notes:** This chapter must be designed after Side Ch7A is finalized, or the two must be designed together. The vision shown in Side Ch7A must be accurate to what happens here.

**Flags out:** `sophia_lost`

---

### Ch13 — The Stronghold Below

| | |
|---|---|
| **Setting** | Morrha's base — raid |
| **Map type** | Boss (Morrha) + Escape |
| **Enemy composition** | Morrha's elite, Morrha herself (not a combat boss — the "confrontation" ends in her irreversible self-petrification) |
| **Playable units** | All surviving units |

**Mechanics introduced:**
- Morrha's irreversible petrification (cutscene): the curse consuming its source. Not caused by the player. Not reversible by Sunstone Shards. Permanent aura at her location, permanently.
- Morrha's special aura (permanent): STO-RES decay 3/turn in a 3-tile chokepoint radius. Does not stack with tier interactions; overrides them. Cannot be removed.
- First Sunstone Shards available (late ch13 reward, or early ch14). Player must choose who to restore first — this is the first time restoration is mechanically possible.

**Petrifications:**
- Marisa — O — Tier A. Aura: enemy units +10 critical in radius.
- Isadora — O — Tier B. No special aura.
- Morrha — S (irreversible, cutscene) — Special aura (see above).

**Flags out:** `marisa_lost`, `isadora_lost`

---

## Act 4 — The Push
*Chapters 14–18. Location: Toward the Queen's fortress. Tone: captured statues deployed as map installations. The collection is used against the collectors.*

---

### Ch14 — Through the Galleries

| | |
|---|---|
| **Setting** | Enemy-held galleries and corridors — captured statues arranged as permanent map installations |
| **Map type** | Escape or Seize |
| **Enemy composition** | Elite guards, Collectors (enemy unit type, first full appearance) |
| **Playable units** | All surviving units |

**Mechanics introduced:**
- Pedestal mechanic: enemy-placed statues as permanent map installations. Pre-collected characters appear as active aura sources in map layout. Player must route around or through multiple overlapping auras.
- Collector as a regular enemy unit type (previously appeared as scripted only in opening cinematics). In Ch14 they are targetable and can be killed.
- First chapter where Sunstone Shards can be actively used (if earned in Ch13).

**Petrifications:**
- Fir — O — Tier B. Aura: enemy myrmidons +5 speed in radius.
- Echidna — O — Tier B. No special aura.

**Notes:** The gallery maps should feature statues of characters already lost — specifically those with high aura tiers (Natasha, Serra, Tana, Nino, Cecilia, etc.). The player walks through a display of their prior losses. Installation notes from petrification-compendium.md apply here.

**Flags in:** All prior `_lost` flags. Used to determine which statues are present in the gallery.

**Flags out:** `fir_lost`, `echidna_lost`

---

### Ch15 — The Commander's Hall

| | |
|---|---|
| **Setting** | Queen's outer fortress — commander-level halls |
| **Map type** | Seize or Boss |
| **Enemy composition** | Commander-class enemies, aerial units |
| **Playable units** | All surviving units |

**Mechanics introduced:**
- Aura stacking becomes acutely oppressive: multiple Tier A and B sources active simultaneously in confined corridor maps.

**Petrifications:**
- Fiora — O — Tier A. Aura: flying enemies act twice per enemy phase.
- L'Arachel — O — Tier A. Aura: divine weapons deal −2 damage in radius.
- Igrene — O — Tier B. No special aura.

**Flags out:** `fiora_lost`, `larachel_lost`, `igrene_lost`

---

### Ch16 — The Long Hall

| | |
|---|---|
| **Setting** | Final approach corridor to Queen's inner sanctum |
| **Map type** | Escape or Seize — attrition design |
| **Enemy composition** | Mixed elite forces, including mages |
| **Playable units** | All surviving units |

**Mechanics introduced:**
- Attrition map design: long corridor, persistent auras, enemy reinforcement waves. The map is designed to wear down the player's STO-RES reserves before the final chapters.

**Petrifications:**
- Lute — O — Tier A. Aura: enemy mages +3 magic in radius.
- Juno — O — Tier B. No special aura.
- Karla — O — Tier B. No special aura.

**Notes:** Lute's compendium entry notes the tome detonated (not crumbled) — her capture requires a special animation. The stone tome fragments are part of the piece and scatter in a radius around the base. Display requires a clear perimeter.

**Flags out:** `lute_lost`, `juno_lost`, `karla_lost`

---

### Ch17 — The Trophy Room

| | |
|---|---|
| **Setting** | Queen's inner sanctum — the main collection display |
| **Map type** | Boss or Survive |
| **Enemy composition** | Queen's personal guard, with specific targeting of Ninian and Fae |
| **Playable units** | All surviving units |

**Mechanics introduced:**
- Tier S aura (Ninian): the game's most powerful aura. Enemies in 3-tile radius act twice per enemy phase. Cannot be avoided without killing or bypassing. All prior auras remain active — stacking with Tier S creates near-impassable map sections.
- The enemy specifically targets Ninian and Fae for their rarity/value. Player may be forced to choose who to protect.

**Petrifications:**
- Louise — O — Tier B. No special aura.
- Fae — O — Tier A. Aura: player dragon units cannot transform in radius.
- Ninian — S — Tier S. Aura: enemies in 3-tile radius act twice per enemy phase.

**Notes:** Ninian's compendium entry marks her as "the finest piece in the collection" — the trophy room centerpiece. Her scripted petrification is the chapter's climax regardless of player action. Her installation is elevated, rotating display, center of the room.

**Flags out:** `louise_lost`, `fae_lost`, `ninian_lost`

---

### Ch18 — Inevitable Eternity

| | |
|---|---|
| **Setting** | Queen's throne / final chamber |
| **Map type** | Boss (Queen) |
| **Enemy composition** | Queen + elite guard. Multiple active Tier A/S aura sources from prior captures installed in the room. |
| **Playable units** | All surviving units |

**Mechanics introduced:**
- Optional rescue mission for Myrrh: a side path allows a small squad to reach Myrrh before the Queen's guard can capture her. The rescue is not required to complete the chapter.
- All previously collected statues are present as installations — the player fights through the full weight of every prior loss.

**Petrifications:**
- Myrrh — O (rescue available) — Tier A. Aura: divine suppression AoE if unrescued.

**Final note:** All prior `_lost` flags determine which statues line the final chamber. A player who minimized losses faces a lighter final map. A player who lost many faces near-impassable aura density. The chapter difficulty scales with prior failure — the losses compound.

**Flags in:** All prior `_lost` flags.

---

## Appendix A — Petrification Schedule Summary

*Source: game-design.md canonical schedule. Type key: S = scripted, O = optional, G = game-over.*

| # | Character | Group | Chapter | Type | Aura Tier | Notable Aura Effect |
|---|-----------|-------|---------|------|-----------|---------------------|
| 1 | Gate Guards ×2 | NPC | Ch1 | S | — | Decorative only |
| 2 | Vanessa | Eirika | Ch1/Ch4 | O/S | B | −1 stats, −10 hit/avoid |
| 3 | Syrene | Eirika | Ch1/Ch4 | O | B | −1 stats, −10 hit/avoid |
| 4 | Tana | Eirika | Ch1/Ch10 | O/S | A | −2 stats, STO decay 1/turn |
| 5 | Natasha | Eirika | Ch2 | S | A | Healer inversion: −1 HP from all healing in radius |
| 6 | Serra | Lyn | Ch3 | S | A | Healer inversion stacks with Natasha |
| 7 | Rebecca | Lyn | Ch3 | O | B | — |
| 8 | Nino | Lyn | Ch4 | S | A | Enemy mages +2 magic in radius |
| 9 | Florina | Lyn | Ch4 | O | A | Flying enemies +1 movement in radius |
| 10 | Amelia | Eirika | Ch5 | S | B | Enemies +1 all stats in radius |
| 11 | Farina | Lyn | Ch5 | S | B | Flying enemies +1 movement in radius |
| 12 | Priscilla | Lyn | Ch5 | S | B | Cavalry enemies ignore terrain cost |
| 13 | Shanna | Lilina | Ch6 | S | B | — |
| 14 | Wendy | Lilina | Ch7 | S | B | Enemies +2 defense in radius |
| 15 | Clarine | Lilina | Ch7 | S | B | Player units lose 1 RES/turn in radius |
| 16 | Larum | Lilina | Ch7 | O | B | — |
| 17 | Sue | Lilina | Ch7 | O | B | — |
| 18 | Cath | Lilina | Side Ch8A | S | B | Blocks alternate path |
| 19 | Dorothy | Lilina | Ch8 | O | B | Enemy archers +1 range |
| 20 | Thea | Lilina | Ch8 | O | B | All enemies +5 avoid |
| 21 | Elen | Lilina | Ch8 | O | B | — |
| 22 | Cecilia | Lilina | Ch9 | S | A | Enemy generals/paladins +1 movement |
| 23 | Guinivere | Lilina | Ch9 | S | A | Enemy bosses +3 all stats |
| 24 | Tethys | Lilina | Ch9 | S | A | — |
| 25 | Neimi | Eirika | Ch11 | O | B | — |
| 26 | Sophia | Lilina | Ch12 | S | A | Player STO-RES decays 1 extra/turn in radius |
| 27 | Marisa | Eirika | Ch13 | O | A | Enemy units +10 critical in radius |
| 28 | Isadora | Lilina | Ch13 | O | B | — |
| 29 | Fir | Mixed | Ch14 | O | B | Enemy myrmidons +5 speed in radius |
| 30 | Echidna | Mixed | Ch14 | O | B | — |
| 31 | Fiora | Lyn | Ch15 | O | A | Flying enemies act twice per enemy phase |
| 32 | L'Arachel | Eirika | Ch15 | O | A | Divine weapons −2 damage in radius |
| 33 | Igrene | Lilina | Ch15 | O | B | — |
| 34 | Lute | Eirika | Ch16 | O | A | Enemy mages +3 magic in radius |
| 35 | Juno | Lilina | Ch16 | O | B | — |
| 36 | Karla | Lilina | Ch16 | O | B | — |
| 37 | Louise | Lyn | Ch17 | O | B | — |
| 38 | Fae | Lilina | Ch17 | O | A | Player dragon units cannot transform in radius |
| 39 | Ninian | Lyn | Ch17 | S | S | Enemies in 3-tile radius act twice per enemy phase |
| 40 | Myrrh | Eirika | Ch18 | O | A | Divine suppression AoE |
| M | Morrha | Enemy | Ch13 | S (irreversible) | Special | STO-RES decay 3/turn, permanent |
| — | Eirika | — | Any | G | S | Game over |
| — | Lyn | — | Any | not G | S | Tier S aura on all subsequent maps |
| — | Lilina | — | Any | not G | S | Morrha aura expands 2 tiles globally |

---

## Appendix B — Open Inconsistencies

These are conflicts between existing canonical documents that must be resolved before the affected chapters are implemented.

| # | Conflict | Chapters affected | Recommended resolution |
|---|----------|-------------------|------------------------|
| 1 | Side Ch2A description says "Priscilla and Farina fall covering her" but character schedule lists both as Ch5 scripted | Side Ch2A, Ch5 | Option A: they reach PETRIFIED_SAFE in 2A, recover, are scripted-captured in Ch5. Serra's "no cure" fires on the SAFE petrification. |
| 2 | Chapter outline lists Cath as optional in Ch7; character schedule lists her as Side Ch8A scripted | Ch7, Side Ch8A | Remove Cath from Ch7 optional pool. Her capture belongs to Side Ch8A as her defining scene. |
| 3 | Side Ch7A must match Ch12 exactly, but neither chapter is yet implemented | Side Ch7A, Ch12 | Design and implement both together, or design Ch12 first and retrofit Side Ch7A to match. |
| 4 | Vanessa guaranteed Ch4 if not Ch1 — what fills the scripted slot if `vanessa_lost_ch1` = true | Ch4 | Needs a named minor character designated as the Ch4 scripted loss in Vanessa's place, or Vanessa's slot is simply empty. |
