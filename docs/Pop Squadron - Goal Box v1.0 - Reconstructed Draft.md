# Pop Squadron — Goal Box v1.0 (Reconstructed Draft)

**Status:** RECONSTRUCTED FOR REVIEW — not a verbatim recovery of the previously approved Goal Box.
**Reconstruction date:** October 18, 2026.

## 1. Purpose and experience
Build a lightweight, portrait-oriented, single-player balloon-shooting game that is straightforward to play on an iPhone. The player steers an aircraft while weapons fire automatically, survives authored waves of balloons, and completes missions. The game should remain playable offline after installation.

## 2. Core play loop
Open hangar → select available mission and equipment → launch → steer and shoot through waves → victory or defeat → replay or return to hangar.

## 3. Confirmed gameplay direction
- Aircraft steered by touch dragging; keyboard support on desktop.
- Balloon threats include basic, durable, and layered balloons, with distinct movement and hit behavior.
- Automatic weapon types: Forward Cannon, Twin Side Guns, Tracking Launcher.
- Three fixed equipment categories: primary, secondary-1, secondary-2.
- Equipment selections persist locally and apply to the next mission.
- Missions have victory and defeat conditions, with replay and hangar return.
- Authored, data-defined missions rather than random encounters.
- Offline-capable, iPhone-first portrait delivery, with larger-screen/browser compatibility.

## 4. Mission progression
- Mission 1: existing four-wave mission, unchanged in its intended difficulty.
- Mission 2: moderate difficulty, more balloons and mixed formations.
- Mission 3: challenging difficulty, denser waves, tougher balloons, and more demanding movement patterns.
- Missions unlock sequentially: completing Mission 1 unlocks Mission 2; completing Mission 2 unlocks Mission 3.
- Completed missions remain replayable.
- Progress persists locally; defeat does not erase previously completed missions.

## 5. Delivery and technical boundaries
- Browser game using Phaser 3 and Vite; GitHub Pages delivery.
- No account or backend is needed for the currently implemented experience.
- Prioritize responsive controls, readable portrait UI, reliable persistence, and a small maintainable codebase.
- Keep gameplay rules independently testable where practical.

## 6. Scope discipline
Increment 5 focuses on authored missions, selection, unlocking, and regression testing. New artwork, currencies, shops, additional weapons, and unrelated systems are outside its approved scope.

## 7. Recovery limitations
This draft combines recovered planning decisions, approved Increment 5 decisions, and verified implemented behavior. It **does not claim** to reproduce the exact original Goal Box or establish unverified original requirements. Review and approve before promoting its status to canonical.
