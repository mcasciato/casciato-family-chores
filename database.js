// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Michael Casciato

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('./logger');

const WORD_LIST = [
  'acorn', 'amber', 'anchor', 'badger', 'beacon', 'breeze', 'bridge', 'bronze',
  'canyon', 'castle', 'cedar', 'clover', 'comet', 'copper', 'coral', 'cosmos',
  'crater', 'crystal', 'delta', 'dragon', 'eagle', 'ember', 'falcon', 'feather',
  'fern', 'flame', 'forest', 'fossil', 'galaxy', 'garden', 'geyser', 'glacier',
  'harbor', 'haven', 'hawk', 'island', 'jasper', 'jungle', 'lagoon', 'lantern',
  'laurel', 'legend', 'lotus', 'meadow', 'meteor', 'nebula', 'oasis', 'ocean',
  'orbit', 'palace', 'pebble', 'planet', 'portal', 'prairie', 'prism', 'puzzle',
  'quest', 'quartz', 'radium', 'raven', 'reef', 'ridge', 'river', 'rocket',
  'ruby', 'safari', 'shadow', 'shield', 'sierra', 'silver', 'solar', 'spark',
  'spiral', 'spring', 'spruce', 'stream', 'summit', 'sunburst', 'temple', 'thunder',
  'timber', 'topaz', 'trail', 'valley', 'velvet', 'vessel', 'vortex', 'voyage',
  'willow', 'wind', 'wizard', 'zenith', 'zephyr', 'zodiac', 'aurora', 'citadel'
];

function generateRecoveryKey() {
  const words = [];
  for (let i = 0; i < 12; i++) {
    const randomIndex = crypto.randomInt(0, WORD_LIST.length);
    words.push(WORD_LIST[randomIndex]);
  }
  return words.join(' ');
}

function generatePairingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid easily confused chars (I, 1, O, 0)
  let code = 'CQ-';
  for (let i = 0; i < 4; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

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

// Check if a column exists in a given table
async function hasColumn(table, column) {
  try {
    const columns = await all(`PRAGMA table_info(${table})`);
    return columns.some((col) => col.name === column);
  } catch {
    return false;
  }
}

// Database Initialization & Migration
async function initDatabase() {
  logger.info('Initializing database schemas...');

  // 1. Households Table
  await run(`
    CREATE TABLE IF NOT EXISTS households (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      theme_pack TEXT DEFAULT 'nature',
      parent_pin_hash TEXT NOT NULL,
      parent_pin_salt TEXT NOT NULL,
      recovery_key TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  // 2. Pairing Codes Table
  await run(`
    CREATE TABLE IF NOT EXISTS pairing_codes (
      code TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      role TEXT CHECK(role IN ('parent', 'kid')) DEFAULT 'kid',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // 3. Devices Table
  await run(`
    CREATE TABLE IF NOT EXISTS devices (
      token TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      role TEXT CHECK(role IN ('parent', 'kid')) DEFAULT 'kid',
      device_name TEXT,
      last_seen_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // 4. Kids Table
  await run(`
    CREATE TABLE IF NOT EXISTS kids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      color_theme TEXT DEFAULT 'purple',
      pin_hash TEXT NOT NULL,
      pin_salt TEXT NOT NULL
    )
  `);

  // 5. Chores Table
  await run(`
    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      points INTEGER NOT NULL,
      schedule_type TEXT CHECK(schedule_type IN ('daily', 'weekly', 'custom', 'alternate')) DEFAULT 'daily',
      schedule_days TEXT,
      assigned_to INTEGER REFERENCES kids(id) ON DELETE SET NULL,
      is_active INTEGER DEFAULT 1
    )
  `);

  // 6. Chore Completions Table
  await run(`
    CREATE TABLE IF NOT EXISTS chore_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
      chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
      kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
      completed_date TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      completed_at TEXT NOT NULL,
      approved_at TEXT,
      feedback TEXT
    )
  `);

  // 7. Rewards Table
  await run(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1
    )
  `);

  // 8. Reward Redemptions Table
  await run(`
    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
      reward_id INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
      kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
      redeemed_at TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'fulfilled')) DEFAULT 'pending',
      fulfilled_at TEXT
    )
  `);

  // 9. Settings Table
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      household_id TEXT,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (household_id, key)
    )
  `);

  // Run schema migrations for existing columns if needed
  await runMigrations();
}

async function runMigrations() {
  const tablesWithHousehold = [
    'kids',
    'chores',
    'chore_completions',
    'rewards',
    'reward_redemptions'
  ];

  for (const table of tablesWithHousehold) {
    const hasHId = await hasColumn(table, 'household_id');
    if (!hasHId) {
      logger.info(`Migrating table ${table}: adding household_id column...`);
      try {
        await run(`ALTER TABLE ${table} ADD COLUMN household_id TEXT REFERENCES households(id) ON DELETE CASCADE`);
      } catch (err) {
        logger.error(`Failed to alter table ${table}:`, err.message);
      }
    }
  }

  // Check if households has theme_pack
  const hasThemePack = await hasColumn('households', 'theme_pack');
  if (!hasThemePack) {
    try {
      await run("ALTER TABLE households ADD COLUMN theme_pack TEXT DEFAULT 'nature'");
    } catch (err) {
      logger.warn('Failed to alter households for theme_pack:', err.message);
    }
  }

  // Ensure kids table has pin_hash and pin_salt columns
  const hasKidPinHash = await hasColumn('kids', 'pin_hash');
  if (!hasKidPinHash) {
    logger.info('Migrating table kids: adding pin_hash column...');
    try {
      await run('ALTER TABLE kids ADD COLUMN pin_hash TEXT');
    } catch (err) {
      logger.error('Failed to add pin_hash column to kids:', err.message);
    }
  }

  const hasKidPinSalt = await hasColumn('kids', 'pin_salt');
  if (!hasKidPinSalt) {
    logger.info('Migrating table kids: adding pin_salt column...');
    try {
      await run('ALTER TABLE kids ADD COLUMN pin_salt TEXT');
    } catch (err) {
      logger.error('Failed to add pin_salt column to kids:', err.message);
    }
  }

  // Check if legacy unpartitioned data exists
  try {
    const unpartitionedKids = await get('SELECT COUNT(*) as count FROM kids WHERE household_id IS NULL');
    if (unpartitionedKids && unpartitionedKids.count > 0) {
      logger.info('Found existing legacy records without household_id. Migrating to a default household...');
      
      const legacyGuildNameSetting = await get("SELECT value FROM settings WHERE key = 'guild_name'");
      const legacyPinHash = await get("SELECT value FROM settings WHERE key = 'parent_pin_hash'");
      const legacyPinSalt = await get("SELECT value FROM settings WHERE key = 'parent_pin_salt'");

      const defaultHouseholdId = crypto.randomUUID();
      const guildName = legacyGuildNameSetting ? legacyGuildNameSetting.value : 'ChoreQuest Guild';
      const defaultPin = process.env.PARENT_PIN || '0510';
      const defaultHashed = hashPin(defaultPin);
      const pinHash = legacyPinHash ? legacyPinHash.value : defaultHashed.hash;
      const pinSalt = legacyPinSalt ? legacyPinSalt.value : defaultHashed.salt;
      const recoveryKey = generateRecoveryKey();
      const createdAt = new Date().toISOString();

      await run(
        'INSERT OR IGNORE INTO households (id, name, parent_pin_hash, parent_pin_salt, recovery_key, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [defaultHouseholdId, guildName, pinHash, pinSalt, recoveryKey, createdAt]
      );

      // Create a master device token for the migrated household
      const masterDeviceToken = crypto.randomBytes(24).toString('hex');
      await run(
        'INSERT OR IGNORE INTO devices (token, household_id, role, device_name, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [masterDeviceToken, defaultHouseholdId, 'parent', 'Master Parent Device', new Date().toISOString(), new Date().toISOString()]
      );

      for (const table of tablesWithHousehold) {
        await run(`UPDATE ${table} SET household_id = ? WHERE household_id IS NULL`, [defaultHouseholdId]);
      }

      // Update settings table with household_id
      const hasOldSettingsWithoutHId = await hasColumn('settings', 'household_id');
      if (hasOldSettingsWithoutHId) {
        await run('UPDATE settings SET household_id = ? WHERE household_id IS NULL', [defaultHouseholdId]);
      }

      logger.info(`Legacy data migrated successfully to household ${defaultHouseholdId} with recovery key: "${recoveryKey}"`);
    }
  } catch (err) {
    logger.warn('Migration check completed with notice:', err.message);
  }

  // Populate any null or empty pin_hash/pin_salt in kids table
  try {
    const hasLegacyPinCol = await hasColumn('kids', 'pin');
    const selectQuery = hasLegacyPinCol
      ? 'SELECT id, pin, pin_hash, pin_salt FROM kids WHERE pin_hash IS NULL OR pin_hash = ""'
      : 'SELECT id, pin_hash, pin_salt FROM kids WHERE pin_hash IS NULL OR pin_hash = ""';
    
    const unhashedKids = await all(selectQuery);
    if (unhashedKids && unhashedKids.length > 0) {
      logger.info(`Migrating ${unhashedKids.length} kid record(s) without pin hashes...`);
      for (const k of unhashedKids) {
        const kidPin = (hasLegacyPinCol && k.pin) ? String(k.pin) : '1234';
        const { hash, salt } = hashPin(kidPin);
        await run('UPDATE kids SET pin_hash = ?, pin_salt = ? WHERE id = ?', [hash, salt, k.id]);
      }
      logger.info('Kid records successfully populated with hashed PIN credentials.');
    }
  } catch (err) {
    logger.warn('Kid PIN migration notice:', err.message);
  }
}

async function seedHouseholdDefaults(householdId) {
  if (process.env.SKIP_SEEDING === 'true') {
    logger.info('SKIP_SEEDING is enabled. Skipping default household chores & rewards seeding.');
    return;
  }
  try {
    const seedsPath = path.join(__dirname, 'seeds.json');
    if (!fs.existsSync(seedsPath)) {
      return;
    }
    const seedsData = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

    // Seed Chores
    if (Array.isArray(seedsData.chores)) {
      for (const chore of seedsData.chores) {
        await run(
          'INSERT INTO chores (household_id, title, description, points, schedule_type, schedule_days, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            householdId,
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
        await run(
          'INSERT INTO rewards (household_id, title, description, points_cost) VALUES (?, ?, ?, ?)',
          [householdId, reward.title, reward.description || '', reward.points_cost]
        );
      }
    }
  } catch (err) {
    logger.error('Failed to seed household defaults:', err);
  }
}

module.exports = {
  db,
  initDatabase,
  run,
  get,
  all,
  transaction,
  hashPin,
  generateRecoveryKey,
  generatePairingCode,
  seedHouseholdDefaults
};

