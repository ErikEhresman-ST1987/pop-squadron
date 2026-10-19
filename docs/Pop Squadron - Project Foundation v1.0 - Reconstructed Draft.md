# Pop Squadron — Project Foundation v1.0 (Reconstructed Draft)

**Status:** RECONSTRUCTED FOR REVIEW — not a verbatim recovery of the previously approved Foundation.
**Reconstruction date:** October 18, 2026.

## 1. Foundation objective
Support a lightweight, maintainable portrait balloon-shooter through small, tested increments, preserving working gameplay while expanding missions and progression.

## 2. Verified implementation baseline (through Increment 4)
- Phaser 3 game scene, Vite build, GitHub Pages with GitHub Actions deployment.
- iPhone touch drag and desktop keyboard aircraft movement.
- Four-wave mission, balloon HP/escape/collision rules, victory and defeat.
- Basic, durable, layered balloon behaviors.
- Forward Cannon (240 ms), Twin Side Guns (650 ms), Tracking Launcher (1500 ms).
- Hangar with fixed weapon slots, equip/unequip, local persistence, launch, replay, and return.
- Weapon fire respects the selected loadout.
- Offline operation verified on iPhone.
- Renderer-independent rules and automated unit tests exist for mission, balloons, weapons, and loadout.

## 3. System ownership
- `src/main.js`: Phaser scene, rendering, input, gameplay orchestration, and hangar wiring.
- `src/game/missionRules.js`: current mission outcomes and resolution rules.
- `src/game/balloonRules.js`: balloon state, damage, and appearance stages.
- `src/game/weaponRules.js`: weapon definitions, cooldowns, and targeting.
- `src/game/loadoutRules.js`: fixed equipment categories, validation, and local persistence.
- `src/offline.js` and `scripts/prepare-offline.mjs`: offline delivery.
- `tests/`: automated rules regression tests.

## 4. Approved Increment 5: mission expansion and difficulty
Three authored missions with sequential unlocking and local progress tracking:
1. Easy: preserve existing Mission 1 four-wave experience.
2. Moderate: more balloons and mixed formations.
3. Challenging: denser waves, tougher balloons, and more demanding movement patterns.

Previously completed missions can be replayed. A loss does not erase unlocks. Hangar equipment remains independent of mission progress.

## 5. Proposed implementation checkpoints (not yet implementation authorization)
- **5.1 Mission definitions:** extract authored mission configurations from scene logic; preserve Mission 1 behavior; test mission selection data.
- **5.2 Mission selection:** hangar shows three missions, including clear locked/unlocked states; launch selected unlocked mission.
- **5.3 Persistent progression:** unlock next mission only on victory; keep completed missions replayable; persist locally with defensive validation.
- **5.4 Regression:** verify defeat, victory, replay, hangar, equipment, persistence, and offline iPhone play.

## 6. Engineering boundaries
- Keep mission definitions data-driven; avoid duplicating the combat engine for each mission.
- Preserve existing weapon, balloon, and movement mechanics.
- Separate progression persistence from equipment persistence and transient combat state.
- Make one small change at a time; test and obtain approval before advancing checkpoints.
- Keep GitHub Pages deployment through Actions; do not switch to branch/Jekyll publishing.
- Avoid new artwork, shops, currencies, new weapons, and unrelated features during Increment 5.

## 7. Known open details
- Exact wave counts, spawn times, and balloon mixes for Missions 2 and 3 require checkpoint-level design and playtesting.
- Final mission-selector layout requires mobile verification.
- The original Foundation's full wording is not available; this document is a reconstruction, not a replacement asserted to be original.

## 8. Approval boundary
Do not treat this reconstructed draft as the original approved Foundation until the user reviews it. Increment 5 planning decisions are approved; implementation remains checkpoint-gated.
