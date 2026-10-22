# Pop Squadron — Project Guide v2.0

**Status:** Current consolidated project guide (2026-10-22). Implementation facts are based on the repository; game-design decisions are based on approved planning. This document replaces the reconstructed Goal Box and Project Foundation as the **working reference**, without claiming to recover their original wording.

## Goal and experience
Create a lightweight, portrait-first, single-player browser/PWA balloon shooter, combining free-moving aircraft combat and tactical equipment choices. Jet-Pack Jim fights balloons lost by children, mutated in the wild and now organizing an invasion. Prioritize enjoyable, readable iPhone gameplay, responsive movement and fire controls, offline play after installation, and maintainability. Campaign 1 comprises ten sectors, ten missions each (100 total).

## Player loop
Hangar → choose available sector/mission and loadout → launch → move freely, fire and survive authored waves/boss → earn credits and unlock progression on victory → replay or return to hangar.

### Current implementation baseline (2026-10-22)
- Missions **1–30** are authored; Sectors **1 City Park, 2 Zoo, 3 Forest** implemented, with bosses at 10, 20 and 30. Missions 31–100 are **planned**, not implemented.
- Phaser **3.90.0**, Vite **6.3.5**, GitHub Pages and GitHub Actions; PWA/offline update system with in-app Check for Updates.
- iPhone touch movement, desktop keyboard support, dedicated manual FIRE input, and equipped always-on weapon systems with cooldowns. Do not confuse manual FIRE input with automatic weapon behavior.
- Balloon types and movement patterns, boss encounters, player hull damage, balloon escapes and mission victory/defeat. Standard mission configuration is 100 hull HP, 20 contact damage, five escapes allowed; individual boss projectile damage may differ.
- Hangar sector/mission selection, sequential unlocks, equipment categories, shop/credits, purchased gear, local persistence and replay.
- Weapon catalog lives in `src/game/weaponRegistry.js`; includes standard, rapid, heavy-tip, piercing, triple, twin-wing, fan, rear-firing, auto-aiming, burst, seeking, cluster and other darts. Several weapons already have Sector 4 unlock rules. **Consult code before proposing a weapon as new.**
- Mission definitions in `src/game/missionDefinitions.js`, sectors in `src/game/sectorDefinitions.js`, bosses in `src/game/bossRules.js`, progression and equipment rules in separate `src/game/` modules.
- Current sector metadata: **Beach Boardwalk** (31–40), **Carnival** (41–50); Carnival boss not yet designed. Changes to the sector catalog must update related tests.

## Operating boundaries
- Preserve player save keys and data (mission unlocks, wallet, ownership, loadout and boss completion). Never clear storage or offline caches as a routine fix.
- Preserve working mobile controls, weapon behavior, missions, artwork, GitHub Pages and PWA lifecycle unless specifically approved otherwise.
- User directs game design and playtests on iPhone; assistant handles repo edits, focused tests, GitHub Actions verification and records results. Passing CI does **not** prove iPhone behavior.
- Develop in **small approved increments**, test each change, review related tests for obsolete fixed-size assumptions, verify deployment and request device feedback.
- New art is prepared separately and processed through Sprite Factory; do not change established asset paths merely to correct spelling (`public/assests/` is an existing directory).
- Keep game rules independently testable where practical; prefer data-driven mission and sector configurations.

## Current goal and scope
Finish Sectors 4–10, then review difficulty across the complete campaign. The objective is **100 missions worth playing, not 100 continuously harder missions**. New enemy behaviors, equipment, helium clouds and sparse navigation obstacles should provide varied decisions. No cloud/obstacle implementation is approved until its mechanics and mission placement are specified.

## Working documents
1. **This Project Guide** — goal, current implementation, architecture and working process.
2. **[Campaign Design and Gameplay Evolution](Pop%20Squadron%20-%20Campaign%20Design%20and%20Gameplay%20Evolution%20v2.0.md)** — authoritative approved sector list, balance strategy and future mechanics with approval status.
3. **[Quality Audit and Maintenance Register](Pop%20Squadron%20-%20Quality%20Audit%20and%20Maintenance%20Register%20v1.0.md)** — audits, deferred maintenance, verification, playtests and open issues.

### Historical documents (preserved, not current authority)
- Goal Box v1.0 — Reconstructed Draft (limited to early missions, never approved as canonical).
- Project Foundation v1.0 — Reconstructed Draft (early implementation baseline, never approved as canonical).
- Campaign Sectors and Boss Concepts v1.0 filename (content revised to v1.1).
- Campaign Variety and Balance Strategy v1.0.
- Power-Ups and Environmental Obstacles v1.0.

These remain in Git history and the docs folder for traceability. For current decisions, use the three working documents above. Conflicts should be resolved in favor of explicit later user approvals and actual implementation facts, never silently.
