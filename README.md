## Project: 11ty static site (minimal)

This repository builds a small static website with Eleventy (11ty) and compiles Sass into CSS which is then inlined into the generated HTML.

Short summary
- Eleventy reads files from `src/` and writes HTML into `dist/`.
- Sass source is at `sass/main.scss` and is compiled to `dist/styles.css` before Eleventy runs.
- A custom Eleventy transform reads `dist/styles.css`, injects it into the `<head>` as a `<style>` block, then uses `juice` to inline styles into the HTML elements.

Quick commands (macOS / zsh)

Install dependencies:

```bash
cd /Users/preslav/Projects/webpage
npm install
```

Build (produce `dist/`):

```bash
npm run build
```

Serve and develop:

```bash
npm run dev
```

What the scripts do
- `build:sass` — compiles `sass/main.scss` → `dist/styles.css` using `sass`.
- `watch:sass` — watches `sass/main.scss` and recompiles CSS on changes.
- `clean:css` — removes old CSS files, maps, and `.scss` from `dist/`.
- `build:eleventy` — runs Eleventy to produce HTML in `dist/`.
- `build` — runs the Sass build, then Eleventy, then removes the generated CSS files (the CSS is inlined into HTML).
- `serve` — runs Eleventy in serve/watch mode on port 8081.
- `watch` — watches `src/` and `sass/` and triggers a full `npm run build` on changes.
- `dev` — cleans old CSS, compiles Sass once, then runs `watch:sass` and `serve` in parallel. This ensures CSS is always available and automatically recompiled during development.

Where to edit styles
- Edit `sass/main.scss`. During development (`npm run dev`), changes are automatically compiled and the page reloads. For production builds, run `npm run build`.

How CSS inlining works (implementation notes)
- `.eleventy.js` registers an Eleventy transform called `inline-css`.
- That transform looks for `dist/styles.css` and, if present, removes the `<link href="/styles.css">` tag from the generated HTML, inserts a `<style>` block with the compiled CSS into `<head>`, then calls `juice` to inline CSS into the markup. This produces standalone HTML files that don't rely on an external stylesheet.

Bibliography / collections
- The project uses `bibtex-parse-js` to parse `src/assets/bibliography.bib` and registers Eleventy collections (`papers`, `books`, `articles`). See `.eleventy.js` for the parsing and collection rules.

Developer contract (short)
- Inputs: `src/` content and `sass/main.scss`.
- Output: static HTML files in `dist/` with styles inlined (no external `styles.css` required).
- Errors: if `dist/styles.css` is not present when Eleventy runs, the transform logs a warning and the HTML is produced without inlined stylesheet.

Edge cases and notes
- The `dev` script now cleans old CSS, compiles Sass, then runs Sass watch and Eleventy serve in parallel. This ensures CSS is always available and avoids "CSS file not found" warnings.
- The inline transform uses a robust regex to remove the `<link ... href="/styles.css">` tag; if you add multiple CSS link tags or change file names, update the transform accordingly.
- The `rm -f` cleanup is POSIX and works on macOS. On Windows, you would need to adapt the cleanup (e.g., use `rimraf`).

If you'd like
- I can add a small test that validates the built HTML contains `style` tags and no `link rel="stylesheet" href="/styles.css"` occurrences, or add cross-platform cleanup with `rimraf`.

Contact / further changes
If you want the CSS preserved in `dist/` (e.g., to serve externally), we can remove the cleanup step from `build` and/or add a flag `--preserve-css` to the build pipeline.

---
Generated and updated documentation to explain the build and where to edit styles and bibliography.

