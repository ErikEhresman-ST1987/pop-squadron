# Pop Squadron — Power-Ups and Environmental Obstacles v1.0

**Status:** Design reference — approved principles, implementation pending  
**Project:** Pop Squadron (Jet-Pack Jim is the playable character)  
**Created:** 2026-10-21  
**Scope:** Optional power-up pickups and occasional navigation obstacles in the 100-mission campaign

## 1. Purpose

Add selective variety, risk/reward decisions, and navigation skill to harder missions without making every mission crowded or complicated. These systems are **not** required on every level. Preserve the approved free-movement, simultaneous two-thumb movement and dedicated tap-to-FIRE controls.

This document records decisions from design discussion. Sections explicitly marked **Proposed** are ideas to evaluate, **not** approved specifications.

## 2. Approved decisions — helium-cloud power-ups

1. Some balloons **may randomly release a cloud when popped**, but only in **selected harder missions** where the feature is enabled.
2. Clouds are **positive collectible power-ups**, **not cash bonuses**.
3. Jim collects a cloud by **moving through it before it dissipates**.
4. **Players must be able to identify the specific power-up before collecting the cloud.** The reward cannot be an unidentified surprise.
5. The exact power-up types, effects, durations, cloud lifetimes, probabilities, and eligible missions are **not yet decided**.
6. Clouds should be **occasional**, not a universal or constant gameplay feature.

### Proposed visual language — not yet approved

- Common cloud silhouette or helium/gas motif, with a distinct **symbol** for each power-up and optionally a distinct **color**.
- Do not rely on color alone for identification.
- Make collectible clouds visually distinguishable from balloons, hostile boss projectiles, and background effects.
- Maintain readability at actual iPhone gameplay scale.

### Candidate effects — not yet approved

| Candidate | Possible effect | Decision status |
| --- | --- | --- |
| Helium Shield | Absorb one hit | Proposed only |
| Rapid Fire | Temporarily shorten weapon cooldowns | Proposed only |
| Turbo Boost | Temporarily increase movement speed | Proposed only |
| Emergency Repair | Restore some health up to normal maximum | Proposed only |

**No values or durations in this table are committed.** The earlier idea of beginning with a shield is a recommendation, not an approved selection.

## 3. Approved decisions — environmental obstacles

1. Obstacles may appear in **selected harder missions**, **not on every mission**.
2. Obstacles should be **infrequent and sparse**. Most battlefield space should remain open.
3. Obstacles create a need to **navigate around objects**, adding positioning skill alongside balloon avoidance and manual firing.
4. Obstacles should be appropriate to the sector's scenery and progression.
5. Their specific behavior on contact (blocking Jim, damaging Jim, or another response) is **not yet decided**.
6. Specific missions, frequency, size, scrolling behavior, and interaction with darts are **not yet decided**.

### Proposed environment examples — not yet approved

- City Park: trees or light poles
- Zoo: enclosure structures or signs
- Forest: dense trees or fallen branches
- Beach: rocks or lifeguard structures
- Desert: rock pillars or cacti
- Mountains: rock outcroppings
- Industrial Zone: pipes or machinery

These are possible art directions, not an approved asset list.

## 4. Campaign placement and pacing

**Approved principle:** Both systems belong primarily to **selected higher-difficulty missions** and should remain occasional. Neither feature is automatically enabled just because the mission number exceeds a threshold.

The following progression is **illustrative only**, not a mission assignment:

| Missions | Helium power-ups | Obstacles |
| --- | --- | --- |
| 1–20 | Generally absent during introductory play | Generally absent |
| 21–30 | Possible occasional introduction | Generally absent |
| 31–50 | Selected missions | Rare selected missions |
| 51–70 | Selected missions | Occasional selected missions |
| 71–100 | Selected missions | Selected missions |

**Do not implement this table as a hard-coded schedule.** Final placement requires individual mission design and playtesting.

The campaign's established sector order remains unchanged: City Park, Zoo, Forest, Beach, Desert, Mountains, Farmland, Industrial Zone, Major City, Balloon Stronghold.

## 5. Design and safety-of-play principles

- Preserve responsive, simultaneous movement and tap-to-fire on iPhone.
- Avoid obstacles or pickups that create unavoidable damage, especially during dense waves and boss attacks.
- Ensure obstacles remain clearly readable against scrolling backgrounds.
- Avoid making a power-up essential to complete a mission; it is an optional advantage.
- Maintain a visible distinction between positive pickups and hazards.
- Keep each mission's configuration explicit so both systems can be absent.
- Preserve current progression, hangar, purchased equipment, weapon behavior, and saved data unless a later approved change specifically requires otherwise.

## 6. Proposed implementation approach — not authorized yet

When approved for development, prefer independent mission-configured systems:

**Power-ups:** mission enable/disable flag; eligible balloon pop event; optional chance roll; pickup type; world-space position; expiration; Jim-overlap collection; temporary or instant effect; HUD feedback. Keep power-up effects separate from permanent weapon upgrades.

**Obstacles:** mission-defined sparse placements or spawn rules; clear visual and collision geometry; interaction rules for Jim, balloons, and player projectiles; spawn/despawn with the scrolling playfield. Confirm that obstacle placement leaves viable routes.

Implement each in a small, testable increment rather than enabling both across the entire campaign at once. These are architecture suggestions, not authorization to code.

## 7. Open decisions / approval checklist

### Power-ups
- [ ] Select first actual power-up type and effect
- [ ] Define effect duration or consumption behavior
- [ ] Define which balloon types can release clouds
- [ ] Define spawn chance and cloud lifetime
- [ ] Select first mission(s) that can spawn clouds
- [ ] Approve cloud/icon artwork and readable scale
- [ ] Decide stacking, repeat pickups, and end-of-mission cleanup
- [ ] Playtest risk/reward balance

### Obstacles
- [ ] Decide what happens when Jim touches an obstacle
- [ ] Decide whether darts or balloons interact with obstacles
- [ ] Choose first sector and mission for a prototype
- [ ] Approve first obstacle asset and hitbox
- [ ] Define obstacle movement/scrolling and safe spawning
- [ ] Test navigability during waves and boss encounters
- [ ] Confirm sparse placement and difficulty pacing

## 8. Status and change control

**As of v1.0, neither feature is authorized for gameplay implementation.** This document is a living design reference. When decisions are made, update the version and distinguish approved changes from proposals before coding or commissioning production assets.

**Approved baseline unaffected:** Pop Squadron title; Jet-Pack Jim character; his approved displayed size; independent movement plus dedicated manual FIRE button; existing weapon cooldowns, campaign, and saves.
