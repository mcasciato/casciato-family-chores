<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Michael Casciato -->

# Skill: Debugging & Troubleshooting Playbook

Use this skill when you encounter runtime errors, failing api endpoints, database locks, or unexpected application state in Chore Quest.

---

## 1. Inspecting Application Logs

Always start by examining log outputs to identify the cause of the failure. The application uses a custom logger in [logger.js](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/logger.js).

* **Server Console Logs**: Check stdout/stderr of the server process (e.g. running under Docker or npm start).
* **Format**: Look for tags `[INFO]`, `[WARN]`, `[ERROR]`, or `[DEBUG]` along with ISO timestamps.
* **Troubleshooting Logs**: Ensure `DEBUG=true` is set in the environment variables to view verbose query/transaction details.

---

## 2. Inspecting the Database Directives

For database issues, query the SQLite database (`database.sqlite`) to verify content or status directly.

* Use sqlite3 CLI or run a script inside the workspace to inspect rows.
* Check if foreign keys constraints are violated (as foreign keys are explicitly enabled with `PRAGMA foreign_keys = ON;`).
* Confirm whether database migrations or seeds need to be reset by checking the presence/value of rows in the `kids` or `settings` tables.

---

## 3. Client-Server Communication

If the frontend and backend are out of sync:
* Verify the backend server is running and reachable on its configured port (usually `localhost:5000` or defined in `.env`).
* Inspect network requests for `500 Internal Server Error` or CORS issues.
* Check database records for values that might cause serialization errors in API responses.
