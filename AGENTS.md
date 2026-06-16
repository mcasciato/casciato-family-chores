# Chore Quest Agent & Developer Guidelines

Welcome! This file acts as the repository-wide instructions and guidelines for any AI coding assistant (like Antigravity or Github Copilot) or human developer working on this codebase.

## Project Context

**Chore Quest** is a premium, family-oriented kid's chore tracking application designed to run on low-power devices like a Raspberry Pi, but deployable anywhere. It incentivizes kids to complete chores by earning points they can redeem for rewards.

- **License**: `GPL-3.0-only`
- **Application Architecture**:
  - **Backend**: Node.js Express server (`server.js`, `database.js`, `logger.js`).
  - **Frontend**: A React client located in the `client/` subdirectory.
  - **Database**: SQLite3 managed directly via SQL queries in `database.js`. Data is seeded using `seeds.json`.
  - **Deployment**: Configured for Docker (`Dockerfile`) and Fly.io (`fly.toml`).

---

## Agent Personas

When invoking agents or subagents, you can instruct them to load one of the following persona profiles located in `.github/agents/` to set their level of autonomy and quality checks:
* **Junior Engineer**: [.github/agents/junior-engineer.md](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/.github/agents/junior-engineer.md) (Task execution, styling, test writing, highly constrained scope).
* **Mid-Level Engineer**: [.github/agents/mid-engineer.md](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/.github/agents/mid-engineer.md) (Feature implementation, API connections, database queries).
* **Senior Engineer / Architect**: [.github/agents/senior-engineer.md](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/.github/agents/senior-engineer.md) (Architecture planning, quality gating, reviews, migrations).

---

## Coding Standards & Guidelines

### 1. General Principles

- **Maintain Documentation Integrity**: Keep existing license headers (`SPDX-License-Identifier`), comments, and docstrings intact unless specifically asked to change them.
- **Licensing**: Any new source code file must start with the standard GPL-3.0 header:
  ```javascript
  // SPDX-License-Identifier: GPL-3.0-or-later
  // Copyright (C) 2026 Michael Casciato
  ```
- **Error Handling**: Wrap asynchronous operations and database operations in proper try/catch blocks or promises, and log using the custom helper in `logger.js`.

### 2. Frontend Development (within `/client`)

- **Styling**: Prefer clean, beautiful Vanilla CSS tailored for premium aesthetics. Avoid raw plain colors (e.g., standard red or blue); use harmonious HSL palettes, smooth gradients, subtle micro-animations, and modern typography.
- **Responsiveness**: The app is designed to run on a Raspberry Pi screen (typically 800x480 or similar touchscreens), so the design must be highly responsive and touch-friendly.

### 3. Backend Development

- **Database**: Use the promise-wrapped helper functions `run`, `get`, `all`, and `transaction` exported by [database.js](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/database.js). Do not make direct un-promisified calls to the sqlite3 driver unless necessary.

---

## Available AI Skills

We maintain specialized agent skills and prompts in the `.github/skills/` directory.

### Conventional Commits Skill
- **File**: [.github/skills/conventional-commits.md](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/.github/skills/conventional-commits.md)
- **Purpose**: Guides the developer or AI agent on crafting proper Conventional Commit messages based on changes in the workspace.
- **Usage**: When preparing to commit, ask the AI to run/read the Conventional Commits skill to draft the message.

### Database Operations Skill
- **File**: [.github/skills/db-operations.md](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/.github/skills/db-operations.md)
- **Purpose**: Details the SQLite schema, query structures, and safe use of the database wrapper functions.

### UI Development & Aesthetics Skill
- **File**: [.github/skills/ui-development.md](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/.github/skills/ui-development.md)
- **Purpose**: Explains styling rules (Vanilla CSS, HSL palettes, transitions, and touch-target sizing for Raspberry Pi displays).

### Debugging & Troubleshooting Playbook
- **File**: [.github/skills/debugging-playbook.md](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/.github/skills/debugging-playbook.md)
- **Purpose**: Standardizes how agents inspect backend logs, query database state, and diagnose issues.

### PR & Code Review Quality Checklist
- **File**: [.github/skills/code-review.md](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/.github/skills/code-review.md)
- **Purpose**: Provides a self-verification checklist for licensing headers, error-handling safety, and UI aesthetics.

