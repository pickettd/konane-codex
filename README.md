# Konane Web Game

A minimalist browser-based recreation of the Hawaiian game Konane implemented with vanilla HTML, CSS, and JavaScript, designed for deployment on GitHub Pages.

## MVP Scope
- 6x6 Konane board with alternating black and white stones, starting fully populated.
- Traditional opening sequence where Black removes a center or corner stone and White responds from an adjacent space.
- Human vs. human hot-seat play on a single device.
- Enforced legal moves: orthogonal jumps over a single opponent stone into an empty space, removing the captured stone.
- Turn tracking, move feedback, and win detection when a player has no legal moves.
- Reset/New Game control and clear status messaging.

## Game Rules
The MVP follows the traditional Konane opening ritual and capture rules with optional multi-jump turns:
1. **Setup** – A 6x6 grid is completely filled with alternating black and white stones; no gaps are present at the start.
2. **Opening** – Black removes either one of the two black stones at the board's center or a black stone from any corner. White then removes a white stone orthogonally adjacent to that empty space. Both stones are set aside.
3. **Turn Order** – After the opening removals, Black takes the first capture turn, followed by White, alternating thereafter. Captures are mandatory when available.
4. **Legal Moves** – A move consists of jumping orthogonally (up, down, left, or right) over one immediately adjacent opponent stone into the empty space directly beyond it.
5. **Multi-Jumps** – A player may continue jumping with the same stone as long as each jump is legal and they land on an empty space. Stopping is optional; in the MVP you can click the active stone to end your capture chain early.
6. **No Moves** – If the active player has no legal capture, that player loses and the opponent wins the game.
7. **Undo & Reset** – Developers can call `window.konane.undo()` during local play for testing. `New Game` resets the board and scores.

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
1. Open `index.html` in a modern browser to run the game locally.
2. Use the provided npm formatting script before committing changes (see below).
3. Track roadmap progress in `AGENTS.md` by checking off completed items.
4. Access debug helpers (e.g., `window.konane.undo()`) from the browser console during development.

## Accessibility & UX Notes
- Skip link lets keyboard users jump straight to the board.
- Status messages and capture counts announce through polite live regions.
- Instruction pane beside the board summarizes the turn flow.
- Animations and transitions respect `prefers-reduced-motion` settings.

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
