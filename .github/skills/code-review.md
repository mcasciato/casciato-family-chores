<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Michael Casciato -->

# Skill: PR & Code Review Quality Checklist

Use this skill before completing a task or marking work as ready for review. This checklist guarantees that any code merged into Chore Quest meets licensing, styling, and coding standards.

---

## 1. Licensing & Headers Check
All source files added to this repository must include the proper SPDX header at the top of the file:
```javascript
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Michael Casciato
```
Ensure you have added this to any new `.js`, `.jsx`, `.css`, or build config files.

---

## 2. Code Quality & Standards
* **Error Handling**: Verify every asynchronous function or DB call is wrapped in a try/catch block and logged using [logger.js](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/logger.js).
* **Database Access**: Ensure database queries utilize the promise-wrapped helper methods in [database.js](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/database.js) and never raw callbacks.
* **No Stubs/TODOs**: Remove all placeholder comments or dead code from the implementation before declaring it finished.

---

## 3. Aesthetic & UI Review
* Ensure styles use Vanilla CSS variables, smooth transitions, and proper HSL values.
* Confirm that any newly added buttons or touchable elements meet the minimum $48\text{px} \times 48\text{px}$ touch target requirement.
* Verify responsiveness across small screens (flex layouts, adaptive margins/paddings).

---

## 4. Documentation
* Update [AGENTS.md](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/AGENTS.md) if new workflows, environment variables, or core components are introduced.
* Ensure any database schema updates are reflected in [db-operations.md](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/.github/skills/db-operations.md).
