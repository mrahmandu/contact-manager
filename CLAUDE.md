# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vanilla HTML/CSS/JS contact management app with zero dependencies. No build step, no framework — open `index.html` directly in a browser.

## Architecture

**Three files, one IIFE:**

- `index.html` — Markup including two modal overlays (add/edit form, delete confirmation)
- `style.css` — All styles with CSS custom properties in `:root` for theming; responsive at 600px breakpoint
- `app.js` — Entire app logic wrapped in a single IIFE `(() => { ... })()`

**app.js internal structure (top to bottom):**

1. **Data layer** — CRUD functions (`getContacts`, `saveContacts`, `addContact`, `updateContact`, `deleteContact`) operating on localStorage under key `"contacts"`
2. **DOM references** — All `getElementById` calls cached at module scope
3. **Photo handling** — FileReader-based base64 encoding with 1 MB limit (`MAX_PHOTO_SIZE`); photos stored inline in the contact object
4. **Validation** — `validateForm()` with inline error messages; name required, email/phone format-checked via regex
5. **Rendering** — Single `render()` function reads all contacts from localStorage, filters by search query, sorts, and rebuilds the entire `#contact-list` innerHTML
6. **Event listeners** — Delegated click handling on `#contact-list` for edit/delete buttons; Escape key closes modals

**Data model** (each contact in localStorage array):
```
{ id, name, email, phone, address, notes, photo (base64 data URL), createdAt (ISO string) }
```

## Key Conventions

- HTML is escaped via `escapeHtml()` (DOM-based, not regex) before insertion to prevent XSS
- IDs are generated with `crypto.randomUUID()`
- No external dependencies — keep it that way unless explicitly requested
- All state lives in localStorage; there is no in-memory cache (contacts are re-read from localStorage on every render)
