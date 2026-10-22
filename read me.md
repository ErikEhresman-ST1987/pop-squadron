# Pop Squadron

Portrait-first Phaser 3 / Vite browser game. Campaign 1 plans 100 missions across ten sectors; Missions 1–30 are currently authored. Play: https://erikehresman-st1987.github.io/pop-squadron/

## Three current project documents

1. [Project Guide](docs/Pop%20Squadron%20-%20Project%20Guide%20v2.0.md) — implementation, goals and engineering process.
2. [Campaign Design and Gameplay Evolution](docs/Pop%20Squadron%20-%20Campaign%20Design%20and%20Gameplay%20Evolution%20v2.0.md) — sectors, challenge, player progression, helium clouds and obstacles.
3. [Quality Audit and Maintenance Register](docs/Pop%20Squadron%20-%20Quality%20Audit%20and%20Maintenance%20Register%20v1.0.md) — quality checks, historical fixes and deferred maintenance.

The five older documents remain for historical traceability, not as competing active specifications.

## Development

Run `npm install`, `npm test`, `npm run build` and `npm run dev`. Gameplay: `src/main.js`; rules: `src/game/`; tests: `tests/`. Deployment uses GitHub Actions and GitHub Pages.

Protect player saves, equipment, wallet and offline behavior. Verify CI and iPhone playtests separately. Next sector: **Beach Boardwalk**, Missions 31–40. Sector 5: **Carnival**.
