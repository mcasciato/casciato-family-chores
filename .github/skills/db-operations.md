<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Michael Casciato -->

# Skill: Database Operations & Schema

Use this skill whenever you need to interact with the database, write SQLite queries, or modify data in Chore Quest.

---

## Database Driver & Helpers

All database operations are performed on an SQLite3 database via promise-wrapped helpers exported by [database.js](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/database.js).

### Helper APIs
* **`run(sql, params = [])`**: Runs `INSERT`, `UPDATE`, or `DELETE` statements. Resolves with `{ id, changes }`.
* **`get(sql, params = [])`**: Retrieves a single row.
* **`all(sql, params = [])`**: Retrieves multiple rows.
* **`transaction(async () => { ... })`**: Groups queries inside a `BEGIN TRANSACTION` and `COMMIT` or `ROLLBACK`.

> [!IMPORTANT]
> Do NOT use the raw `sqlite3` driver directly unless absolutely necessary. Always use the promise-wrapped helper functions.

---

## Schema Overview

### 1. `kids`
Tracks children profiles, their pins, and currently earned points.
* `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
* `name`: `TEXT UNIQUE NOT NULL`
* `avatar`: `TEXT NOT NULL`
* `points`: `INTEGER DEFAULT 0`
* `color_theme`: `TEXT DEFAULT 'purple'`
* `pin_hash`: `TEXT NOT NULL`
* `pin_salt`: `TEXT NOT NULL`

### 2. `chores`
Stores chore requirements and configurations.
* `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
* `title`: `TEXT NOT NULL`
* `description`: `TEXT`
* `points`: `INTEGER NOT NULL`
* `schedule_type`: `TEXT CHECK(schedule_type IN ('daily', 'weekly', 'custom', 'alternate')) DEFAULT 'daily'`
* `schedule_days`: `TEXT` (Comma-separated indices, e.g., `'1,3,5'`)
* `assigned_to`: `INTEGER REFERENCES kids(id) ON DELETE SET NULL` (NULL means assigned to everyone)
* `is_active`: `INTEGER DEFAULT 1` (Boolean: `1` or `0`)

### 3. `chore_completions`
Records completions submitted by kids.
* `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
* `chore_id`: `INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE`
* `kid_id`: `INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE`
* `completed_date`: `TEXT NOT NULL` (Format: `YYYY-MM-DD`)
* `status`: `TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending'`
* `completed_at`: `TEXT NOT NULL` (ISO timestamp)
* `approved_at`: `TEXT` (ISO timestamp)
* `feedback`: `TEXT`

### 4. `rewards`
Stores rewards that can be redeemed.
* `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
* `title`: `TEXT NOT NULL`
* `description`: `TEXT`
* `points_cost`: `INTEGER NOT NULL`
* `is_active`: `INTEGER DEFAULT 1` (Boolean: `1` or `0`)

### 5. `reward_redemptions`
Records redeemed rewards.
* `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
* `reward_id`: `INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE`
* `kid_id`: `INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE`
* `redeemed_at`: `TEXT NOT NULL` (ISO timestamp)
* `status`: `TEXT CHECK(status IN ('pending', 'fulfilled')) DEFAULT 'pending'`
* `fulfilled_at`: `TEXT` (ISO timestamp)

### 6. `settings`
Simple key-value configuration.
* `key`: `TEXT PRIMARY KEY`
* `value`: `TEXT NOT NULL`

---

## Best Practices & Examples

### Basic Query
```javascript
const db = require('./database');
const logger = require('./logger');

try {
  const kid = await db.get('SELECT * FROM kids WHERE name = ?', [name]);
} catch (err) {
  logger.error('Failed to get kid:', err);
}
```

### Performing Transactions
Always wrap multi-step changes (e.g. redeeming a reward and deducting points) inside a transaction helper.
```javascript
await db.transaction(async () => {
  // 1. Deduct points from kid
  const result = await db.run(
    'UPDATE kids SET points = points - ? WHERE id = ? AND points >= ?',
    [cost, kidId, cost]
  );
  if (result.changes === 0) {
    throw new Error('Insufficient points');
  }

  // 2. Insert redemption
  await db.run(
    'INSERT INTO reward_redemptions (reward_id, kid_id, redeemed_at) VALUES (?, ?, ?)',
    [rewardId, kidId, new Date().toISOString()]
  );
});
```
