# board-board

A 3D split-flap display board with AI integration and a built-in whiteboard. Think airport departure boards meets smart display.

![board-board](https://img.shields.io/badge/board--board-v1.0.0-black)

## Features

### Split-Flap Board
- Realistic 3D split-flap tile animation with authentic mechanical sound
- Tiles cycle through the character set just like a real split-flap display
- Three tile sizes: **S** / **M** / **L** — columns auto-fit to screen width
- 1–5 rows, up to 50 columns
- Staggered flip animation across tiles for that classic cascade effect
- Day/night mode toggle

### AI Integration (Ollama)
- Connects to a local [Ollama](https://ollama.com) instance
- Auto-detects all installed models via dropdown
- **AI mode**: type a prompt, AI responds with a short phrase displayed on the board
- **Auto mode**: AI generates new phrases on a timer (1m / 5m / 10m / 30m / 1h)
- Shows `...THINKING...` on the board while AI is generating
- Manual text mode (TXT) for typing directly onto the board

### Whiteboard
- Full-page canvas drawing surface with black border frame
- Pen and eraser tools
- Preset marker colors (black, red, blue, green, purple, orange) + custom color picker
- Adjustable brush size
- Undo / Redo (Cmd+Z / Cmd+Shift+Z)
- Clear board

### Screensaver
- Fullscreen animated tile grid
- Tiles flip to reveal colors or image slices
- Drop PNGs into `public/images/` — images get sliced into tile-sized pieces and revealed one tile at a time
- Configurable idle timeout
- Mixed flip directions (X/Y axis) for visual variety

### Themes
- **Classic** — white on black
- **Matrix** — green on dark
- **Amber** — warm orange on dark
- **Ocean** — cyan on deep blue
- Custom text and tile colors via settings

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Ollama](https://ollama.com) (optional, for AI features)

### Install & Run

```bash
git clone https://github.com/lalomorales22/board-board.git
cd board-board
npm install
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000).

### Ollama Setup

1. Install Ollama: https://ollama.com/download
2. Pull a model:
   ```bash
   ollama pull llama3.2
   ```
3. Make sure Ollama is running (`ollama serve`)
4. In board-board, click **Connect** — your models appear in the dropdown
5. Select a model, type a prompt, hit Enter

### Screensaver Images

Drop any `.png`, `.jpg`, or `.webp` files into `public/images/`. The screensaver will slice them into tiles and reveal them with flip animations. Enable the screensaver in Settings and set your idle timeout.

## Tech Stack

| Layer | Tech |
|-------|------|
| UI | React 18 + TypeScript |
| Build | Vite 6 |
| Animations | CSS 3D Transforms |
| Drawing | HTML Canvas API |
| Sound | Web Audio API (synthesized) |
| AI | Ollama REST API (proxied via Vite) |
| Persistence | localStorage |

## Project Structure

```
board-board/
├── src/
│   ├── components/
│   │   ├── FlipTile.tsx        # Core 3D split-flap tile
│   │   ├── FlipBoard.tsx       # Board grid + AI orchestration
│   │   ├── FlipControls.tsx    # Input, size, rows, AI controls
│   │   ├── Whiteboard.tsx      # Canvas drawing surface
│   │   ├── WhiteboardTools.tsx # Drawing toolbar
│   │   ├── NavBar.tsx          # Top navigation
│   │   ├── Settings.tsx        # Settings slide-in panel
│   │   └── Screensaver.tsx     # Fullscreen screensaver
│   ├── hooks/
│   │   └── useOllama.ts        # Ollama API integration
│   ├── context/
│   │   └── AppContext.tsx       # Global state + theming
│   ├── utils/
│   │   ├── audio.ts            # Flip sound synthesis
│   │   └── storage.ts          # localStorage helpers
│   ├── index.css               # All styles
│   ├── App.tsx                 # App shell
│   └── main.tsx                # Entry point
├── public/images/              # Screensaver images go here
├── vite.config.ts
└── package.json
```

## License

MIT
