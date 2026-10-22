# Pop Squadron — Campaign Variety and Balance Strategy v1.0

**Status:** Approved design direction; individual mechanics and balance values require later approval  
**Recorded:** 2026-10-22  
**Scope:** Campaign 1, ten sectors / 100 missions

## 1. Objective

Create **100 missions worth playing, not 100 progressively more punishing missions**. Challenge should remain interesting, varied and reasonably beatable. Do not scale balloon quantity, speed, health, or enemy damage upward automatically with every mission number: continuous linear escalation would eventually become unreasonable.

Build and playtest **one sector at a time** through all ten approved sectors. Preserve observations as development proceeds; after the complete campaign is playable, conduct a **campaign-wide balancing pass** rather than attempting to perfect the global difficulty curve now.

## 2. Four complementary dimensions of variety

### A. Enemy evolution

- Introduce new balloon behaviors, movement patterns, combinations, durability profiles and boss tactics selectively.
- Change what the player must **do**, not merely how much damage the player must inflict.
- Weaving, crossing paths, formation changes, and different tactical pressures can make encounters engaging without enormous balloon counts.
- Maintain readable and avoidable threats; do not manufacture difficulty with unavoidable hits.

### B. Player progression

- Over later sectors, offer improved darts and dart systems, specialized equipment and meaningful loadout choices.
- Keep the existing hangar-based equipment and weapon mechanics intact until specific changes are approved.
- Match new enemy challenges with viable player responses. Better equipment should open tactics and improve efficiency, rather than serve as an unannounced mandatory purchase.
- Balance against equipment a player could reasonably obtain by that point, not an assumption that the player owns everything.

### C. Temporary in-mission advantages: helium clouds

- On **selected missions**, a **small, infrequent chance** associated with eligible balloon pops may release a helium cloud.
- Fly through the cloud **before it dissipates** to collect a positive bonus.
- The bonus must be **identifiable before pickup** (e.g. distinct icon/symbol; color alone is insufficient).
- This is **not currency** and must not replace existing balloon-pop credit rewards.
- The intended design space is **one of three possible bonus types**. **Which three types**, their exact effects, probabilities, durations, eligible balloons and missions are **not approved yet**. Do not silently select or implement them.
- Clouds are optional opportunities, not a requirement to finish a mission. Their placement and lifespan should create an interesting risk/reward decision without forcing damage.

Candidate effects (shield, faster firing, movement boost, repair) remain **proposals**, not a settled three-bonus roster. See the dedicated design reference below.

### D. Environmental/navigation obstacles

- Selected missions may contain **sparse, readable objects** that occupy space and require navigation alongside shooting and balloon avoidance.
- Examples raised in discussion: a **tree** intruding into the route or a **crane derrick/boom** extending across part of the flight path. Other scenery-appropriate objects may be proposed for later sectors.
- The intended hazard is that **colliding with an obstacle can damage the aircraft**; exact damage, collision response, hitboxes and interaction with projectiles/balloons remain to be designed and approved.
- Keep open safe paths, fair warning, and adequate clearance for mobile controls. Obstacles should not routinely fill the screen or make hits inevitable.
- No automatic obstacle deployment to every later mission.

## 3. Difficulty and pacing

Evaluate missions on **three separate dimensions**:
1. **Challenge** — survival pressure, escape risk, hull damage, tactical demand.
2. **Variety** — new decisions, movement, positioning and equipment relevance.
3. **Enjoyment** — satisfying action, pacing and replayability.

Difficulty should **rise and fall within a sector**. A boss should be distinctive and memorable; it need not always be harder than the preceding mission. New sectors may introduce a different kind of challenge rather than a higher numeric difficulty.

Use temporary advantages, evolving player capabilities and obstacles as **selective balancing tools**, not as automatic difficulty multipliers. Maintain fair play for both upgraded and less-equipped players.

## 4. Playtest evidence and current baseline

- **Mission 29 (Deep Woods):** two consecutive reported victories. Latest: three escaped balloons and one hull hit. Weaving remains demanding but beatable; **retain current balance**.
- **Mission 30 (Thornback):** first reported victory, a couple of hull hits. Easier than Mission 29, but enjoyable; boss image, movement and thorn attacks praised. **Retain current encounter** pending later campaign-wide review.
- **Sector 3:** provisionally accepted based on current playtesting, not declared mathematically balanced.

Record future playtests using mission number, equipment/loadout if known, victory/defeat, escapes, hull hits/remaining health, perceived challenge, novelty, enjoyment and any frustrating or unavoidable damage. Do not invent metrics the tester did not provide.

## 5. Incremental development rules

1. Design each new sector's gameplay identity and tactical variety before implementing its missions.
2. Add new balloon behaviors, equipment, cloud bonuses or obstacles **only in small approved increments**, with explicit mission-level enablement.
3. Write automated tests for rules and preserve existing controls, saves, purchased gear, wallet, mission progression, offline behavior and performance.
4. Playtest on the target iPhone before expanding a new mechanic broadly.
5. After Sector 10, review the full 100-mission campaign for spikes, repetition, weak rewards and unfair equipment dependencies; rebalance deliberately.

## 6. Related design references

- [Power-Ups and Environmental Obstacles](Pop%20Squadron%20-%20Power-Ups%20and%20Environmental%20Obstacles%20v1.0.md) — approved cloud/obstacle constraints, candidate effects, open decisions and implementation checklist.
- [Campaign Sectors and Boss Concepts](Pop%20Squadron%20-%20Campaign%20Sectors%20and%20Boss%20Concepts%20v1.0.md) — locked sector order and boss concepts.

## 7. Decisions still open

- Exact three helium-cloud bonus types and their visuals, effects, lifetimes, eligibility and spawn chance.
- When and how improved darts/dart systems become available and how to balance their cost and utility.
- First obstacle mission, art, collision damage, positioning, telegraphing and projectile interactions.
- Specific new enemy mechanics and pacing for Sector 4 and beyond.
- Numerical criteria for the final campaign-wide balancing pass.

**Change control:** This is a strategy/design document, **not authorization to implement new gameplay systems**. Existing mission balance, gameplay code and artwork are unchanged by this documentation commit.
