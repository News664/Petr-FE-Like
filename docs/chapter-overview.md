# Inevitable Eternity — Chapter Overview

> **Design bible for all chapters.** Must be consulted before designing or implementing any chapter.
> Sources: game-design.md and petrification-compendium.md (both canonical).
> Where this file conflicts with game-design.md, flag the conflict and discuss before proceeding.
> ⚠️ markers indicate unresolved inconsistencies requiring discussion before implementation.

---

## How to Use This File

Before designing a chapter:
1. Read the chapter's full entry here.
2. Check **Mechanics Introduced** — do not re-implement existing mechanics.
3. Check **Statue Installations (Start)** — these are active before the player has control.
4. Check **Flags In/Out** — the chapter must behave correctly for all valid flag combinations.
5. If any ⚠️ inconsistency is listed for the chapter, stop and discuss before writing code.

Petrification type key: **S** = scripted (cannot be prevented), **O** = optional (player-preventable).

---

## Global Mechanics Reference

### Petrification States — Act Restrictions

In Act 1 and Act 2, the player side is in continuous retreat. The enemy always controls the field after combat. There is no PETRIFIED_SAFE state in these acts: any unit that reaches 0 HP or 0 STO-RES is immediately PETRIFIED_CAPTURED. The enemy collects before the player can react.

PETRIFIED_SAFE is introduced as a mechanic in Act 3 (Ch10+), when the player is capable of sometimes defending a fallen ally before the Collector reaches them. Killing the Collector unit before it reaches the petrified unit sends that unit to PETRIFIED_SAFE instead of PETRIFIED_CAPTURED.

| Act | PETRIFIED_SAFE available | PETRIFIED_CAPTURED | Collector unit targetable |
|-----|--------------------------|-------------------|--------------------------|
| 1 (Ch1–5) | No | Immediate on petrification | No (scripted) |
| 2 (Ch6–9) | No | Immediate on petrification | No (scripted) |
| 3 (Ch10–13) | Yes | Requires Collector to reach unit | Yes (killable) |
| 4 (Ch14–18) | Yes | Requires Collector to reach unit | Yes (killable) |

---

### Aura System — Revised Tiers

All values are active for any player unit within the aura radius at start of that unit's turn.

| Tier | Radius | Stat debuff | Hit / Avoid | STO-RES decay/turn | Stacking |
|------|--------|-------------|-------------|---------------------|---------|
| B | 5 | −2 all | −10 / −10 | −2 | Linear per source |
| A | 6 | −4 all | −15 / −15 | −3 | Linear per source |
| S | 7 | −6 all | −20 / −20 | −4 + enemies in 3-tile sub-radius act twice per phase | Linear per source |
| Morrha (special) | 3 | — | — | −5, overrides tier interactions | Does not stack; overrides |

**Stacking examples:**
- Two Tier B: −4 stats, −20 hit/avoid, STO-RES decay 4/turn
- Tier A + Tier B: −6 stats, −25 hit/avoid, STO-RES decay 5/turn
- Three Tier B: −6 stats, −30 hit/avoid, STO-RES decay 6/turn
- Tier S + Tier A: −10 stats, −35 hit/avoid, STO-RES decay 7/turn + enemies act twice in sub-radius

**STO-RES decay in context:** A Medium unit (STO-RES 10) caught in two overlapping Tier B auras decays in 2.5 turns. A Very Low unit (STO-RES 4–6) in a single Tier A aura lasts 1–2 turns. Late-game maps with 4–5 sources make navigation the primary challenge.

**Named character aura effects** (unique per character, active in addition to tier debuffs — see petrification-compendium.md for full entries):

| Character | Unique aura effect |
|-----------|-------------------|
| Natasha | All healing received by player units in radius −1 HP (min 0) |
| Serra | Stacks with Natasha's inversion; double-applies to any healer in both radii |
| Nino | Enemy mages in radius +2 magic |
| Florina | Flying enemies in radius +1 movement |
| Amelia | Enemies in radius +1 all stats |
| Farina | Flying enemies in radius +1 movement |
| Priscilla | Cavalry enemies ignore terrain cost |
| Wendy | Enemies in radius +2 defense |
| Clarine | Player units lose 1 RES/turn in radius |
| Cath | Blocks one alternate path on the map |
| Dorothy | Enemy archers +1 range |
| Thea | All enemies on map +5 avoid |
| Cecilia | Enemy generals and paladins +1 movement |
| Guinivere | Enemy bosses +3 all stats |
| Sophia | Player STO-RES decays 1 extra/turn in radius |
| Marisa | Enemy units +10 critical in radius |
| Fiora | Flying enemies act twice per enemy phase |
| L'Arachel | Divine weapons −2 damage in radius |
| Lute | Enemy mages +3 magic in radius |
| Ninian | Enemies in 3-tile radius act twice per enemy phase (Tier S sub-radius effect) |
| Fae | Player dragon units cannot transform in radius |
| Myrrh | Divine suppression AoE (exact effect TBD) |
| Lyn (lord defeat) | Serra takes −2 STO-RES/turn for rest of game; Florina gains +10 crit, −20 avoid |
| Lilina (lord defeat) | Morrha's aura expands 2 tiles globally; enemies +2 stats for next chapter |

---

### Petrifying Fog

A map-wide environmental hazard introduced in Ch7. Deployed by Morrha; cannot be dispelled or attacked.

**Mechanics:**
- The fog occupies specific map tiles and advances N tiles per turn in a defined direction
- Player units in fog: STO-RES decays −2/turn (in addition to all other aura effects)
- NPC units in the fog path: petrified automatically on the turn the fog reaches their tile. Their stone forms remain on the map as static obstacles. This is visible to the player.
- Enemy units are immune to the fog
- If a player unit reaches 0 STO-RES while inside the fog: immediately PETRIFIED_CAPTURED with no window for rescue (fog = Act 1/2 rules even in Act 3+ chapters)
- The fog advances regardless of what the player does — fighting enemies does not slow it

**Tone purpose:** Shows the scale of the catastrophe. The player watches civilians and animals petrify as the fog passes. The enemy is not stopping to fight — they're herding the player into the fog and collecting what falls.

**Chapters using fog:** Ch7 (primary deployment, Morrha's full-scale weapon). Act 3 has a secondary fog encounter (Ch11 or Ch12 — TBD during design).

---

### Chapter Defeat Scenes

Every chapter has a defeat scene that plays when all player units are petrified or the lord is captured. The scene follows the standard collector inspection format (see petrification-compendium.md): approach, examination, silence, disposition.

**Tone:** The inspector does not rage or gloat. They comment on the pose, the expression, the body — then immediately assign the piece a use. The disposal decision is practical and delivered in the same breath as the appraisal: "she goes in the commander's study," "this one deploys at the south corridor — the expression helps," "put her behind the desk as a rest." The horror is in the mundanity. A person is being assigned furniture duty. The inspection ends the moment the use is decided, not when the inspector is satisfied with what they saw.

The lord is always the featured piece in a defeat scene — the inspector's primary focus. Other newly captured units from the same chapter may be noted briefly before or after, but the lord receives the full four-beat treatment (approach, examination, silence, disposition).

Each chapter entry below includes a brief defeat scene note specifying the inspector and the disposal beat. Full dialogue should be written using the tone and format established in petrification-compendium.md.

For chapters where Eirika is the viewpoint lord: defeat = game over. The defeat scene plays as a final cutscene before the game-over screen.
For chapters where Lyn or Lilina is the viewpoint lord: defeat triggers their respective lord defeat entries (see game-design.md) and imposes ongoing penalties.

---

### Enemy Faction — Unit Types

Generic soldiers, infantry, and cavalry are not used. All enemy units belong to the collector faction and reflect the stone/petrification aesthetic.

| Unit type | Role | Replaces | Notes |
|-----------|------|----------|-------|
| **Gorgon** | Supernatural petrification weapon. GAZE attack (STO-RES damage). | — | Multiple subtypes: Standard (ground), Aerial (flying), Great (2-tile area GAZE) |
| **Stone Warden** | Heavy infantry. Partially petrified — enhanced toughness. High DEF, low speed. Minor GAZE on melee contact (STO-RES −1 per hit). Weak to magic. | Generic soldier / knight | The faction's frontline |
| **Gaze Hunter** | Light ranged scout. Fires partial-GAZE crossbow dealing STO-RES damage, no HP damage. Fragile, fast. | Archer / nomad | Prioritises low-STO-RES targets |
| **Petrified Construct** | Animated petrified NPC (never a named character). Melee only, immune to GAZE, immune to petrification effects. Defeated by magic or sustained physical attack. Leaves a static statue on the field after defeat. | Generic heavy infantry | First appearance Ch3 |
| **Collector** | Non-combat, high movement. In Act 3+: if a Collector reaches a petrified player unit, that unit becomes PETRIFIED_CAPTURED. Killing the Collector before it reaches the unit prevents capture. In Act 1–2: capture is automatic, Collector unit is not present on map (handled by narrative). | — | Introduced as targetable unit Ch10 |
| **Dark Witch** | Ranged magic user. Dark magic primary; secondary short-range GAZE attack (2-tile). | Dark mage | The faction's spellcaster |
| **Petrification Cavalier** | Mounted unit. Gaze-infused lance applies STO-RES −2 on hit in addition to normal HP damage. | Generic cavalry | First appearance Ch4 |
| **The Hand** | Named officer. Director and appraiser. Appears at major collection events. Does not engage in direct combat — commands other units and evaluates acquisitions. | Boss archetype | Introduced Ch1; recurs |

---

## Act 1 — Retreat
*Chapters 1–5. Magvel (Eirika's group, Ch1–2, Ch4–5) and Elibe West (Lyn's group, Side Ch2A–Ch3, Ch5). No PETRIFIED_SAFE. Enemy collects immediately.*

---

### Ch1 — The Stone Tide

| | |
|---|---|
| **Setting** | Besieged Renais stronghold — interior courtyard and main gate |
| **Map type** | Escape (east edge) |
| **Enemy composition** | Stone Wardens at the gate, Standard Gorgons inside, The Hand (non-combat director) |
| **Playable units** | Eirika, Tana, Vanessa, Syrene |

**Mechanics introduced:**
- STO-RES stat (displayed in unit info panel)
- GAZE attack: reduces STO-RES on hit; HP damage is incidental
- Petrification: unit at 0 STO-RES or 0 HP → immediately PETRIFIED_CAPTURED (Act 1 rules)
- Tier B aura: gate guard statues demonstrate the visual and debuff before any player unit is captured
- The Hand: introduced as a non-combat directing presence, not an attackable unit

**Statue installations (chapter start):** None.

**Statue installations (scripted, opening):**
- Gate guards ×2 petrified in the opening cinematic. Placed at the gate. Tier B aura radius 5 covers the gate approach. These are NPC guards, not named characters — aura stat effect only, no unique character effect.

**Statue installations (conditional, during play):**
- Syrene (Tier B), Vanessa (Tier B), Tana (Tier A): any player unit that is petrified is immediately installed by The Hand's Collectors as an aura source on the map.

**Petrifications:**
- Gate Guards ×2 — S — decorative, no unique aura effect
- Syrene — O — Tier B
- Vanessa — O — Tier B
- Tana — O — Tier A

**Defeat scene:** The Hand examines Eirika. Game over. Full inspection beat in petrification-compendium.md (Eirika lord defeat entry). Disposition: center of the reception hall, first thing anyone sees.

**Flags out:**

| Flag | Condition |
|------|-----------|
| `syrene_lost_ch1` | Syrene petrified |
| `vanessa_lost_ch1` | Vanessa petrified |
| `tana_lost_ch1` | Tana petrified |
| `maya_rescued` | Optional village NPC rescued |
| `fleeing_west_escaped` | Optional civilian escaped |
| `fleeing_east_failed` | Optional civilian failed (1-turn window) |

**Canonical Ch1 start state:** All units level 1, full HP and STO-RES, no flags.

---

### Ch2 — The Amber Wake

| | |
|---|---|
| **Setting** | Riverside trading post / road village, dawn |
| **Map type** | Escape (east edge) |
| **Enemy composition** | Gorgon squad: Standard Gorgons + Stone Wardens, pushing from west and south |
| **Playable units** | Eirika, Tana, Vanessa (+ Syrene if not lost Ch1) |

**Mechanics introduced:**
- Tier A aura (Natasha) — first named-character Tier A the player experiences
- Pre-installed statue on the map at chapter start (decorative gate guard from a prior conflict, not a playable character)
- Chapter begins inside active aura — no neutral territory at the start

**Opening sequence (scripted, before player control):**
1. Eirika's group arrives at the road. A stone figure stands at the chokepoint — a gate guard from an earlier campaign, already installed.
2. Natasha approaches and raises her staff. The staff fails silently — no reaction from the stone, no feedback. She lowers it.
3. She does not explain why. She doesn't fully understand it yet, and she will not get the chance to.
4. A Gorgon breaks through. Natasha is petrified (scripted) — staff shatters on contact, hands in the healing-carry position, palms slightly raised.
5. The inspection beat fires (petrification-compendium.md, Natasha entry). Her statue is placed adjacent to the gate guard statue.
6. Player control begins with two active aura sources already on the map.

**Statue installations (chapter start, before opening sequence):**
- Pre-installed gate guard statue — Tier B — at road chokepoint.

**Statue installations (after opening, before player control):**
- Natasha — Tier A — placed near the gate guard. Active from turn 1.
- Combined effect from turn 1: −6 stats, −25 hit/avoid, STO-RES decay 5/turn in the overlap zone (Tier B + Tier A stacked). The central road approach to the escape is immediately hazardous.

**Petrifications:**
- Natasha — S — Tier A — opening sequence

**Defeat scene:** Eirika. Game over. The Hand is present, observing the Gorgon squad's work. Inspection beat from compendium (Eirika lord defeat entry).

**Flags in:** `syrene_lost_ch1`, `vanessa_lost_ch1`

**Flags out:** None new. (Vanessa's guaranteed Ch4 petrification is tracked via `vanessa_lost_ch1`, not a Ch2 flag.)

**Canonical Ch2 start state** (from game-design.md):

| Unit | Level | EXP | State |
|------|-------|-----|-------|
| Eirika | 2 | 20 | Active |
| Tana | 1 | 70 | Active |
| Vanessa | 1 | 30 | Active |
| Syrene | 1 | 0 | PETRIFIED_CAPTURED |

Assumed flags: `syrene_lost_ch1`, `fleeing_west_escaped`, `fleeing_east_failed`.

---

### Side Ch2A — The Price of a Head Start

| | |
|---|---|
| **Setting** | Western Elibe village road, night — playable flashback showing how Lyn's group first escaped |
| **Map type** | Escape (Lyn must reach the east edge) |
| **Enemy composition** | Standard Gorgons, Petrification Cavaliers (first appearance for Lyn's group) |
| **Playable units** | Lyn, Serra, Priscilla, Farina, Rebecca, Florina, Nino — first appearance of Lyn's full group |

**Mechanics introduced:**
- Parallel campaign: Lyn's group first becomes playable here
- "No cure" discovery: Serra's dialogue fires when she attempts her staff on a freshly petrified ally (see game-design.md for full dialogue). This is the discovery moment — Lyn's group learns petrification cannot be reversed

**Petrifications:**
- Priscilla — S — Tier B. Scripted mid-chapter: she is petrified covering Lyn's escape. Immediately captured (Act 1 rules). Her statue is not recovered.
- Farina — S — Tier B. Scripted same sequence: diving to cover Lyn, petrified immediately after or alongside Priscilla. Serra's "no cure" dialogue fires on whichever falls first.

**Note on Ch5 schedule revision:** The canonical petrification schedule listed Priscilla and Farina as Ch5 scripted. Under the no-PETRIFIED_SAFE rule for Act 1, they cannot fall here and rejoin later. Resolution: they are captured here in Side Ch2A. Their Ch5 entries are revised — see Ch5 entry for what replaces them.

**Defeat scene:** Lyn (lord defeat entry, game-design.md). The inspector notes whoever was covering her. Two new acquisitions and a near-miss on the lord.

**Flags out:** `priscilla_lost`, `farina_lost`, `serra_found_no_cure`

---

### Ch3 — West by Firelight

| | |
|---|---|
| **Setting** | Elibe village chain, night — Lyn's group pushing east through settlements |
| **Map type** | Escape (east edge, through village sequence) |
| **Enemy composition** | Standard Gorgons, Stone Wardens, Petrified Constructs (first appearance — animated petrified villagers) |
| **Playable units** | Lyn's group (Lyn, Serra, Rebecca, Florina, Nino — Priscilla and Farina gone) |

**Mechanics introduced:**
- Petrified Constructs: animated petrified villagers used as frontline units. Immune to GAZE, melee only. Their defeat leaves a static villager statue on the map. Establishes that the enemy reanimates their collection for battlefield use.
- Aura stacking (first player-facing lesson): if both Serra and Rebecca are captured, their auras stack — demonstrated intentionally by map layout.
- Enemy deploys captured statues: Natasha's statue (from Ch2) appears as a map installation in a key chokepoint of this map, placed by the enemy between Ch2 and Ch3. First time a player-lost named character appears as a map feature in a subsequent chapter.

**Statue installations (chapter start):**
- Natasha — Tier A — pre-placed at a village road chokepoint. The player recognises her.

**Petrifications:**
- Serra — S — Tier A. Scripted: caught mid-word or mid-laugh; staff cracks in half. Full inspection beat in compendium.
- Rebecca — O — Tier B. Optional.
- Neimi — O — Tier B. *(Moved from Ch11 — she is Eirika's group but travels through the same region during the flight. Encounter here is brief and her loss can read as a straggler cut off from Eirika's route.)*

**Defeat scene:** Lyn (lord defeat entry). Serra's new statue noted alongside Natasha's — the inspector comments on two healers now in the collection.

**Flags in:** `serra_found_no_cure`

**Flags out:** `serra_lost`, `rebecca_lost`, `neimi_lost`

---

### Ch4 — The Cost of Flight

| | |
|---|---|
| **Setting** | Open terrain under aerial Gorgon attack — both groups' retreat corridors are hit simultaneously |
| **Map type** | Escape — inferred |
| **Enemy composition** | Aerial Gorgons (first appearance), Stone Wardens, Gaze Hunters, Petrification Cavaliers |
| **Playable units** | Eirika's group (Eirika, Tana, Vanessa) and Lyn's group (Lyn, Rebecca, Florina, Nino) — parallel maps or shared map TBD |

**Mechanics introduced:**
- Aerial Gorgons: flying, Gaze attack from above, cannot be counterattacked by ground units without bows or magic. Different threat model from ground Gorgons.
- Gaze Hunters at range: first chapter where the player faces consistent STO-RES pressure from distance as well as melee.
- Guaranteed late petrification: Vanessa is scripted here if she survived Ch1. The player cannot save her.

**Statue installations (chapter start):**
- Priscilla — Tier B — pre-placed (captured Side Ch2A). First appearance of Priscilla's statue on a map.
- Farina — Tier B — pre-placed (captured Side Ch2A). Combined effect with Priscilla adds STO-RES decay pressure to specific zones.

**Petrifications:**
- Vanessa — S (guaranteed if `vanessa_lost_ch1` = false) — Tier B. If `vanessa_lost_ch1` = true, this scripted slot defaults to a named NPC scout from Eirika's escort (Tier B, name TBD at Ch4 design time). If any optional named character from Ch1–Ch3 is still in the active roster at Ch4, they fill this scripted slot instead of the NPC — their loss is more meaningful than a placeholder.
- Nino — S — Tier A. Both arms extended, full casting posture; tome burns through from inside before the Gaze even reaches her.
- Florina — O — Tier A. Off-balance, stumbled; pegasus fled before she was hit.

**Defeat scene:** Eirika (game over). Aerial Gorgon overhead; The Hand observes from a distance and approaches after.

**Flags in:** `vanessa_lost_ch1`

**Flags out:** `vanessa_lost` (universal flag covering Ch1 or Ch4 path), `nino_lost`, `florina_lost`

---

### Ch5 — Last Out

| | |
|---|---|
| **Setting** | Border crossing — rearguard action before temporary safety |
| **Map type** | Escape |
| **Enemy composition** | Heavy assault: Great Gorgons (first appearance — area GAZE), Stone Wardens, Dark Witches, Petrified Constructs |
| **Playable units** | Eirika's group + Lyn's group (combined for the first time on the same map) |

**Mechanics introduced:**
- Great Gorgon: slow, but GAZE hits a 2-tile area. Anyone adjacent to the target also takes STO-RES damage. Forces unit spacing decisions.
- Dark Witch: ranged dark magic + 2-tile secondary GAZE. Magic-attacking threat in addition to STO-RES damage.
- Multiple scripted losses in one chapter — the player knows some will not make it.
- Named captured statues deployed as tactical installations on the battlefield (not just environmental placement — the enemy has brought their collection to the front line deliberately).

**Statue installations (chapter start):**
- Priscilla — Tier B — re-deployed on this map (captured Side Ch2A, now placed at a chokepoint). The player must pass through her aura to reach the escape route.
- Farina — Tier B — same. Both are placed to make the escape corridor actively costly.
- Additional NPC constructs from prior chapter conversions populate secondary routes.

**Petrifications:**
- Amelia — S — Tier B. Full charging posture, lance crumbles along the haft. (Eirika's group.)
- Juno — S — Tier B. *(Moved from Ch16 — she is an Elibe flier caught in the Ch5 corridor crossing. Her Ch16 entry no longer applies.)* Formation-leader posture, arms close, compact. Aura: no unique effect.

**Note on Priscilla and Farina Ch5 revision:** Their original Ch5 scripted entries are retired. They were captured in Side Ch2A. Their Ch5 presence is as map installations (PETRIFIED_CAPTURED, aura active), not as fresh petrifications. This is the first chapter where the player fights through the aura of characters who were lost two chapters ago.

**Defeat scene:** Eirika (game over, Ch1–5 Eirika viewpoint) or Lyn (lord defeat) depending on which lord is defeated. If both fall simultaneously (unlikely but possible), Eirika takes precedence — game over.

**Flags in:** `vanessa_lost`, `nino_lost`, `florina_lost`, `priscilla_lost`, `farina_lost`

**Flags out:** `amelia_lost`, `juno_lost`

---

## Act 2 — Lilina's Disaster
*Chapters 6–9. Elibe Central (Lilina's group). No PETRIFIED_SAFE. Morrha's Dark Veil suppresses light and anima magic across all Act 2 maps. Enemy deploys named captured statues from Act 1 as map installations throughout this act.*

---

### Ch6 — Into the Veil

| | |
|---|---|
| **Setting** | Elibe Central — edge of Morrha's territory, first contact with the Dark Veil |
| **Map type** | Escape or Rout — TBD |
| **Enemy composition** | Morrha's Gorgons (heavier variant), Stone Wardens, Dark Witches |
| **Playable units** | Lilina's group — Lilina, Wendy, Clarine, Larum, Sue, Shanna, Dorothy, Thea, Elen, Cath, Sophia (first appearance of the full group) |

**Mechanics introduced:**
- Dark Veil: passive map mechanic present on all Act 2 maps. Light magic and anima magic deal 0 damage (spell uses are still consumed; staves still function for healing). Dark magic is unaffected.
- Lilina's group as the third protagonist roster.
- Morrha introduced as a non-combat presence — she is felt but not fought. Her Stone Wardens are notably larger and more petrified than the Act 1 variants.
- Named Act 1 statues deployed: Natasha — Tier A — pre-placed in Morrha's forward installation. Eirika's group recognises her name through journals or markings found on the map (establishing cross-group emotional connection).

**Statue installations (chapter start):**
- Natasha — Tier A — pre-placed. Enemy has deployed her from their Act 1 acquisitions.

**Petrifications:**
- Shanna — S — Tier B. Caught mid-pivot, half-turned, javelin arm already moving. Full inspection beat in compendium.
- Echidna — O — Tier B. *(Moved from Ch14 — she is an Elibe resistance fighter, encountered during the first Veil crossing. Her Ch14 entry no longer applies.)* Wide stance, calm expression; haft of axe survives in one hand. Aura: no unique effect.

**Defeat scene:** Lilina (lord defeat entry, game-design.md). Morrha observes from a distance, does not approach immediately. One of her Collectors handles the inspection. Morrha's indifference to the individual is total — she notes the count, not the person.

**Flags out:** `shanna_lost`, `echidna_lost`

---

### Ch7 — The Mass Petrification

| | |
|---|---|
| **Setting** | Central Elibe — Morrha's full encirclement closes; the fog deploys for the first time |
| **Map type** | Escape (east edge) — Lilina barely makes it |
| **Enemy composition** | Three-direction assault: Stone Wardens and Gorgons from north and south; Petrification Cavaliers from west advancing behind the fog |
| **Playable units** | Lilina's group (depleted from Ch6) |

**Mechanics introduced:**
- Petrifying Fog (first full deployment): advances from the west, 2 tiles/turn. Morrha deploys it to herd the player east into the encirclement kill zone. NPCs in the fog path petrify visibly. The fog is Morrha's primary weapon at scale — the enemy ground forces are secondary, corralling what the fog flushes out.
- Three-front pressure: enemies approach from north, south, and west simultaneously. The fog adds a fourth pressure axis (time).
- Mass petrification event: the chapter is designed so that even optimal play results in 2–3 losses. The player cannot save everyone. This is intentional and communicated through the chapter's pacing.
- Cath optional: if Cath is petrified here, Side Ch8A is skipped entirely (no infiltration chapter — there is no infiltrator left). This is a meaningful player choice with permanent narrative consequence.

**Statue installations (chapter start):**
- Syrene — Tier B — pre-placed on the eastern escape corridor (enemy placed her to debuff the exit route specifically).
- Serra — Tier A — pre-placed at a northern chokepoint (if `serra_lost` = true). Enemy is actively using the Act 1 collection on this map.

**Petrifications:**
- Wendy — S — Tier B. Full defensive stance, shield planted. Compendium entry.
- Clarine — S — Tier B. Mid-command, arm extended pointing, mouth open. Compendium entry.
- Larum — O — Tier B. Dancer, mid-turn, arms in a reach toward someone.
- Sue — O — Tier B. Archer's crouch, low draw, compact form.
- Cath — O — Tier B. If petrified here: sprint posture, right hand closed around nothing. **Side Ch8A is skipped if Cath is lost here.**

**Defeat scene:** Lilina (lord defeat entry). Morrha approaches this time. She comments on the count — this chapter adds substantially to the collection in a short window, which she notes with satisfaction. No mockery; pure accounting.

**Flags in:** `syrene_lost_ch1`, `serra_lost` (for pre-placed statue logic)

**Flags out:** `wendy_lost`, `clarine_lost`, `larum_lost`, `sue_lost`, `cath_lost`

---

### Side Ch7A — The Foreseen

| | |
|---|---|
| **Setting** | Sophia's vision — single map, dreamlike |
| **Map type** | Survive N turns or scripted end condition |
| **Playable units** | Sophia and Lilina only (vision participants) |

**Mechanics introduced:**
- Vision / flashforward: player sees Ch12's map layout and Sophia's scripted petrification. Lilina does not fully believe it. Sophia does not try to prevent it — she's describing what she has seen, not asking for help.

**Notes:**
- This chapter must be designed and implemented alongside Ch12. The map shown here must match Ch12's map exactly.
- Sophia's petrification posture shown in the vision must match the petrification-compendium.md Sophia entry.
- No petrifications occur (vision, not real events).

**Defeat scene:** N/A — no defeat condition (vision chapter).

---

### Side Ch8A — The Collection
*(Only accessible if `cath_lost` = false — Cath survived Ch7)*

| | |
|---|---|
| **Setting** | Morrha's gallery — Cath infiltrates alone to gather intelligence |
| **Map type** | Infiltration / stealth — Cath alone, cannot engage enemies, must avoid detection |
| **Playable units** | Cath (solo) |

**Mechanics introduced:**
- Enemy gallery view: all named statues collected so far are present, lit and arranged. The player can examine each one (interaction prompt). This is the emotional gut-punch chapter — makes every prior loss visible and permanent in one space.
- Inspection log: each statue the player examines shows the collector's assessment (compendium entries). Cath's internal reaction to seeing familiar names is the emotional content.

**Petrifications:**
- Cath — S — Tier B. Scripted: she is ambushed while escaping with the intelligence. Sprint posture, right hand closed around what she was carrying. Compendium entry. Her capture means the intelligence is lost.

**Gallery contents:** Determined by all `_lost` flags from Ch1–Ch7. Every named character lost in prior chapters is present. If few characters have been lost, the gallery is sparse (which reads as the enemy being hungry for more). If many have been lost, the gallery is full — which reads as the scope of the defeat.

**Defeat scene:** N/A — Cath's capture IS the chapter's scripted ending, not a defeat condition. The chapter ends with her capture regardless of stealth success or failure.

**Flags in:** All prior `_lost` flags (gallery population). `cath_lost` must = false or chapter is skipped.

**Flags out:** `cath_lost` (set to true on chapter completion regardless of stealth outcome)

---

### Ch8 — The Rout

| | |
|---|---|
| **Setting** | Elibe Central — Ch7 survivors scattered, hunted in fragments |
| **Map type** | Fragmented rout — multiple isolated unit clusters, player manages them separately |
| **Enemy composition** | Gorgon pursuit squads (Standard and Aerial), Gaze Hunters picking off stragglers |
| **Playable units** | Lilina's group Ch7 survivors (Lilina + whoever survived) |

**Mechanics introduced:**
- Fragmented map: player units begin in separate clusters, separated by enemy units. Must consolidate while being hunted. This is the first map where not all player units begin adjacent or in formation.
- Gaze Hunters as primary threat: this chapter demonstrates ranged STO-RES pressure — units can be decayed without direct combat engagement.

**Statue installations (chapter start):**
- Wendy — Tier B — pre-placed at a corridor (just captured in Ch7, already deployed). Enemy moves fast.
- Clarine — Tier B — pre-placed at a secondary route.
- Combined: player routes through two Tier B aura zones before groups can consolidate.

**Petrifications:**
- Dorothy — O — Tier B. Close-range draw, adapted form, solving a problem at the wrong moment.
- Thea — O — Tier B. Mid-bank, airborne without the pegasus; floating figure.
- Elen — O — Tier B. Holding both halves of her broken staff, still assessing.
- Igrene — O — Tier B. *(Moved from Ch15 — she is an Elibe tracker, encountered fleeing from the Ch7 disaster zone.)* Kneeling draw, scanning multiple targets. Aura: no unique effect.
- Fir — O — Tier B. *(Moved from Ch14 — she is an Elibe swordswoman caught in the rout.)* Clean single-hand form, relaxed grip. Aura: enemy myrmidons +5 speed in radius.

**Defeat scene:** Lilina (lord defeat entry). Scattered defeat — the inspector notes the fragmented postures, each one isolated, none covering the others.

**Flags out:** `dorothy_lost`, `thea_lost`, `elen_lost`, `igrene_lost`, `fir_lost`

---

### Ch9 — Collapse

| | |
|---|---|
| **Setting** | Lilina's stronghold — final fall |
| **Map type** | Survive until escape route opens, or Boss kill — Lilina escapes but the stronghold is taken |
| **Enemy composition** | Morrha's elite: Great Gorgons, Stone Wardens (veteran, higher stats), Dark Witches, The Hand (present as appraiser) |
| **Playable units** | Lilina's group (remaining) |

**Mechanics introduced:**
- Political captures: Cecilia and Guinivere are taken as deliberate strategic acquisitions, not incidental combat losses. Morrha wants them specifically — their auras affect enemy command units, suggesting the enemy has tactical interest in the aura effects they produce.
- Three scripted Tier A captures in one chapter — the highest single-chapter named character loss count so far.
- The Hand present and active during the chapter: he is an on-map named unit who moves toward petrified characters and inspects them in real time during the player's turn. He cannot be attacked. Watching him work during gameplay is its own horror.

**Statue installations (chapter start):**
- Multiple prior captures pre-placed throughout the stronghold (Morrha has already moved her collection inside). Specific characters depending on `_lost` flags. Minimum two Tier B sources active at chapter start.

**Petrifications:**
- Cecilia — S — Tier A. General's bearing; tome fragments still in the left hand. Compendium entry.
- Guinivere — S — Tier A. Royalty composure; she does not look away. Compendium entry.
- Tethys — S — Tier A. Dancer's posture; mid-performance, arms raised. Compendium entry.

**Defeat scene:** Lilina (lord defeat entry). The Hand performs the inspection. Morrha does not appear — the stronghold falling is routine to her. The Hand notes the three Tier A acquisitions from this chapter with particular care.

**Flags in:** All prior `_lost` flags (stronghold statue population)

**Flags out:** `cecilia_lost`, `guinivere_lost`, `tethys_lost`

---

## Act 3 — Convergence & First Rescues
*Chapters 10–13. Elibe. PETRIFIED_SAFE now available — killing the Collector before it reaches a petrified ally prevents capture. First Sunstone Shards available late Ch13.*

---

### Ch10 — The Meeting That Wasn't

| | |
|---|---|
| **Setting** | Elibe — Eirika's and Lyn's groups converge at an agreed point |
| **Map type** | TBD |
| **Enemy composition** | Standard Gorgons, Collectors (first appearance as targetable units), Stone Wardens |
| **Playable units** | Eirika's group + Lyn's group (combined); Lilina's survivors begin joining |

**Mechanics introduced:**
- Collector as targetable enemy unit: appears on-map, moves toward petrified player units. Killing it before it reaches a petrified unit sends that unit to PETRIFIED_SAFE instead of PETRIFIED_CAPTURED. First chapter where the player can mechanically prevent capture.
- Three-group convergence: Lilina's Act 2 survivors join the combined roster. This is the largest available roster, but it shrinks quickly.
- Recapture: Tana (if she survived Ch1) is scripted-captured here. Even characters who were saved can be lost. The game takes back what the player fought to keep.

**Statue installations (chapter start):**
- Nino — Tier A — pre-placed. Both arms extended, casting posture. Player units from Lyn's group recognise her.
- Amelia — Tier B — pre-placed. Charging posture. Eirika's group units recognise her.

**Petrifications:**
- Tana — S — Tier A. Scripted recapture (or first capture if `tana_lost_ch1` = true, in which case a different named unit fills the scripted loss slot — TBD). Mid-step, frustration in the expression; she almost made it.

**Defeat scene:** Eirika (game over, if Eirika falls) or Lyn (lord defeat). The inspector notes the recaptured Tana: "she was recovered once. That posture — still in motion — I thought we'd see more of these eventually."

**Flags in:** `tana_lost_ch1` (affects dialogue; does not prevent the scripted loss from firing)

**Flags out:** `tana_lost` (universal — covers Ch1 or Ch10 capture path)

---

### Ch11 — Debris

| | |
|---|---|
| **Setting** | Elibe — regrouping zone, limited advance toward Morrha's territory |
| **Map type** | TBD |
| **Enemy composition** | Morrha's pursuing forces: Gaze Hunters, Petrification Cavaliers, secondary fog deployment (partial — fog occupies one quadrant of the map) |
| **Playable units** | All surviving units from all three groups |

**Mechanics introduced:**
- Sunstone Shard concept: a scholar NPC explains that Sunstone Shards exist and could in theory reverse petrification. No shards available yet. Sets up the Act 3 restoration mechanic without making prior losses feel reversible.
- Secondary fog encounter: fog occupies the northern quadrant. Smaller scale than Ch7; functions as a routing constraint rather than a chapter-defining mechanic. Forces the player to route south while enemies push from the west.
- Full combined roster: the player manages the largest available unit pool in the game. It will not stay this large.

**Statue installations (chapter start):**
- Determined by prior `_lost` flags. Enemy deploys relevant statues to key chokepoints. Minimum one Tier A source active.

**Petrifications:**
- No scripted losses this chapter. One optional slot available:
- Optional slot: defaults to a named NPC from the convergence zone (Tier B, name TBD at Ch11 design time). If any optional named character who survived Act 1–2 is still in the active roster and has not been captured, they fill this slot instead of the NPC.

**Defeat scene:** Eirika or Lyn (whichever is the primary viewpoint for this chapter — TBD). Inspector: one of Morrha's senior Collectors. Comments on the regrouped formation — "they assembled again. The collection assembled first. There is a lesson in the timing."

**Flags out:** None new from scripted losses.

---

### Ch12 — The Prophet Was Right

| | |
|---|---|
| **Setting** | Elibe — the location Sophia described in her vision, exactly |
| **Map type** | Must match the map shown in Side Ch7A |
| **Enemy composition** | Morrha's forces, same composition as Sophia's vision |
| **Playable units** | All surviving units |

**Mechanics introduced:**
- Vision payoff: every map detail matches Side Ch7A exactly. If the player remembers the vision, they know what is coming. It happens anyway.
- Sophia's aura is specifically dangerous for the player: STO-RES decay 1 extra/turn per unit in radius, stacking with all existing sources. Having multiple aura sources active in the same area as Sophia becomes very rapidly lethal.

**Design note:** Ch12 and Side Ch7A must be designed together or Ch12 must be finalized before Side Ch7A is implemented. The vision is a preview, not a variation.

**Statue installations (chapter start):**
- Determined by prior flags. At least one significant installation chosen to echo what was shown in the vision.

**Petrifications:**
- Sophia — S — Tier A. She is looking at something to the side when the Gaze reaches her — not at the threat. She was watching something that mattered more. Compendium entry. Her STO-RES decay aura activates immediately on capture.

**Defeat scene:** Eirika or Lyn. The inspector examines Sophia last, after the others. Notes the sight line: "She wasn't looking at us. She was looking at something she'd already seen. I wonder if she found it."

**Flags out:** `sophia_lost`

---

### Ch13 — The Stronghold Below

| | |
|---|---|
| **Setting** | Morrha's base — direct raid |
| **Map type** | Boss (Morrha) + Escape — the player reaches Morrha but cannot kill her; the confrontation ends in her irreversible self-petrification |
| **Enemy composition** | Morrha's elite: veteran Stone Wardens, multiple Great Gorgons, Dark Witches, Collectors, The Hand (present as a named on-map unit) |
| **Playable units** | All surviving units |

**Mechanics introduced:**
- Morrha's irreversible self-petrification (cutscene): the curse consuming its source. Not caused by the player. Not reversible by Sunstone Shards. She remains where she stood. Her aura continues permanently.
- Morrha's special aura (permanent installation, not moved): STO-RES decay 5/turn in 3-tile radius at her final position. Overrides all tier interactions. This location remains on the game's map in subsequent chapters and is always active.
- First Sunstone Shards available: rewarded at Ch13 completion (or found during the chapter). The player must choose who to restore first — the choice is permanent.
- The Hand as a combat-adjacent unit: still cannot be attacked directly, but gives orders that affect nearby enemy unit behavior (buffs). Represents a meaningful tactical consideration.

**Statue installations (chapter start):**
- Multiple high-tier installations from the full collection populate the base. The most important characters lost in prior chapters are displayed in prominent positions. Cecilia and Guinivere visible in the command room (Tier A auras stacking in the approach corridor).

**Petrifications:**
- Marisa — O — Tier A. Low carry, both hands, pre-strike posture; perpetually deciding. Aura: enemy units +10 critical in radius.
- Isadora — O — Tier B. Knight on foot, formal stance; trained posture without the mount. No unique aura.
- Morrha — S (irreversible, cutscene) — Special aura. Permanent installation at her final position.

**Defeat scene:** Eirika or Lyn. Unusually — if the player reaches this defeat condition, The Hand delivers the defeat speech. Morrha is already beginning to petrify in the background during it. "She chose her position and she held it. So did you — all the way here, then all the way down."

**Flags in:** All prior `_lost` flags (base gallery population)

**Flags out:** `marisa_lost`, `isadora_lost`

---

## Act 4 — The Push
*Chapters 14–18. Toward the Queen's fortress. Morrha's special aura is permanently active at her Ch13 position (relevant to any map near that location). Pedestal mechanic: captured statues are architectural features of these maps, not temporary placements. PETRIFIED_SAFE available.*

*Note: The combined roster is significantly smaller by Act 4. Optional petrifications are fewer per chapter — most of the roster's optional characters have already been captured or are already statues installed on these maps.*

---

### Ch14 — Through the Galleries

| | |
|---|---|
| **Setting** | Enemy-held galleries and corridors — the collection is the architecture |
| **Map type** | Escape or Seize |
| **Enemy composition** | Stone Wardens (elite variant), Collectors (multiple, targetable), Aerial Gorgons, Gaze Hunters |
| **Playable units** | All Act 3 survivors |

**Mechanics introduced:**
- Pedestal mechanic: named captured characters from prior chapters are permanent map installations in the gallery rooms. Their auras are part of the map's terrain design — there are no aura-free paths, only more or less costly ones.
- Gallery as map: the player is fighting through the enemy's collection. The captured characters line the corridors. The enemy placed them there deliberately.
- Sunstone Shards usable: if the player has shards from Ch13, they can restore one character before this chapter (chapter selector canonical state will assume one restoration has been made).

**Statue installations (chapter start):**
- Gallery-specific: multiple named captures arranged as permanent installations. Specific characters depend on prior `_lost` flags. Map design must account for worst-case scenario (many losses = many active auras = very oppressive gallery routing) and best-case scenario (few losses = sparser gallery, easier routing — rewarding skilled play).
- Minimum active auras: three Tier B sources, one Tier A source, regardless of prior flags. Unnamed NPC constructs fill gaps if the player has few named losses.

**Petrifications:**
- Karla — O — Tier B. *(Moved from Ch16 — she is an Elibe swordswoman who joins the push and is lost here rather than two chapters later.)* Near-sheathe posture; she thought the immediate threat was handled. Aura: no unique effect.

**Defeat scene:** Eirika, Lyn, or Lilina depending on viewpoint. The inspector — a senior gallery Curator, not The Hand — notes the addition to the collection. "She joins her predecessors. The gallery grows."

**Flags out:** `karla_lost`

---

### Ch15 — The Commander's Hall

| | |
|---|---|
| **Setting** | Queen's outer fortress — commander-level halls |
| **Map type** | Seize or Boss |
| **Enemy composition** | Commander-class enemies, Aerial Gorgons, veteran Stone Wardens, Dark Witches |
| **Playable units** | Act 4 survivors |

**Mechanics introduced:**
- Aura stacking at high density: this chapter is designed to have 4–5 active aura sources simultaneously. By this point, routing through the map without entering any aura radius is impossible — the question is which auras the player can minimize exposure to.

**Statue installations (chapter start):**
- Heavy installation: the Commander's Hall has prior named captures displayed in formal positions. Cecilia and Guinivere (if lost Ch9) appear in commanding positions appropriate to their status. The enemy curated the display deliberately.

**Petrifications:**
- Fiora — O — Tier A. Mid-air, pointing; still directing someone even without the mount or the weapon. Aura: flying enemies act twice per enemy phase.
- L'Arachel — O — Tier A. Full declaration posture; head back, arm raised. She believed right up until the instant it stopped. Aura: divine weapons −2 damage in radius.

**Defeat scene:** Eirika, Lyn, or Lilina. The inspector is a named Commander-class officer of the Queen's guard (name TBD). The defeat speech reflects the military context — the inspector is a strategist, not a curator. Different voice from prior inspectors.

**Flags out:** `fiora_lost`, `larachel_lost`

---

### Ch16 — The Long Hall

| | |
|---|---|
| **Setting** | Final approach corridor to the Queen's inner sanctum — the longest single map |
| **Map type** | Escape or Seize — attrition design |
| **Enemy composition** | Mixed elite: veteran Stone Wardens, Great Gorgons, Dark Witches, Petrification Cavaliers, Collectors |
| **Playable units** | Act 4 survivors (roster is small now) |

**Mechanics introduced:**
- Attrition map: long corridor, persistent aura density, enemy reinforcement waves every 2–3 turns. The map is designed to deplete STO-RES reserves before the final two chapters. Moving fast is the only defense.

**Statue installations (chapter start):**
- The approach to the Queen's inner sanctum is lined with the collection's most significant pieces. Ninian (if not yet in play) is absent — she is reserved for Ch17. Other high-tier captures fill the corridor.

**Petrifications:**
- Lute — O — Tier A. Full-output cast, both palms forward; tome detonated rather than crumbled. Stone pages scattered in a radius around the base — they are part of the piece. Aura: enemy mages +3 magic in radius.
- Louise — O — Tier B. *(Moved from Ch17 — she joins the push in Act 4 and is lost here rather than in the Trophy Room.)* Perfect standing draw, form immaculate; she held it until she couldn't. Aura: no unique effect.

**Defeat scene:** The combined roster is small enough that a complete defeat here feels final. Inspector: a senior Queen's officer. Tone: quiet. "They made it this far. Note the route they chose."

**Flags out:** `lute_lost`, `louise_lost`

---

### Ch17 — The Trophy Room

| | |
|---|---|
| **Setting** | Queen's inner sanctum — the primary collection display |
| **Map type** | Boss or Survive — Queen's personal guard defends the room |
| **Enemy composition** | Queen's personal guard (elite all types), with specific targeting orders for Ninian and Fae |
| **Playable units** | Act 4 survivors (very small roster) |

**Mechanics introduced:**
- Tier S aura (Ninian): the most powerful aura in the game. All prior auras remain active — stacking with Tier S makes specific map sections potentially impassable without specific unit routing.
- The enemy specifically targets Ninian and Fae: they are the Queen's priority acquisitions for this room. The player may be forced to choose who to protect.
- Trophy room aesthetic: the room is designed as the collection's centerpiece. Named captured characters are arranged at their best — elevated, well-lit, given space. The player fights through the full weight of the game's prior losses to reach the final chapter.

**Statue installations (chapter start):**
- All significant named captures from the full game populate this room. The map design must account for the variable aura density based on `_lost` flags. Minimum active auras from non-optional scripted captures: Natasha (A), Serra (A), Nino (A), Cecilia (A), Guinivere (A), Tethys (A), Sophia (A), Morrha (Special — if the room is near her position), Ninian (S — immediately after her capture).

**Petrifications:**
- Fae — O — Tier A. Confused, arms slightly raised, head turned; she doesn't understand why this is happening. Aura: player dragon units cannot transform in radius.
- Ninian — S — Tier S. Dancer's posture, grief in the expression; she was looking at someone when the stone took her. She knew, and she danced anyway. Compendium entry. The room's centerpiece. Tier S aura activates immediately.

**Defeat scene:** Eirika, Lyn, or Lilina. The inspector — the Queen herself, or a direct representative — delivers the defeat speech. This is the only chapter defeat where the final antagonist may speak directly.

**Flags out:** `fae_lost`, `ninian_lost`

---

### Ch18 — Inevitable Eternity

| | |
|---|---|
| **Setting** | Queen's throne / final chamber |
| **Map type** | Boss (Queen) |
| **Enemy composition** | Queen + elite personal guard. Active auras from all installed captures. |
| **Playable units** | All surviving units (roster likely 4–6 units at most) |

**Mechanics introduced:**
- Optional Myrrh rescue path: a side route allows a small squad to reach Myrrh before the Queen's guard can secure her. Not required to complete the chapter but affects ending.
- The final chamber is built around the collection. Whatever the player has lost, it lines the walls. The aura density on this map is determined entirely by the game's prior history.

**Statue installations (chapter start):**
- All prior named captures present. Ninian is the room's centerpiece (Tier S). Morrha's special aura may reach this location (map proximity TBD). The floor of the final chamber is determined by every decision the player made across the prior 17 chapters.

**Petrifications:**
- Myrrh — O — Tier A. If not rescued: appears as an installation in a side alcove of the throne room. Hands closed around the absent dragonstone; expression unreadable, as if sleeping. Aura: divine suppression AoE (exact effect TBD).

**Defeat scene:** If all players are defeated here, the Queen delivers the final inspection speech herself. Eirika, Lyn, and/or Lilina — whoever the survivors were. "You came all the way here. I have been waiting for you."

**Ending notes:**
- The ending varies by how many named characters the player retained. More survivors = more options in the final confrontation.
- The restoration arc (Sunstone Shards earned in Act 3–4) determines who can be brought back before the credits.
- Myrrh's rescue affects which ending variant plays.

**Flags in:** All prior `_lost` flags.

---

## Appendix A — Petrification Schedule (Updated)

*Type key: S = scripted, O = optional. Aura tier reflects revised system.*
*Characters marked ‡ have had their chapter assignment revised from game-design.md.*

| # | Character | Group | Chapter | Type | Aura Tier | Notes |
|---|-----------|-------|---------|------|-----------|-------|
| 1 | Gate Guards ×2 | NPC | Ch1 | S | — | Decorative only; no unique aura |
| 2 | Vanessa | Eirika | Ch1 / Ch4 | O / S | B | Guaranteed Ch4 if not Ch1 |
| 3 | Syrene | Eirika | Ch1 | O | B | Not guaranteed in Ch4; she is simply gone if saved |
| 4 | Tana | Eirika | Ch1 / Ch10 | O / S | A | Recaptured Ch10 if she survived Ch1 |
| 5 | Natasha | Eirika | Ch2 | S | A | Opening sequence; healer inversion aura |
| 6 | Priscilla | Lyn | **Side Ch2A** ‡ | S | B | Moved from Ch5; cavalry terrain ignore aura |
| 7 | Farina | Lyn | **Side Ch2A** ‡ | S | B | Moved from Ch5; flying enemies +1 move aura |
| 8 | Serra | Lyn | Ch3 | S | A | "No cure" discovery already fired in 2A; healer inversion stacks with Natasha |
| 9 | Rebecca | Lyn | Ch3 | O | B | — |
| 10 | Neimi | Eirika | **Ch3** ‡ | O | B | Moved from Ch11; straggler from Eirika's route |
| 11 | Nino | Lyn | Ch4 | S | A | Full casting posture; enemy mages +2 magic aura |
| 12 | Florina | Lyn | Ch4 | O | A | Off-balance stumble; flying enemies +1 move aura |
| 13 | Amelia | Eirika | Ch5 | S | B | Charging posture; enemies +1 all stats aura |
| 14 | Juno | Eirika/Elibe | **Ch5** ‡ | S | B | Moved from Ch16; formation-lead posture |
| 15 | Shanna | Lilina | Ch6 | S | B | Half-pivot, mid-turn |
| 16 | Echidna | Lilina | **Ch6** ‡ | O | B | Moved from Ch14; Elibe resistance fighter |
| 17 | Wendy | Lilina | Ch7 | S | B | Defensive stance; enemies +2 defense aura |
| 18 | Clarine | Lilina | Ch7 | S | B | Mid-command; player units lose 1 RES/turn aura |
| 19 | Larum | Lilina | Ch7 | O | B | Dancer, mid-turn |
| 20 | Sue | Lilina | Ch7 | O | B | Archer's crouch |
| 21 | Cath | Lilina | Ch7 (O) / **Side Ch8A** (S) | O/S | B | Ch7 optional; if not Ch7, Side Ch8A scripted. Side Ch8A skipped if Ch7 |
| 22 | Dorothy | Lilina | Ch8 | O | B | Enemy archers +1 range aura |
| 23 | Thea | Lilina | Ch8 | O | B | All enemies +5 avoid aura |
| 24 | Elen | Lilina | Ch8 | O | B | — |
| 25 | Igrene | Lilina | **Ch8** ‡ | O | B | Moved from Ch15; Elibe tracker in the rout |
| 26 | Fir | Lilina | **Ch8** ‡ | O | B | Moved from Ch14; Elibe swordswoman in the rout; enemy myrmidons +5 speed aura |
| 27 | Cecilia | Lilina | Ch9 | S | A | General's bearing; enemy generals/paladins +1 move aura |
| 28 | Guinivere | Lilina | Ch9 | S | A | Royal composure; enemy bosses +3 stats aura |
| 29 | Tethys | Lilina | Ch9 | S | A | Performance posture |
| 30 | Tana (2nd) | Eirika | Ch10 | S | A | Recaptured; mid-step, frustration |
| 31 | Sophia | Lilina | Ch12 | S | A | Player STO-RES decay +1/turn aura |
| 32 | Marisa | Eirika | Ch13 | O | A | Pre-strike posture; enemy units +10 crit aura |
| 33 | Isadora | Lilina | Ch13 | O | B | Knight on foot, formal stance |
| 34 | Morrha | Enemy | Ch13 | S (irreversible) | Special | STO-RES decay 5/turn, permanent, 3-tile radius |
| 35 | Karla | Elibe | **Ch14** ‡ | O | B | Moved from Ch16; near-sheathe posture |
| 36 | Fiora | Lyn | Ch15 | O | A | Mid-air, pointing; flying enemies act twice aura |
| 37 | L'Arachel | Eirika | Ch15 | O | A | Declaration posture; divine weapons −2 damage aura |
| 38 | Lute | Eirika | Ch16 | O | A | Tome detonated; enemy mages +3 magic aura |
| 39 | Louise | Lyn | **Ch16** ‡ | O | B | Moved from Ch17; perfect draw form |
| 40 | Fae | Lilina | Ch17 | O | A | Confused, small; player dragons cannot transform aura |
| 41 | Ninian | Lyn | Ch17 | S | S | Dancer's grief; enemies in 3-tile sub-radius act twice |
| 42 | Myrrh | Eirika | Ch18 | O | A | Sleeping expression; divine suppression AoE |
| — | Eirika | — | Any | G | S | Game over |
| — | Lyn | — | Any | not G | S | Tier S aura; Serra/Florina ongoing penalties |
| — | Lilina | — | Any | not G | S | Morrha aura +2 tiles; enemies +2 stats next chapter |

---

## Appendix B — Resolved Inconsistencies

All four inconsistencies from the prior version of this document are resolved. No open inconsistencies remain as of this revision.

| # | Original conflict | Resolution |
|---|-------------------|------------|
| 1 | Priscilla/Farina listed as Ch5 scripted but Side Ch2A says they fall there | Moved to Side Ch2A scripted. No PETRIFIED_SAFE in Act 1 means they cannot rejoin. Ch5 gains their statues as map installations (aura-active) rather than fresh petrification events. |
| 2 | Cath listed as Ch7 optional AND Side Ch8A scripted | Both are correct and conditional. If Cath is petrified in Ch7, Side Ch8A is skipped entirely. If she survives Ch7, Side Ch8A fires and she is captured there. |
| 3 | Side Ch7A must match Ch12 but neither chapter was implemented | Design constraint noted in both chapter entries. Must be implemented together. |
| 4 | Vanessa's Ch4 scripted slot unfilled if she was already lost in Ch1 | Defaults to a named NPC scout (Tier B, TBD at Ch4 design). If a named optional character from Ch1–Ch3 is still active in the roster, they fill the slot instead of the NPC. Same rule applies to Ch11's optional slot. |

---

## Appendix C — Enemy Unit Type Reference

| Unit type | Move | Weapon | Special | Weakness | First appears |
|-----------|------|--------|---------|----------|---------------|
| Standard Gorgon | 5 | GAZE (STO-RES damage, 1–2 range) | — | Magic | Ch1 |
| Aerial Gorgon | 7 (fly) | GAZE (1–2 range) | Flying; cannot be counterattacked by ground units without bow/magic | Thunder magic | Ch4 |
| Great Gorgon | 3 | GAZE (1–2 tile area) | Area GAZE hits adjacent units too | Magic (heavy) | Ch5 |
| Stone Warden | 4 | Fist (GAZE effect on melee contact, STO-RES −1/hit) | High DEF, partial petrification = physical damage reduction | Magic | Ch1 |
| Gaze Hunter | 6 | Partial-GAZE crossbow (STO-RES damage only, no HP, 2–3 range) | Prioritises low-STO-RES targets; fragile | Physical at close range | Ch3 |
| Petrified Construct | 4 | Fist (HP damage only) | Immune to GAZE and all petrification effects; immune to STO-RES damage; leaves static statue on map after defeat | Magic | Ch3 |
| Collector | 8 | None | In Act 3+: reaches petrified player unit to convert SAFE to CAPTURED; killing Collector before it arrives prevents conversion | Any (fragile) | Ch10 (targetable); Acts 1–2 (scripted only) |
| Dark Witch | 5 | Dark magic (primary); GAZE (secondary, 1–2 range, STO-RES damage) | Ranged STO-RES pressure in addition to HP damage | Light magic (0 damage in Act 2 due to Dark Veil; physical otherwise) | Ch2 |
| Petrification Cavalier | 8 (mount) | Gaze-lance (HP damage + STO-RES −2 on hit) | Cavalry movement; combines physical and STO-RES threat | Anti-cavalry | Ch4 |
| The Hand | 6 | None | Non-combat; cannot be attacked; buffs adjacent enemies; inspects newly petrified units in real time on map | — | Ch1 |
