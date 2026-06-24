# Dugout — Claude Rules

## Session context

At the start of each conversation, read all memory files listed in `/Users/mattfurtado/.claude/projects/-Users-mattfurtado-dev-dugout/memory/MEMORY.md` — especially session summaries — before doing any work.

At the end of each conversation, write a session summary memory file named `session_YYYY_MM_DD.md` (using today's date) covering what was built, changed, or decided. Update `MEMORY.md` to index it. If a summary for today already exists, append to it rather than creating a new file.

## Code style

### Imports
- Sort import statements alphabetically by module path within each group (third-party packages first, then internal `../` imports)
- Sort named imports (`{ A, B, C }`) alphabetically within the curly braces

### Props
- Sort TypeScript interface and type property names alphabetically
- Sort JSX attribute names alphabetically (event handlers like `onClick` sort alongside the rest)
