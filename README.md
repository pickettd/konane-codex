# Konane Web Game

A minimalist browser-based recreation of the Hawaiian game Konane implemented with vanilla HTML, CSS, and JavaScript, designed for deployment on GitHub Pages.

## MVP Scope
- 6x6 Konane board with alternating black and white stones in the traditional starting layout.
- Human vs. human hot-seat play on a single device.
- Enforced legal moves: orthogonal jumps over a single opponent stone into an empty space, removing the captured stone.
- Turn tracking, move feedback, and win detection when a player has no legal moves.
- Reset/New Game control and clear status messaging.

## Project Structure (initial)
```
/ (repo root)
├── AGENTS.md        # Roadmap and planning checklist
├── README.md        # Project overview and developer notes
├── index.html       # Game markup shell
├── styles.css       # Styling and layout rules
└── game.js          # Game state, rules, and interaction logic
```

## Development Workflow
1. Open `index.html` in a modern browser to run the game locally (or run `npm start` to get the app at http://localhost:8080 by default)
2. Use the provided npm formatting script before committing changes (see below).
3. Track roadmap progress in `AGENTS.md` by checking off completed items.

## Formatting
This project uses Prettier for formatting via `npx`:
```sh
npm run format
```
Check formatting without writing changes:
```sh
npm run format:check
```
The script writes changes in place across HTML, CSS, and JS files. Install Node.js 18+ to ensure compatibility.

## Roadmap
See `AGENTS.md` for the detailed roadmap and task checklist.

## Deployment
- Push the `main` branch to GitHub and enable GitHub Pages (project site) targeting the root directory.
- Confirm the live build manually; no bundling step is required.

## Future Enhancements
- Move history panel and undo support.
- AI opponent with difficulty settings.
- Visual themes and accessibility options (colorblind friendly palettes, keyboard controls).
