# Marsam (مرسم) — Architectural Specification

## 1. System Philosophy & Design Principles
Marsam is a high-performance, offline-first project management system designed with zero runtime dependencies. It combines tactile skeuomorphic ergonomics (3D woven cloth surfaces, pressed-in cards, dynamic lighting) with modern software architectural rigor.

Key Tenets:
- **Zero Runtime Dependencies**: Built entirely with vanilla HTML5, CSS3, and ES Modules. Runs in standard browsers and offline environments without CDNs, polyfills, or bundling steps.
- **Strict Separation of Concerns**: Data persistence, reactive state management, rendering pipelines, gesture systems, and audio synthesis live in distinct, decoupled modules.
- **Unidirectional Data Flow**: User Interactions -> Action Creators -> Command Dispatcher -> Storage Layer -> Event Bus -> Surgical DOM Patching.
- **Hard Module Limits**: Every source file adheres strictly to a 250-line maximum, enforcing single responsibility and readability.
- **Accessibility & Respect**: Full keyboard accessibility, visible focus states, ARIA roles, and automatic degradation to reduced-motion and reduced-sound modes when preferred by the user.

---

## 2. Directory Hierarchy & Module Responsibilities

```
Marsam/
├── assets/
│   ├── icons.svg                     # Vector sprite containing UI icons
│   └── manifest.webmanifest          # PWA configuration
├── css/
│   ├── tokens.css                    # Design tokens, color scales, spatial units, z-indices
│   ├── themes.css                    # Theme definitions (Light, Dark, System) and accent palettes
│   ├── base.css                      # CSS reset, typography, and utility classes
│   ├── layout.css                    # Grid layouts, app shell, board view, responsive breakpoints
│   ├── fabric.css                    # 3D woven cloth depth, lighting textures, and inset shadows
│   ├── animations.css                # Spring physics, keyframe animations, and FLIP transitions
│   └── components/                   # Isolated styles for modular UI elements
├── js/
│   ├── core/
│   │   ├── event-bus.js              # Publish/subscribe event broker for cross-module events
│   │   ├── store.js                  # Centralized reactive state container with selectors
│   │   ├── command.js                # Command pattern execution engine with undo/redo history
│   │   ├── router.js                 # Hash-based client-side router
│   │   ├── dom.js                    # Sanitization, element creation, and template rendering
│   │   ├── debounce.js               # Performance throttling and debouncing utilities
│   │   └── id.js                     # Secure unique identifier generation
│   ├── data/
│   │   ├── db.js                     # Promisified IndexedDB wrapper with versioned upgrades
│   │   ├── schema.js                 # Schema definitions for projects, lists, cards, drawings, settings
│   │   ├── migrations.js             # Atomic database schema migrations
│   │   ├── fractional-index.js       # Lexicographical ordering engine (Jitter-free drag and drop)
│   │   ├── export-import.js          # Full JSON backup export and validation schema
│   │   ├── sync.js                   # Cross-tab synchronization via BroadcastChannel
│   │   └── repositories/             # Isolated CRUD interfaces for each entity
│   ├── features/
│   │   ├── home/                     # Home screen dashboard, project cards, creation modals
│   │   ├── board/                    # Kanban board, lists, cards, detail modal, labels, checklists
│   │   ├── dnd/                      # Pointer-based drag and drop engine with FLIP animations
│   │   ├── search-filter/            # Multi-token search and combinatorial filter bar
│   │   ├── theme/                    # Theme manager, accent color orchestrator, fabric canvas
│   │   ├── whiteboard/               # Canvas vector drawing modal, pen sizes, colors, patterns
│   │   ├── radial-menu/              # Radial context wheel triggered on long-press
│   │   ├── sound/                    # Synthesized Web Audio engine, sound themes, settings
│   │   └── shortcuts/                # Global keyboard shortcut registry and dialog
│   ├── ui/
│   │   ├── modal.js                  # Accessible dialog controller (Esc key, focus trapping)
│   │   ├── confirm-dialog.js         # macOS-style confirmation dialogs
│   │   ├── toast.js                  # Non-blocking notification dispatch
│   │   ├── dropdown.js               # Contextual dropdown menus
│   │   └── icon.js                   # SVG sprite icon renderer
│   ├── utils/
│   │   ├── date.js                   # Relative timestamps and due date formatters
│   │   └── strings.en.js             # English string dictionary
│   └── main.js                       # Application bootstrapper
├── desktop/                          # Isolated Electron desktop wrapper
│   ├── src/                          # Protocol, window, menu, and backup modules
│   ├── main.js                       # Electron lifecycle and single instance lock
│   └── preload.js                    # Context-isolated bridge exposing desktop metadata
└── tests/                            # Automated unit tests running on Node test runner
```

---

## 3. Data Model & Storage Specifications

### Database: `boardly_db` (Version 2)
The database name and object stores remain strictly preserved to safeguard user data across updates.

#### Object Stores:
- **`projects`**: Project workspace entities.
  - Primary Key: `id` (String)
  - Fields: `name`, `description`, `color`, `createdAt`, `updatedAt`, `archived`
- **`lists`**: Columns within a project.
  - Primary Key: `id` (String)
  - Indexes: `projectId`, `order`
  - Fields: `projectId`, `title`, `order` (Number), `collapsed`, `createdAt`
- **`cards`**: Kanban items residing within lists.
  - Primary Key: `id` (String)
  - Indexes: `listId`, `projectId`, `order`, `dueStatus`
  - Fields: `listId`, `projectId`, `title`, `description`, `order`, `priority`, `labels`, `dueDate`, `checklist`, `attachments`, `createdAt`, `updatedAt`
- **`drawings`**: Whiteboard canvas vectors and strokes associated with cards or projects.
  - Primary Key: `id` (String)
  - Indexes: `cardId`, `projectId`
  - Fields: `cardId`, `projectId`, `strokes`, `backgroundPattern`, `updatedAt`
- **`settings`**: User preferences and application configuration.
  - Primary Key: `key` (String)
  - Fields: `theme`, `accent`, `soundEnabled`, `soundVolume`, `soundTheme`, `reduceSound`

---

## 4. Lexicographical Ordering (Fractional Indexing)
To achieve $O(1)$ reordering without rewriting order fields across hundreds of sibling cards, Marsam implements a fractional index algorithm:
- Initial items are spaced with a standard gap ($GAP = 1000$).
- Prepending: Calculates $nextOrder / 2$ or $nextOrder - GAP$.
- Appending: Calculates $prevOrder + GAP$.
- Inserting: Computes midpoint $(prevOrder + nextOrder) / 2$.
- Auto-Rebalance: Automatically evenly redistributes orders if numerical precision thresholds ($< 10^{-6}$) are reached.

---

## 5. Web Audio Synthesis Pipeline
Sound effects in Marsam are 100% synthesized in real time using the Web Audio API without any external audio asset files:
- **Lazy Initialization**: The `AudioContext` is created in suspended state and unlocked strictly upon the first intentional user gesture.
- **Safety Dynamics**: Master output flows through a `DynamicsCompressorNode` and master gain envelope to eliminate clipping, pops, and sudden peaks.
- **Acoustic Personas**:
  - *Soft Palette*: Sine and triangle waveforms, longer decay envelopes, warm harmonics.
  - *Crisp Palette*: Square/triangle hybrids, exponential ramps, snappy micro-transients.
- **Perceptual Variety**: Dynamic frequency jitter ($\pm 3\%$) prevents auditory fatigue during repetitive interactions.
- **Accessibility**: Automatically activates reduced sound mode when `prefers-reduced-motion` is detected.

---

## 6. Desktop Integration & Sandboxed Security
The desktop wrapper in `/desktop` packages Marsam as a native application while preserving strict security:
- **Custom Scheme (`app://boardly/`)**: Privileged protocol providing secure origin isolation for IndexedDB storage.
- **Zero Node Leaks**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- **Automated Data Protection**: Automated timestamped backups of user data into `%APPDATA%\Boardly\backups` upon version increments.
- **Single Instance**: Secondary launch requests focus the primary window.
