# Pop Squadron — Quality Audit and Maintenance Register
Version 1.0 · Established 2026-10-20

## Purpose and rules
This is the durable record for bug scans, maintenance decisions, corrections, verification, and deferred upkeep. Review it before maintenance work and update it after each audit or fix. It is not a substitute for Git history, test logs, or device testing.

**Protect player data:** Never clear localStorage, reset progress, wallet, ownership, loadout, or boss completion as a maintenance shortcut. Preserve existing storage keys and schemas unless a separately approved and tested migration is necessary. Do not delete offline caches merely to force updates. Get explicit approval before changing gameplay or shipping a risky migration.

**Status vocabulary:** OPEN (not started), INVESTIGATING, PLANNED (approved design, not implemented), IN PROGRESS, BLOCKED, VERIFIED (evidence recorded), DEFERRED (deliberate future work), CLOSED (completed with evidence).

## Repeatable bug and upkeep scan
Run at the end of a sector increment, before significant releases, after a production failure, and periodically when new platform/browser behavior warrants it.

1. **Establish baseline.** Record date, production commit/version, active missions and relevant devices; inspect open items below and recent GitHub Actions runs. Identify scope and what must not change.
2. **Static/code review.** Inspect changed files, error paths, storage read/write behavior, version/cache lifecycle, mission completion and defeat transitions, and input/mobile rendering. Look for silent resets, stale assumptions, uncaught failures, race conditions, and missing tests. Separate confirmed bugs from speculative risks.
3. **Automated checks.** Run `npm test` and `npm run build` in a clean checkout; examine failures and add focused regression tests for each confirmed defect. GitHub Actions must pass before considering a deployment verified.
4. **Functional smoke test.** On the installed iPhone PWA, check hangar launch/return, one ordinary mission and a boss where applicable, enemy collision/escapes, shop purchase only if safely affordable, equip/loadout, wallet, progress unlocks, and reload/reopen persistence. Do not spend player funds solely for an audit without consent.
5. **Update/offline check.** Verify the installed build identifier, update detection, and that an update arriving during gameplay waits for return to hangar. Test offline launch only when the app is already fully installed/cached. Confirm the app remains usable when release checks fail.
6. **Persistence safeguards.** Test corrupted storage, write failure, older/newer mission catalogs, purchase rollback, and the distinction between in-session state and durable saved state. Use mocked storage or disposable test profiles; never reset a real player save.
7. **Report and triage.** Log each finding with ID, severity, reproduction steps, impact, evidence, affected code, proposed fix, status, owner/next action, and verification. Mark “no issue found” where appropriate; do not claim unperformed device tests.
8. **Release and close.** Make small, isolated changes after approval; record commit, tests, Actions URL/result, production deployment, and real-device confirmation. Leave unresolved risks OPEN or DEFERRED.

Severity guide: **Critical** = save loss or game unplayable; **High** = mission blocked, purchase/wallet error, or update interrupts gameplay; **Medium** = recoverable functional defect; **Low** = cosmetic or non-urgent upkeep.


**Test Compatibility Check (every development increment):** When expanding an existing system (for example, adding missions or weapons), briefly inspect its related tests for assumptions that the expansion makes obsolete, especially hardcoded final-item limits. Update those tests alongside the feature while preserving all safety and regression protections. Continue using the existing GitHub Actions checks; no additional branching or deployment infrastructure is required.

## Maintenance register

| ID | Date | Priority | Status | Item / scope | Evidence / next action |
| --- | --- | --- | --- | --- | --- |
| M-001 | 2026-10-20 | High | VERIFIED | Centralize collision/boss aircraft damage and ensure immediate defeat on terminal damage or escape limit | Combat commits `9810782`, `5f4ff71`, `71c1310`; City Park ordinary mission and boss replay verified on device |
| M-002 | 2026-10-20 | High | VERIFIED | Defer PWA refresh during gameplay until hangar; remove service-worker forced navigation of visible clients | Implementation `ffcfe76`, `2202dcf`, `3a41214`; test correction `6fdb571`; Actions run 39441700958 succeeded; player independently verified update arriving mid-mission waited until gameplay ended |
| M-003 | 2026-10-20 | Critical prevention | VERIFIED | Preserve saved mission unlocks when authored mission catalog shrinks; prevent replay from lowering saved unlock count | Commits `4c4b554`, `168ca6f`, `56a70b1`; initial test run 39443898065 failed, corrected run 39444720276 passed; player confirmed iPhone progress, wallet and equipment intact |
| M-004 | 2026-10-20 | Low / future | DEFERRED | Conservative cleanup of obsolete versioned offline caches | Design and safeguards below; no cache pruning implemented or authorized yet |
| M-005 | 2026-10-20 | Low | VERIFIED (audit only) | Offline asset coherence, release probe, old-asset fallback, save-data isolation | Reviewed `scripts/prepare-offline.mjs`, `src/offline.js`, `tests/offlineBuild.test.js`; no code changes; current policy retains old bundles |

### M-004 — Proposed conservative cache cleanup (future maintenance)
**Problem:** Each deployment can leave a `pop-squadron-static-<hash>` Cache Storage entry. Unbounded retention may consume device storage. This is *not* currently a verified player-facing failure.

**Safety requirements before implementation:**
- Identify only caches with the exact Pop Squadron static-cache prefix. Never touch localStorage, IndexedDB, player saves, or caches belonging to other apps.
- Keep the active worker's `CACHE` unconditionally; keep a safety margin of at least the **two most recent older versions**. Treat this as a minimum, not a mandate to delete.
- Protect any older build still required by an open/controlled client. Do not assume `clients.matchAll()` reveals all dormant iOS PWA sessions; unknown client state should favor retention.
- Do not prune during install, activation, or active gameplay merely because a newer worker claims clients. Prefer an explicit, safe maintenance point after returning to the hangar, with safeguards for other tabs and suspended sessions.
- Do not depend on the unordered result of `caches.keys()` as proof of age. Introduce verified creation metadata or another dependable ordering mechanism before deciding which versions are oldest. Preserve legacy caches whose age cannot be established safely.
- Confirm cached navigation HTML and its hashed assets remain from one coherent build; old hashed asset requests must continue resolving while needed.
- If safety cannot be established, **skip deletion**. Cache cleanup must never be a prerequisite for launching, updating, or playing.

**Proposed validation:** Add mocked Cache Storage and multi-client regression tests covering current cache, two previous versions, old-client asset fetches, unknown-age caches, interrupted updates, offline launch, and storage-write failures. Confirm save keys are unchanged. Run clean automated tests/build and GitHub Actions, then perform iPhone PWA offline/update/mission testing before marking VERIFIED.

**Trigger to revisit:** Measurable storage growth, browser quota failures, or repeated deployments demonstrating material cache accumulation. Obtain approval for the exact algorithm and rollout before modifying the service worker.

## Audit session template
Copy for every new audit:

### Audit YYYY-MM-DD — [scope]
- **Baseline:** commit/build, platform, missions, relevant files.
- **Checks performed:** code review; tests/build; Actions; iPhone; offline/update; persistence.
- **Findings:** ID, severity, reproduction, impact, evidence; distinguish confirmed vs suspected.
- **Changes:** approved scope, file(s), commit(s), regression test(s).
- **Verification:** automated results and URL; deployed version; device observations; outstanding gaps.
- **Disposition:** VERIFIED / OPEN / DEFERRED and next owner/action.

## Recordkeeping
Update this register in the same maintenance batch as relevant changes or immediately after verification. A passing GitHub Actions deployment proves CI and publishing, not every on-device behavior; record both independently. Retain failed attempts in the record when they explain a correction. Do not silently erase deferred items when a new sector begins.

## Audit 2026-10-22 - Documentation consolidation

Baseline: Missions 1-30 implemented; Thornback previously deployed and playtested on iPhone. Documentation review identified an empty README, early three-mission reconstructed drafts, overlapping campaign references, and outdated Beach/Desert sector metadata.

Completed: Created Project Guide v2.0 and Campaign Design and Gameplay Evolution v2.0 as the two current design/implementation references; retained this maintenance register as the third current reference. Updated README to index them. Retained five older documents as historical references. Updated sectorDefinitions.js and its test to Beach Boardwalk and Carnival; Carnival boss remains undecided.

Verification: GitHub Actions run 39838690276 completed successfully for commit b708217, including the documentation and sector metadata changes. This confirms the prior batch deployment, not this new register-entry commit. No fresh iPhone test of sector labels has been reported. No combat tuning or player save changes were made.

Playtest observations: Mission 29 was beaten twice consecutively; latest report: three balloon escapes and one hull hit, with challenging but beatable weaving. Mission 30 Thornback was beaten with a couple of hull hits; easier than Mission 29, but enjoyable, with well-received artwork, movement and thorn attacks. Retain both encounters for now.

Outstanding: Verify CI and deployment of this register update. Later confirm Beach Boardwalk and Carnival labels on iPhone. Deferred cache maintenance item M-004 remains unchanged.
