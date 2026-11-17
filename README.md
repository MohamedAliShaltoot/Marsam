# Boardly 📋✨

A production-quality, tactile, offline-first Trello-style project management web application built with **pure vanilla HTML5, CSS3, and JavaScript (ES Modules)**. No frameworks, no build step, no CDN, and zero runtime dependencies.

---

## 🚀 How to Run

Because modern browsers enforce strict CORS security policies on native ES Modules over `file://`, Boardly must be served via a static HTTP server.

### Option 1: Node.js (Built-in Zero-Dependency Server)
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in any modern browser.

### Option 2: npx serve
```bash
npx serve .
```

### Option 3: Python
```bash
python -m http.server 3000
```

---

## 🏛 Architecture Overview

Boardly follows strict front-end architectural separation of concerns with unidirectional data flow:
`UI Interaction -> Action Dispatch -> Store / Command Stack -> IndexedDB Storage -> Event Bus -> Affected UI Node Re-render`

- **Core Layer (`js/core/`)**:
  - `event-bus.js`: Lightweight typed pub/sub bus.
  - `store.js`: Central reactive state manager.
  - `command.js`: Undo/Redo command manager (retaining up to 50 operations).
  - `router.js`: Hash-based SPA routing (`#/` for Projects Home, `#/p/:id` for Board workspace).
  - `dom.js`: Secure DOM manipulation utilities strictly preventing XSS.
  - `debounce.js`: Input debounce and animation throttling.

- **Storage & Data Layer (`js/data/`)**:
  - `db.js`: Native Promise wrapper for IndexedDB transactions.
  - `schema.js` & `migrations.js`: Versioned object stores and indexes.
  - `fractional-index.js`: Float-based gap indexing (`(prev + next) / 2`), ensuring moves update only a single record.
  - `export-import.js`: Schema-validated JSON export and ID-remapped import.
  - `sync.js`: `BroadcastChannel` enabling real-time cross-tab synchronization.

- **Signature Visuals: 3D Woven Fabric (`css/fabric.css`, `js/features/theme/fabric-texture.js`)**:
  - Procedurally generated seamless woven cloth tile rendered once to a Data URL.
  - Top-left directional lighting tokens (`--light-x`, `--light-y`).
  - Physical "sink" effect: elements pressed into cloth with layered ambient occlusion, tight contact shadows, inset highlight glints, and radial sag dents (`::before`).
  - Pointer parallax tilt with perspective (disabled on touch / reduced motion).
  - Dragging lifts cards out of the cloth; dropping triggers a spring ripple settle.

- **Component Layer (`js/features/` & `js/ui/`)**:
  - Reusable components implement factory functions returning `{ el, update, destroy }`.

---

## 📊 Data Model

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  background: string;
  archived: boolean;
}

interface List {
  id: string;
  projectId: string;
  title: string;
  order: number; // Fractional gap index (e.g. 1000, 2000)
  color?: string;
  archived: boolean;
}

interface Card {
  id: string;
  listId: string;
  projectId: string;
  title: string;
  description: string;
  order: number;
  labels: { id: string; name: string; color: string }[];
  dueDate: string | null; // YYYY-MM-DD
  checklist: { id: string; text: string; done: boolean }[];
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  cover: string | null;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
}

interface Drawing {
  id: string;
  projectId: string;
  name: string;
  background: { color: string; pattern: 'none' | 'lines' | 'grid' | 'dots'; gap: number };
  strokes: { tool: string; color: string; size: number; opacity: number; points: { x: number; y: number; pressure: number }[] }[];
  width: number;
  height: number;
  updatedAt: number;
}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
|---|---|
| `/` | Focus live search bar |
| `N` | Add new card in first list |
| `T` | Toggle Dark / Light theme |
| `W` | Open Whiteboard canvas |
| `Ctrl + Z` / `Cmd + Z` | Undo last card/list action |
| `Ctrl + Y` / `Shift + Z` | Redo action |
| `.` | Open radial bubble menu on focused card |
| `Esc` | Close open dialog or menu |
| `?` | Open keyboard shortcuts help |

---

## 🧪 Unit Testing

Run pure logic test suites using Node's native test runner:
```bash
node --test tests/*.test.js
```

---

## 🧩 How to Add New Features

1. **Add Repository Entity**: Define store name in `js/data/schema.js`, add migration in `js/data/migrations.js`, and create `js/data/repositories/<feature>-repo.js`.
2. **Add Store Actions**: In `js/core/store.js`, add action method and optional `commandManager.execute()` for undo/redo.
3. **Create Component**: Follow the `{ el, update, destroy }` pattern under `js/features/<feature>/`.
4. **Style**: Use design tokens from `css/tokens.css` and BEM logical properties. Keep each file under 250 lines.
