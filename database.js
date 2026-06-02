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

  await seedDatabase();
}

async function seedDatabase() {
  // Check if kids table is empty to perform seeding
  const kidsCount = await get('SELECT COUNT(*) as count FROM kids');
  if (kidsCount.count > 0) {
    logger.info('Database already has data. Skipping seed.');
    return;
  }

  logger.info('Seeding initial family data...');

  // Seed Kids with placeholder PINs (to be changed securely in the Parent Dashboard)
  const macPinData = hashPin('1111');
  const lucyPinData = hashPin('2222');

  const kids = [
    {
      name: 'Mac',
      avatar: '🚀',
      color_theme: 'blue',
      pin_hash: macPinData.hash,
      pin_salt: macPinData.salt
    },
    {
      name: 'Lucy',
      avatar: '🦄',
      color_theme: 'rose',
      pin_hash: lucyPinData.hash,
      pin_salt: lucyPinData.salt
    }
  ];

  for (const kid of kids) {
    await run(
      'INSERT INTO kids (name, avatar, color_theme, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?)',
      [kid.name, kid.avatar, kid.color_theme, kid.pin_hash, kid.pin_salt]
    );
  }

  // Get kids IDs
  const dbKids = await all('SELECT id, name FROM kids');
  const macId = dbKids.find((k) => k.name === 'Mac').id;
  const lucyId = dbKids.find((k) => k.name === 'Lucy').id;

  // Seed Chores`
  const chores = [
    {
      title: 'Put toys away',
      description: 'Put toys away before bed.',
      points: 30,
      schedule_type: 'daily',
      schedule_days: null,
      assigned_to: macId
    },
    {
      title: 'Plug in tablet',
      description: 'Plug in tablet before bed.',
      points: 5,
      schedule_type: 'daily',
      schedule_days: null,
      assigned_to: lucyId
    },
    {
      title: 'Empty the dishwasher as needed',
      description: 'Empty the dishwasher as needed',
      points: 25,
      schedule_type: 'daily',
      schedule_days: null,
      assigned_to: null
    },
    {
      title: 'Fold and put away laundry',
      description: 'Fold your clean laundry basket and put it in drawers.',
      points: 30,
      schedule_type: 'weekly',
      schedule_days: null,
      assigned_to: lucyId
    },
    {
      title: 'Fold towels',
      description: 'Fold all towels.',
      points: 30,
      schedule_type: 'weekly',
      schedule_days: null,
      assigned_to: macId
    },
    {
      title: 'Wipe eating areas after dinner',
      description: 'Wipe eating areas after dinner.',
      points: 15,
      schedule_type: 'daily',
      schedule_days: null,
      assigned_to: macId
    },
    {
      title: 'Water porch flowers',
      description: 'Water all the planters.',
      points: 20,
      schedule_type: 'alternate',
      schedule_days: '1',
      assigned_to: lucyId
    },
    {
      title: 'Vacuum the kitchen',
      description: 'Vacuum the kitchen floor thoroughly.',
      points: 20,
      schedule_type: 'alternate',
      schedule_days: null,
      assigned_to: lucyId
    },
    {
      title: 'Make sandwich at lunch',
      description: 'Practice and make your own PB & J for lunch.',
      points: 20,
      schedule_type: 'daily',
      schedule_days: null,
      assigned_to: lucyId
    }
  ];

  for (const chore of chores) {
    await run(
      'INSERT INTO chores (title, description, points, schedule_type, schedule_days, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
      [
        chore.title,
        chore.description,
        chore.points,
        chore.schedule_type,
        chore.schedule_days,
        chore.assigned_to
      ]
    );
  }

  // Seed Rewards
  const rewards = [
    {
      title: 'New Tablet',
      description: 'Get a brand-new tablet for our upcoming July trip!',
      points_cost: 1500
    }
  ];

  for (const reward of rewards) {
    await run('INSERT INTO rewards (title, description, points_cost) VALUES (?, ?, ?)', [
      reward.title,
      reward.description,
      reward.points_cost
    ]);
  }

  logger.info('Database successfully seeded!');
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
