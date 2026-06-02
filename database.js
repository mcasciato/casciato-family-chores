// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Michael Casciato

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('./logger');

function hashPin(pin, salt) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(pin, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

const dbPath =
  process.env.DATABASE_PATH ||
  (process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace('file://', '')
    : path.join(__dirname, 'database.sqlite'));

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Error opening database:', err.message);
  } else {
    logger.info('Connected to SQLite database at:', dbPath);
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        logger.error('Failed to enable foreign keys:', pragmaErr.message);
      }
    });
  }
});

// Helper functions wrapping sqlite3 in Promises
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Transaction helper
async function transaction(queriesFn) {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        db.run('BEGIN TRANSACTION');
        const result = await queriesFn();
        db.run('COMMIT');
        resolve(result);
      } catch (err) {
        db.run('ROLLBACK');
        reject(err);
      }
    });
  });
}

// Database Initialization
async function initDatabase() {
  logger.info('Initializing database schemas...');

  // 1. Kids Table
  await run(`
    CREATE TABLE IF NOT EXISTS kids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      avatar TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      color_theme TEXT DEFAULT 'purple',
      pin_hash TEXT NOT NULL,
      pin_salt TEXT NOT NULL
    )
  `);

  // 2. Chores Table
  await run(`
    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      points INTEGER NOT NULL,
      schedule_type TEXT CHECK(schedule_type IN ('daily', 'weekly', 'custom', 'alternate')) DEFAULT 'daily',
      schedule_days TEXT, -- Comma separated indices '1,3,5' for custom schedule
      assigned_to INTEGER REFERENCES kids(id) ON DELETE SET NULL, -- Null means assigned to all
      is_active INTEGER DEFAULT 1
    )
  `);

  // 3. Chore Completions Table
  await run(`
    CREATE TABLE IF NOT EXISTS chore_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
      kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
      completed_date TEXT NOT NULL, -- YYYY-MM-DD
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      completed_at TEXT NOT NULL, -- ISO timestamp
      approved_at TEXT, -- ISO timestamp
      feedback TEXT
    )
  `);

  // 4. Rewards Table
  await run(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1
    )
  `);

  // 5. Reward Redemptions Table
  await run(`
    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reward_id INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
      kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
      redeemed_at TEXT NOT NULL, -- ISO timestamp
      status TEXT CHECK(status IN ('pending', 'fulfilled')) DEFAULT 'pending',
      fulfilled_at TEXT -- ISO timestamp
    )
  `);

  // 6. Settings Table (key-value storage)
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await seedDatabase();
}

async function seedDatabase() {
  if (process.env.SKIP_SEEDING === 'true') {
    logger.info('SKIP_SEEDING is enabled. Skipping default database seeding.');
    return;
  }

  // Check if kids table is empty to perform seeding
  const kidsCount = await get('SELECT COUNT(*) as count FROM kids');
  if (kidsCount.count > 0) {
    logger.info('Database already has data. Skipping seed.');
    return;
  }

  logger.info('Seeding default household data...');

  try {
    const seedsPath = path.join(__dirname, 'seeds.json');
    if (!fs.existsSync(seedsPath)) {
      logger.warn('seeds.json file not found. Skipping seeding.');
      return;
    }
    const seedsData = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

    // Seed Chores
    if (Array.isArray(seedsData.chores)) {
      for (const chore of seedsData.chores) {
        await run(
          'INSERT INTO chores (title, description, points, schedule_type, schedule_days, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
          [
            chore.title,
            chore.description || '',
            chore.points,
            chore.schedule_type || 'daily',
            chore.schedule_days || null,
            null
          ]
        );
      }
    }

    // Seed Rewards
    if (Array.isArray(seedsData.rewards)) {
      for (const reward of seedsData.rewards) {
        await run('INSERT INTO rewards (title, description, points_cost) VALUES (?, ?, ?)', [
          reward.title,
          reward.description || '',
          reward.points_cost
        ]);
      }
    }

    logger.info('Database successfully seeded!');
  } catch (err) {
    logger.error('Failed to seed database from seeds.json:', err);
  }
}

module.exports = {
  db,
  initDatabase,
  run,
  get,
  all,
  transaction,
  hashPin
};
