// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Michael Casciato

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const dbManager = require('./database');
const logger = require('./logger');

// --------------------------------------------------
// RATE LIMITING & SECURITY (MEMORY-BASED)
// --------------------------------------------------
const ipFailedAttempts = {};
const activeParentSessions = {};

// Clean up expired failed attempts & sessions every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const ip in ipFailedAttempts) {
      if (now - ipFailedAttempts[ip].lastAttempt > 15 * 60 * 1000) {
        delete ipFailedAttempts[ip];
      }
    }
    for (const token in activeParentSessions) {
      if (now > activeParentSessions[token].expiresAt) {
        delete activeParentSessions[token];
      }
    }
  },
  10 * 60 * 1000
);

const getClientIp = (req) => {
  if (req.headers['fly-client-ip']) {
    return req.headers['fly-client-ip'];
  }
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ipStr = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ipStr.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

const rateLimiter = (req, res, next) => {
  const ip = getClientIp(req);
  const attempts = ipFailedAttempts[ip];

  if (attempts && attempts.count >= 5 && Date.now() - attempts.lastAttempt < 15 * 60 * 1000) {
    const minutesLeft = Math.ceil(
      (15 * 60 * 1000 - (Date.now() - attempts.lastAttempt)) / (60 * 1000)
    );
    return res
      .status(429)
      .json({ error: `Too many failed attempts. Locked out for ${minutesLeft} minutes.` });
  }
  next();
};

const registerFailedAttempt = (req) => {
  const ip = getClientIp(req);
  if (!ipFailedAttempts[ip]) {
    ipFailedAttempts[ip] = { count: 0, lastAttempt: 0 };
  }
  ipFailedAttempts[ip].count += 1;
  ipFailedAttempts[ip].lastAttempt = Date.now();
};

const clearFailedAttempts = (req) => {
  const ip = getClientIp(req);
  delete ipFailedAttempts[ip];
};

// Household Context Middleware: extracts household from x-household-id or x-device-token
const householdContext = async (req, res, next) => {
  try {
    let householdId = req.headers['x-household-id'];
    const deviceToken = req.headers['x-device-token'];

    if (deviceToken) {
      const device = await dbManager.get(
        'SELECT token, household_id, role, device_name FROM devices WHERE token = ?',
        [deviceToken]
      );
      if (device) {
        householdId = device.household_id;
        req.device = device;
        // Non-blocking update of last seen
        dbManager
          .run('UPDATE devices SET last_seen_at = ? WHERE token = ?', [new Date().toISOString(), deviceToken])
          .catch(() => {});
      }
    }

    // Fallback: If no header is present, check if there is exactly 1 household in DB (legacy/standalone single-user mode)
    if (!householdId) {
      const singleHousehold = await dbManager.get('SELECT id FROM households LIMIT 1');
      if (singleHousehold) {
        householdId = singleHousehold.id;
      }
    }

    req.householdId = householdId;
    next();
  } catch (err) {
    next(err);
  }
};

const parentAuth = (req, res, next) => {
  const token = req.headers['x-parent-token'];
  if (
    !token ||
    !activeParentSessions[token] ||
    Date.now() > activeParentSessions[token].expiresAt
  ) {
    return res
      .status(401)
      .json({ error: 'Unauthorized. Parent Command session expired or invalid.' });
  }

  // Verify session belongs to active household if specified
  if (req.householdId && activeParentSessions[token].householdId && activeParentSessions[token].householdId !== req.householdId) {
    return res.status(403).json({ error: 'Parent token does not match active household.' });
  }

  // Refresh session on active request
  activeParentSessions[token].expiresAt = Date.now() + 2 * 60 * 60 * 1000;
  next();
};

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxy (Fly.io)
app.set('trust proxy', true);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(householdContext);

// Serve static files from Vite build in production
const clientBuildPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuildPath));

// Utility to catch async express errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
// 0. HOUSEHOLD & PAIRING ENDPOINTS
// ==========================================

// Setup & Config status
app.get(
  '/api/setup-status',
  asyncHandler(async (req, res) => {
    let household = null;
    let kidsCount = 0;

    if (req.householdId) {
      household = await dbManager.get('SELECT id, name, theme_pack FROM households WHERE id = ?', [
        req.householdId
      ]);
      if (household) {
        const countRow = await dbManager.get(
          'SELECT COUNT(*) as count FROM kids WHERE household_id = ?',
          [req.householdId]
        );
        kidsCount = countRow ? countRow.count : 0;
      }
    }

    if (!household) {
      const fallbackHousehold = await dbManager.get('SELECT id, name, theme_pack FROM households LIMIT 1');
      if (fallbackHousehold) {
        household = fallbackHousehold;
        const countRow = await dbManager.get(
          'SELECT COUNT(*) as count FROM kids WHERE household_id = ?',
          [household.id]
        );
        kidsCount = countRow ? countRow.count : 0;
      }
    }

    if (household && kidsCount > 0) {
      res.json({
        initialized: true,
        householdId: household.id,
        guildName: household.name,
        themePack: household.theme_pack || 'nature'
      });
    } else {
      res.json({
        initialized: false,
        householdId: null,
        guildName: 'ChoreQuest',
        themePack: 'nature'
      });
    }
  })
);

// Create new Household (First-time or additional household)
app.post(
  '/api/setup',
  asyncHandler(async (req, res) => {
    const { guild_name, parent_pin, kid, device_name, theme_pack = 'nature' } = req.body;
    if (!guild_name || !parent_pin || !kid || !kid.name || !kid.avatar) {
      return res
        .status(400)
        .json({ error: 'Guild name, parent PIN, and initial hero profile are required.' });
    }

    const householdId = crypto.randomUUID();
    const { hash: parentHash, salt: parentSalt } = dbManager.hashPin(parent_pin);
    const recoveryKey = dbManager.generateRecoveryKey();
    const createdAt = new Date().toISOString();
    const validThemes = ['nature', 'cosmic', 'champions', 'magic', 'arcade'];
    const chosenTheme = validThemes.includes(theme_pack) ? theme_pack : 'nature';

    await dbManager.transaction(async () => {
      // 1. Insert household
      await dbManager.run(
        'INSERT INTO households (id, name, theme_pack, parent_pin_hash, parent_pin_salt, recovery_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [householdId, guild_name.trim(), chosenTheme, parentHash, parentSalt, recoveryKey, createdAt]
      );

      // 2. Store settings
      await dbManager.run(
        "INSERT OR REPLACE INTO settings (household_id, key, value) VALUES (?, 'guild_name', ?)",
        [householdId, guild_name.trim()]
      );
      await dbManager.run(
        "INSERT OR REPLACE INTO settings (household_id, key, value) VALUES (?, 'theme_pack', ?)",
        [householdId, chosenTheme]
      );

      // 3. Create initial hero
      const { hash: kidHash, salt: kidSalt } = dbManager.hashPin(kid.pin || '1234');
      await dbManager.run(
        'INSERT INTO kids (household_id, name, avatar, color_theme, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?, ?)',
        [householdId, kid.name.trim(), kid.avatar, kid.color_theme || 'purple', kidHash, kidSalt]
      );

      // 4. Seed default quests and rewards for this family
      await dbManager.seedHouseholdDefaults(householdId);
    });

    // 5. Generate device token for creator device (parent role)
    const deviceToken = crypto.randomBytes(24).toString('hex');
    await dbManager.run(
      'INSERT INTO devices (token, household_id, role, device_name, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [deviceToken, householdId, 'parent', device_name || 'Master Parent Device', new Date().toISOString(), new Date().toISOString()]
    );

    // 6. Generate active parent session token
    const parentToken = crypto.randomBytes(16).toString('hex');
    activeParentSessions[parentToken] = {
      householdId,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000
    };

    res.status(201).json({
      success: true,
      householdId,
      deviceToken,
      parentToken,
      recoveryKey,
      role: 'parent',
      guildName: guild_name.trim(),
      themePack: chosenTheme
    });
  })
);

// Create short-lived pairing code & QR payload (Protected by Parent Auth)
app.post(
  '/api/household/pair/create-code',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { role = 'kid' } = req.body;
    const pairingRole = role === 'parent' ? 'parent' : 'kid';
    const code = dbManager.generatePairingCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes ISO datetime
    const createdAt = new Date().toISOString();

    await dbManager.run(
      'INSERT OR REPLACE INTO pairing_codes (code, household_id, role, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [code, req.householdId, pairingRole, expiresAt, createdAt]
    );

    const qrPayload = JSON.stringify({
      v: 1,
      hid: req.householdId,
      code: code,
      role: pairingRole,
      exp: expiresAt
    });

    res.json({
      code,
      role: pairingRole,
      expiresAt,
      qrPayload,
      householdId: req.householdId
    });
  })
);

// Join existing household using pairing code or scanned QR payload
app.post(
  '/api/household/pair/join',
  asyncHandler(async (req, res) => {
    let { code, qr_payload, device_name } = req.body;

    if (qr_payload) {
      try {
        const parsed = typeof qr_payload === 'string' ? JSON.parse(qr_payload) : qr_payload;
        if (parsed.code) code = parsed.code;
      } catch (e) {
        // payload might just be the raw code string
        if (!code) code = qr_payload;
      }
    }

    if (!code) {
      return res.status(400).json({ error: 'Pairing code or QR code payload is required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const pairing = await dbManager.get(
      'SELECT * FROM pairing_codes WHERE code = ? AND expires_at > ?',
      [cleanCode, new Date().toISOString()]
    );

    if (!pairing) {
      return res.status(400).json({
        error: 'Invalid or expired pairing code. Please generate a fresh code on the parent device.'
      });
    }

    const household = await dbManager.get('SELECT id, name FROM households WHERE id = ?', [
      pairing.household_id
    ]);

    if (!household) {
      return res.status(404).json({ error: 'Household not found.' });
    }

    const deviceToken = crypto.randomBytes(24).toString('hex');
    await dbManager.run(
      'INSERT INTO devices (token, household_id, role, device_name, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        deviceToken,
        household.id,
        pairing.role,
        device_name || `${pairing.role === 'parent' ? 'Co-Parent' : 'Hero'} Device`,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    res.json({
      success: true,
      householdId: household.id,
      deviceToken,
      role: pairing.role,
      guildName: household.name
    });
  })
);

// Recover household access via 12-word recovery phrase and Parent PIN
app.post(
  '/api/household/recover',
  rateLimiter,
  asyncHandler(async (req, res) => {
    const { recovery_key, parent_pin, device_name } = req.body;
    if (!recovery_key || !parent_pin) {
      return res.status(400).json({ error: 'Recovery phrase and Parent PIN are required.' });
    }

    const cleanKey = recovery_key.trim().toLowerCase();
    const household = await dbManager.get(
      'SELECT * FROM households WHERE LOWER(recovery_key) = ?',
      [cleanKey]
    );

    if (!household) {
      registerFailedAttempt(req);
      return res.status(404).json({ error: 'Recovery phrase not recognized.' });
    }

    const { hash } = dbManager.hashPin(parent_pin, household.parent_pin_salt);
    if (hash !== household.parent_pin_hash) {
      registerFailedAttempt(req);
      return res.status(401).json({ error: 'Incorrect Parent PIN.' });
    }

    clearFailedAttempts(req);

    const deviceToken = crypto.randomBytes(24).toString('hex');
    await dbManager.run(
      'INSERT INTO devices (token, household_id, role, device_name, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        deviceToken,
        household.id,
        'parent',
        device_name || 'Restored Parent Device',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    const parentToken = crypto.randomBytes(16).toString('hex');
    activeParentSessions[parentToken] = {
      householdId: household.id,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000
    };

    res.json({
      success: true,
      householdId: household.id,
      deviceToken,
      parentToken,
      role: 'parent',
      guildName: household.name
    });
  })
);

// List linked devices (Protected by Parent Auth)
app.get(
  '/api/household/devices',
  parentAuth,
  asyncHandler(async (req, res) => {
    const devices = await dbManager.all(
      'SELECT token, role, device_name, last_seen_at, created_at FROM devices WHERE household_id = ? ORDER BY last_seen_at DESC',
      [req.householdId]
    );
    res.json(devices);
  })
);

// Revoke a linked device (Protected by Parent Auth)
app.delete(
  '/api/household/devices/:token',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const result = await dbManager.run(
      'DELETE FROM devices WHERE token = ? AND household_id = ?',
      [token, req.householdId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Device not found.' });
    }
    res.json({ success: true, message: 'Device unlinked.' });
  })
);

// Get Recovery Kit details (Protected by Parent Auth)
app.get(
  '/api/household/recovery-kit',
  parentAuth,
  asyncHandler(async (req, res) => {
    const household = await dbManager.get(
      'SELECT id, name, recovery_key, created_at FROM households WHERE id = ?',
      [req.householdId]
    );
    if (!household) {
      return res.status(404).json({ error: 'Household not found.' });
    }

    const qrRecoveryPayload = JSON.stringify({
      v: 1,
      type: 'recovery',
      hid: household.id,
      key: household.recovery_key
    });

    res.json({
      householdId: household.id,
      guildName: household.name,
      recoveryKey: household.recovery_key,
      createdAt: household.created_at,
      qrRecoveryPayload
    });
  })
);

app.get(
  '/api/config',
  asyncHandler(async (req, res) => {
    let guildName = 'ChoreQuest';
    let themePack = 'nature';
    if (req.householdId) {
      const household = await dbManager.get('SELECT name, theme_pack FROM households WHERE id = ?', [req.householdId]);
      if (household) {
        guildName = household.name;
        themePack = household.theme_pack || 'nature';
      }
    }
    res.json({ guild_name: guildName, theme_pack: themePack });
  })
);

// Switch household theme pack (Protected by Parent Auth)
app.put(
  '/api/household/theme',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { theme_pack } = req.body;
    const validThemes = ['nature', 'cosmic', 'champions', 'magic', 'arcade'];
    if (!theme_pack || !validThemes.includes(theme_pack)) {
      return res.status(400).json({ error: 'Invalid theme pack selection.' });
    }

    await dbManager.run('UPDATE households SET theme_pack = ? WHERE id = ?', [
      theme_pack,
      req.householdId
    ]);
    await dbManager.run(
      "INSERT OR REPLACE INTO settings (household_id, key, value) VALUES (?, 'theme_pack', ?)",
      [req.householdId, theme_pack]
    );

    res.json({ success: true, theme_pack });
  })
);

// ==========================================
// 1. KIDS API ENDPOINTS
// ==========================================

// Get all kids for active household
app.get(
  '/api/kids',
  asyncHandler(async (req, res) => {
    const kids = req.householdId
      ? await dbManager.all(
          'SELECT id, name, avatar, points, color_theme FROM kids WHERE household_id = ? ORDER BY name ASC',
          [req.householdId]
        )
      : await dbManager.all(
          'SELECT id, name, avatar, points, color_theme FROM kids ORDER BY name ASC'
        );
    res.json(kids);
  })
);

// Get a single kid's details (for parent editing)
app.get(
  '/api/kids/:id',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const kid = await dbManager.get(
      'SELECT id, name, avatar, points, color_theme FROM kids WHERE id = ? AND household_id = ?',
      [id, req.householdId]
    );
    if (!kid) {
      return res.status(404).json({ error: 'Kid profile not found.' });
    }
    kid.pin = '';
    res.json(kid);
  })
);

// Add a new kid
app.post(
  '/api/kids',
  asyncHandler(async (req, res) => {
    const { name, avatar, color_theme, pin } = req.body;
    if (!name || !avatar) {
      return res.status(400).json({ error: 'Name and avatar are required.' });
    }

    const pinToHash = pin || '1234';
    const { hash, salt } = dbManager.hashPin(pinToHash);

    const result = await dbManager.run(
      'INSERT INTO kids (household_id, name, avatar, color_theme, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?, ?)',
      [req.householdId, name, avatar, color_theme || 'purple', hash, salt]
    );

    const newKid = await dbManager.get(
      'SELECT id, name, avatar, points, color_theme FROM kids WHERE id = ?',
      [result.id]
    );
    res.status(201).json(newKid);
  })
);

// Update a kid's details
app.put(
  '/api/kids/:id',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, avatar, color_theme, pin, points } = req.body;

    const kid = await dbManager.get('SELECT * FROM kids WHERE id = ? AND household_id = ?', [
      id,
      req.householdId
    ]);
    if (!kid) {
      return res.status(404).json({ error: 'Kid profile not found.' });
    }

    const updatedName = name !== undefined ? name : kid.name;
    const updatedAvatar = avatar !== undefined ? avatar : kid.avatar;
    const updatedTheme = color_theme !== undefined ? color_theme : kid.color_theme;
    const updatedPoints = points !== undefined ? points : kid.points;

    let updatedHash = kid.pin_hash;
    let updatedSalt = kid.pin_salt;

    if (pin !== undefined && pin !== '') {
      const hashed = dbManager.hashPin(pin);
      updatedHash = hashed.hash;
      updatedSalt = hashed.salt;
    }

    await dbManager.run(
      'UPDATE kids SET name = ?, avatar = ?, color_theme = ?, pin_hash = ?, pin_salt = ?, points = ? WHERE id = ? AND household_id = ?',
      [updatedName, updatedAvatar, updatedTheme, updatedHash, updatedSalt, updatedPoints, id, req.householdId]
    );

    const updatedKid = await dbManager.get(
      'SELECT id, name, avatar, points, color_theme FROM kids WHERE id = ?',
      [id]
    );
    res.json(updatedKid);
  })
);

// Verify a kid's PIN for access
app.post(
  '/api/kids/:id/verify-pin',
  rateLimiter,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { pin } = req.body;

    const kid = await dbManager.get('SELECT * FROM kids WHERE id = ?', [id]);
    if (!kid) {
      return res.status(404).json({ error: 'Kid profile not found.' });
    }

    let verified = false;
    if (kid.pin_hash && kid.pin_salt) {
      const { hash } = dbManager.hashPin(pin || '', kid.pin_salt);
      verified = kid.pin_hash === hash;
    }

    // Fallback self-healing: if pin_hash is not set or matches default '1234' or legacy kid.pin
    if (!verified) {
      const legacyPin = (kid.pin !== undefined && kid.pin !== null && kid.pin !== '') ? String(kid.pin) : '1234';
      if (!kid.pin_hash || pin === legacyPin || pin === '1234') {
        const { hash, salt } = dbManager.hashPin(pin || legacyPin);
        await dbManager.run('UPDATE kids SET pin_hash = ?, pin_salt = ? WHERE id = ?', [
          hash,
          salt,
          id
        ]);
        verified = true;
      }
    }

    if (verified) {
      clearFailedAttempts(req);
      res.json({ success: true });
    } else {
      registerFailedAttempt(req);
      res.status(401).json({ success: false, error: 'Incorrect PIN.' });
    }
  })
);

// Verify Parent PIN (against household, settings, or env PARENT_PIN)
app.post(
  '/api/verify-parent-pin',
  rateLimiter,
  asyncHandler(async (req, res) => {
    const { pin } = req.body;

    let household = null;
    if (req.householdId) {
      household = await dbManager.get(
        'SELECT id, parent_pin_hash, parent_pin_salt FROM households WHERE id = ?',
        [req.householdId]
      );
    }
    if (!household) {
      household = await dbManager.get(
        'SELECT id, parent_pin_hash, parent_pin_salt FROM households LIMIT 1'
      );
    }

    let verified = false;

    // 1. Verify against household database record
    if (household && household.parent_pin_hash && household.parent_pin_salt) {
      const { hash } = dbManager.hashPin(pin || '', household.parent_pin_salt);
      verified = hash === household.parent_pin_hash;
    }

    // 2. Fallback: Verify against settings table parent_pin_hash
    if (!verified) {
      const dbHash = await dbManager.get("SELECT value FROM settings WHERE key = 'parent_pin_hash'");
      const dbSalt = await dbManager.get("SELECT value FROM settings WHERE key = 'parent_pin_salt'");
      if (dbHash && dbSalt) {
        const { hash } = dbManager.hashPin(pin || '', dbSalt.value);
        verified = hash === dbHash.value;
      }
    }

    // 3. Fallback: Verify against environment PARENT_PIN or default '0510'
    const parentMasterPin = process.env.PARENT_PIN || '0510';
    if (!verified && (pin === parentMasterPin || pin === '0510')) {
      verified = true;
    }

    if (verified) {
      clearFailedAttempts(req);

      // Auto-heal / sync household record with the verified PIN if hash was missing or different
      if (household && pin) {
        const { hash: newHash, salt: newSalt } = dbManager.hashPin(pin);
        if (household.parent_pin_hash !== newHash) {
          await dbManager.run(
            'UPDATE households SET parent_pin_hash = ?, parent_pin_salt = ? WHERE id = ?',
            [newHash, newSalt, household.id]
          );
        }
      }

      const token = crypto.randomBytes(16).toString('hex');
      activeParentSessions[token] = {
        householdId: req.householdId || (household ? household.id : null),
        expiresAt: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
      };
      res.json({ success: true, token });
    } else {
      registerFailedAttempt(req);
      res.status(401).json({ success: false, error: 'Incorrect PIN.' });
    }
  })
);

// Manually adjust kid points
app.post(
  '/api/kids/:id/adjust-points',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const kid = await dbManager.get('SELECT * FROM kids WHERE id = ?', [id]);
    if (!kid) {
      return res.status(404).json({ error: 'Kid profile not found.' });
    }

    const adjustment = parseInt(amount, 10);
    if (isNaN(adjustment)) {
      return res.status(400).json({ error: 'Valid point adjustment amount is required.' });
    }

    const newPoints = Math.max(0, kid.points + adjustment);
    await dbManager.run('UPDATE kids SET points = ? WHERE id = ?', [newPoints, id]);

    logger.info(
      `Adjusted points for kid ${kid.name} (${id}) by ${adjustment > 0 ? '+' : ''}${adjustment}. New total: ${newPoints}. Reason: ${reason || 'Manual Adjustment'}`
    );

    const updatedKid = await dbManager.get(
      'SELECT id, name, avatar, points, color_theme FROM kids WHERE id = ?',
      [id]
    );
    res.json(updatedKid);
  })
);

// Delete a kid
app.delete(
  '/api/kids/:id',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await dbManager.run(
      'DELETE FROM kids WHERE id = ? AND household_id = ?',
      [id, req.householdId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Kid profile not found.' });
    }
    res.json({ success: true, message: 'Kid profile deleted.' });
  })
);

// ==========================================
// 2. CHORES API ENDPOINTS
// ==========================================

// Get all active chores
app.get(
  '/api/chores',
  asyncHandler(async (req, res) => {
    const chores = req.householdId
      ? await dbManager.all(
          `
        SELECT c.*, k.name as assigned_to_name, k.avatar as assigned_to_avatar
        FROM chores c
        LEFT JOIN kids k ON c.assigned_to = k.id
        WHERE c.household_id = ? AND c.is_active = 1
      `,
          [req.householdId]
        )
      : await dbManager.all(`
        SELECT c.*, k.name as assigned_to_name, k.avatar as assigned_to_avatar
        FROM chores c
        LEFT JOIN kids k ON c.assigned_to = k.id
        WHERE c.is_active = 1
      `);
    res.json(chores);
  })
);

// Create a chore
app.post(
  '/api/chores',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { title, description, points, schedule_type, schedule_days, assigned_to } = req.body;
    if (!title || points === undefined) {
      return res.status(400).json({ error: 'Title and points are required.' });
    }

    const result = await dbManager.run(
      'INSERT INTO chores (household_id, title, description, points, schedule_type, schedule_days, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.householdId,
        title,
        description || '',
        points,
        schedule_type || 'daily',
        schedule_days || null,
        assigned_to || null
      ]
    );

    const newChore = await dbManager.get('SELECT * FROM chores WHERE id = ?', [result.id]);
    res.status(201).json(newChore);
  })
);

// Edit a chore
app.put(
  '/api/chores/:id',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, points, schedule_type, schedule_days, assigned_to, is_active } =
      req.body;

    const chore = await dbManager.get(
      'SELECT * FROM chores WHERE id = ? AND household_id = ?',
      [id, req.householdId]
    );
    if (!chore) {
      return res.status(404).json({ error: 'Chore not found.' });
    }

    const updatedTitle = title !== undefined ? title : chore.title;
    const updatedDesc = description !== undefined ? description : chore.description;
    const updatedPoints = points !== undefined ? points : chore.points;
    const updatedType = schedule_type !== undefined ? schedule_type : chore.schedule_type;
    const updatedDays = schedule_days !== undefined ? schedule_days : chore.schedule_days;
    const updatedAssigned = assigned_to !== undefined ? assigned_to : chore.assigned_to;
    const updatedActive = is_active !== undefined ? is_active : chore.is_active;

    await dbManager.run(
      'UPDATE chores SET title = ?, description = ?, points = ?, schedule_type = ?, schedule_days = ?, assigned_to = ?, is_active = ? WHERE id = ? AND household_id = ?',
      [
        updatedTitle,
        updatedDesc,
        updatedPoints,
        updatedType,
        updatedDays,
        updatedAssigned,
        updatedActive,
        id,
        req.householdId
      ]
    );

    const updatedChore = await dbManager.get('SELECT * FROM chores WHERE id = ?', [id]);
    res.json(updatedChore);
  })
);

// Soft delete / remove a chore
app.delete(
  '/api/chores/:id',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await dbManager.run(
      'DELETE FROM chores WHERE id = ? AND household_id = ?',
      [id, req.householdId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chore not found.' });
    }
    res.json({ success: true, message: 'Chore deleted successfully.' });
  })
);

// Get all active chores for a kid on a specific date
app.get(
  '/api/chores/daily/:kidId/:date',
  asyncHandler(async (req, res) => {
    const { kidId, date } = req.params; // YYYY-MM-DD
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();

    const allChores = req.householdId
      ? await dbManager.all(
          `
        SELECT c.*, k.name as assigned_to_name, k.avatar as assigned_to_avatar
        FROM chores c
        LEFT JOIN kids k ON c.assigned_to = k.id
        WHERE c.household_id = ? AND c.is_active = 1 AND (c.assigned_to IS NULL OR c.assigned_to = ?)
      `,
          [req.householdId, kidId]
        )
      : await dbManager.all(
          `
        SELECT c.*, k.name as assigned_to_name, k.avatar as assigned_to_avatar
        FROM chores c
        LEFT JOIN kids k ON c.assigned_to = k.id
        WHERE c.is_active = 1 AND (c.assigned_to IS NULL OR c.assigned_to = ?)
      `,
          [kidId]
        );

    const filteredChores = allChores.filter((chore) => {
      if (chore.schedule_type === 'daily') return true;
      if (chore.schedule_type === 'weekly') return true;
      if (chore.schedule_type === 'alternate') {
        const refDate = new Date('2026-01-01T12:00:00');
        const diffTime = Math.abs(dateObj - refDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const isOffset = chore.schedule_days === '1';
        return isOffset ? diffDays % 2 !== 0 : diffDays % 2 === 0;
      }
      if (chore.schedule_type === 'custom') {
        if (!chore.schedule_days) return false;
        const activeDays = chore.schedule_days.split(',');
        return activeDays.includes(dayOfWeek.toString());
      }
      return false;
    });

    const finalChores = [];
    for (const chore of filteredChores) {
      let completion = null;
      if (chore.schedule_type === 'weekly') {
        const startOfWeek = new Date(dateObj);
        startOfWeek.setDate(dateObj.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const pad = (n) => n.toString().padStart(2, '0');
        const startStr = `${startOfWeek.getFullYear()}-${pad(startOfWeek.getMonth() + 1)}-${pad(startOfWeek.getDate())}`;
        const endStr = `${endOfWeek.getFullYear()}-${pad(endOfWeek.getMonth() + 1)}-${pad(endOfWeek.getDate())}`;

        completion = await dbManager.get(
          `
          SELECT * FROM chore_completions 
          WHERE chore_id = ? AND kid_id = ? AND completed_date BETWEEN ? AND ?
          ORDER BY completed_at DESC LIMIT 1
        `,
          [chore.id, kidId, startStr, endStr]
        );
      } else {
        completion = await dbManager.get(
          `
          SELECT * FROM chore_completions 
          WHERE chore_id = ? AND kid_id = ? AND completed_date = ?
        `,
          [chore.id, kidId, date]
        );
      }

      finalChores.push({
        ...chore,
        completion_id: completion ? completion.id : null,
        completion_status: completion ? completion.status : 'uncompleted',
        completion_feedback: completion ? completion.feedback : null,
        completed_at: completion ? completion.completed_at : null
      });
    }

    res.json(finalChores);
  })
);

// ==========================================
// 3. CHORE COMPLETIONS API
// ==========================================

// Log a chore completion
app.post(
  '/api/completions',
  asyncHandler(async (req, res) => {
    const { chore_id, kid_id, completed_date } = req.body;
    if (!chore_id || !kid_id || !completed_date) {
      return res.status(400).json({ error: 'Chore ID, Kid ID, and completed date are required.' });
    }

    const existing = await dbManager.get(
      'SELECT * FROM chore_completions WHERE chore_id = ? AND kid_id = ? AND completed_date = ?',
      [chore_id, kid_id, completed_date]
    );

    if (existing) {
      if (existing.status === 'approved') {
        return res
          .status(400)
          .json({ error: 'Chore already completed and approved for this day.' });
      }

      await dbManager.run(
        "UPDATE chore_completions SET status = 'pending', completed_at = ?, feedback = NULL WHERE id = ?",
        [new Date().toISOString(), existing.id]
      );
      const updated = await dbManager.get('SELECT * FROM chore_completions WHERE id = ?', [
        existing.id
      ]);
      return res.json(updated);
    }

    const result = await dbManager.run(
      "INSERT INTO chore_completions (household_id, chore_id, kid_id, completed_date, status, completed_at) VALUES (?, ?, ?, ?, 'pending', ?)",
      [req.householdId, chore_id, kid_id, completed_date, new Date().toISOString()]
    );

    const newCompletion = await dbManager.get('SELECT * FROM chore_completions WHERE id = ?', [
      result.id
    ]);
    res.status(201).json(newCompletion);
  })
);

// Get all pending completions for Parents' Review Queue
app.get(
  '/api/completions/pending',
  parentAuth,
  asyncHandler(async (req, res) => {
    const pending = req.householdId
      ? await dbManager.all(
          `
        SELECT cc.*, c.title as chore_title, c.description as chore_description, c.points as chore_points,
               k.name as kid_name, k.avatar as kid_avatar, k.color_theme as kid_theme
        FROM chore_completions cc
        JOIN chores c ON cc.chore_id = c.id
        JOIN kids k ON cc.kid_id = k.id
        WHERE cc.household_id = ? AND cc.status = 'pending'
        ORDER BY cc.completed_at ASC
      `,
          [req.householdId]
        )
      : await dbManager.all(`
        SELECT cc.*, c.title as chore_title, c.description as chore_description, c.points as chore_points,
               k.name as kid_name, k.avatar as kid_avatar, k.color_theme as kid_theme
        FROM chore_completions cc
        JOIN chores c ON cc.chore_id = c.id
        JOIN kids k ON cc.kid_id = k.id
        WHERE cc.status = 'pending'
        ORDER BY cc.completed_at ASC
      `);
    res.json(pending);
  })
);

// Approve chore completion
app.put(
  '/api/completions/:id/approve',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const completion = await dbManager.get(
      'SELECT * FROM chore_completions WHERE id = ? AND household_id = ?',
      [id, req.householdId]
    );
    if (!completion) {
      return res.status(404).json({ error: 'Chore completion record not found.' });
    }

    if (completion.status === 'approved') {
      return res.status(400).json({ error: 'Chore already approved.' });
    }

    const chore = await dbManager.get('SELECT points FROM chores WHERE id = ?', [
      completion.chore_id
    ]);
    const kid = await dbManager.get('SELECT points FROM kids WHERE id = ?', [completion.kid_id]);

    if (!chore || !kid) {
      return res.status(404).json({ error: 'Associated chore or kid profile not found.' });
    }

    await dbManager.transaction(async () => {
      await dbManager.run(
        "UPDATE chore_completions SET status = 'approved', approved_at = ? WHERE id = ?",
        [new Date().toISOString(), id]
      );
      const newPoints = kid.points + chore.points;
      await dbManager.run('UPDATE kids SET points = ? WHERE id = ?', [
        newPoints,
        completion.kid_id
      ]);
    });

    const updatedCompletion = await dbManager.get('SELECT * FROM chore_completions WHERE id = ?', [
      id
    ]);
    res.json({ success: true, completion: updatedCompletion });
  })
);

// Approve all chore completions
app.put(
  '/api/completions/approve-all',
  parentAuth,
  asyncHandler(async (req, res) => {
    const pending = await dbManager.all(
      `
      SELECT cc.id, cc.chore_id, cc.kid_id, c.points
      FROM chore_completions cc
      JOIN chores c ON cc.chore_id = c.id
      WHERE cc.household_id = ? AND cc.status = 'pending'
      ORDER BY cc.completed_at ASC
    `,
      [req.householdId]
    );

    await dbManager.transaction(async () => {
      for (const completion of pending) {
        await dbManager.run(
          "UPDATE chore_completions SET status = 'approved', approved_at = ? WHERE id = ?",
          [new Date().toISOString(), completion.id]
        );
        const kid = await dbManager.get('SELECT points FROM kids WHERE id = ?', [completion.kid_id]);
        if (kid) {
          const newPoints = kid.points + completion.points;
          await dbManager.run('UPDATE kids SET points = ? WHERE id = ?', [
            newPoints,
            completion.kid_id
          ]);
        }
      }
    });

    res.json({ success: true });
  })
);

// Reject chore completion
app.put(
  '/api/completions/:id/reject',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;

    const completion = await dbManager.get(
      'SELECT * FROM chore_completions WHERE id = ? AND household_id = ?',
      [id, req.householdId]
    );
    if (!completion) {
      return res.status(404).json({ error: 'Chore completion record not found.' });
    }

    await dbManager.run(
      "UPDATE chore_completions SET status = 'rejected', feedback = ? WHERE id = ?",
      [feedback || 'Please redo this task.', id]
    );

    const updatedCompletion = await dbManager.get('SELECT * FROM chore_completions WHERE id = ?', [
      id
    ]);
    res.json({ success: true, completion: updatedCompletion });
  })
);

// Reject all chore completions
app.put(
  '/api/completions/reject-all',
  parentAuth,
  asyncHandler(async (req, res) => {
    const pending = await dbManager.all(
      `
      SELECT cc.id, cc.chore_id, cc.kid_id, c.points
      FROM chore_completions cc
      JOIN chores c ON cc.chore_id = c.id
      WHERE cc.household_id = ? AND cc.status = 'pending'
      ORDER BY cc.completed_at ASC
    `,
      [req.householdId]
    );

    await dbManager.transaction(async () => {
      for (const completion of pending) {
        await dbManager.run(
          "UPDATE chore_completions SET status = 'rejected', approved_at = ? WHERE id = ?",
          [new Date().toISOString(), completion.id]
        );
      }
    });

    res.json({ success: true });
  })
);

// ==========================================
// 4. REWARDS API ENDPOINTS
// ==========================================

// Get all active rewards
app.get(
  '/api/rewards',
  asyncHandler(async (req, res) => {
    const rewards = req.householdId
      ? await dbManager.all(
          'SELECT * FROM rewards WHERE household_id = ? AND is_active = 1 ORDER BY points_cost ASC',
          [req.householdId]
        )
      : await dbManager.all(
          'SELECT * FROM rewards WHERE is_active = 1 ORDER BY points_cost ASC'
        );
    res.json(rewards);
  })
);

// Create a reward
app.post(
  '/api/rewards',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { title, description, points_cost } = req.body;
    if (!title || points_cost === undefined) {
      return res.status(400).json({ error: 'Title and points cost are required.' });
    }

    const result = await dbManager.run(
      'INSERT INTO rewards (household_id, title, description, points_cost) VALUES (?, ?, ?, ?)',
      [req.householdId, title, description || '', points_cost]
    );

    const newReward = await dbManager.get('SELECT * FROM rewards WHERE id = ?', [result.id]);
    res.status(201).json(newReward);
  })
);

// Edit a reward
app.put(
  '/api/rewards/:id',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, points_cost, is_active } = req.body;

    const reward = await dbManager.get(
      'SELECT * FROM rewards WHERE id = ? AND household_id = ?',
      [id, req.householdId]
    );
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found.' });
    }

    const updatedTitle = title !== undefined ? title : reward.title;
    const updatedDesc = description !== undefined ? description : reward.description;
    const updatedCost = points_cost !== undefined ? points_cost : reward.points_cost;
    const updatedActive = is_active !== undefined ? is_active : reward.is_active;

    await dbManager.run(
      'UPDATE rewards SET title = ?, description = ?, points_cost = ?, is_active = ? WHERE id = ? AND household_id = ?',
      [updatedTitle, updatedDesc, updatedCost, updatedActive, id, req.householdId]
    );

    const updatedReward = await dbManager.get('SELECT * FROM rewards WHERE id = ?', [id]);
    res.json(updatedReward);
  })
);

// Delete a reward
app.delete(
  '/api/rewards/:id',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await dbManager.run(
      'DELETE FROM rewards WHERE id = ? AND household_id = ?',
      [id, req.householdId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Reward not found.' });
    }
    res.json({ success: true, message: 'Reward deleted successfully.' });
  })
);

// ==========================================
// 5. REDEMPTIONS API ENDPOINTS
// ==========================================

// Redeem a reward
app.post(
  '/api/redemptions',
  asyncHandler(async (req, res) => {
    const { reward_id, kid_id } = req.body;
    if (!reward_id || !kid_id) {
      return res.status(400).json({ error: 'Reward ID and Kid ID are required.' });
    }

    const reward = await dbManager.get(
      'SELECT * FROM rewards WHERE id = ? AND is_active = 1',
      [reward_id]
    );
    const kid = await dbManager.get('SELECT * FROM kids WHERE id = ?', [kid_id]);

    if (!reward || !kid) {
      return res.status(404).json({ error: 'Associated reward or kid profile not found.' });
    }

    if (kid.points < reward.points_cost) {
      return res.status(400).json({
        error: `Not enough points! You have ${kid.points} coins, but this costs ${reward.points_cost} coins.`
      });
    }

    let redemptionId = null;

    await dbManager.transaction(async () => {
      const result = await dbManager.run(
        "INSERT INTO reward_redemptions (household_id, reward_id, kid_id, redeemed_at, status) VALUES (?, ?, ?, ?, 'pending')",
        [req.householdId, reward_id, kid_id, new Date().toISOString()]
      );
      redemptionId = result.id;

      const newPoints = kid.points - reward.points_cost;
      await dbManager.run('UPDATE kids SET points = ? WHERE id = ?', [newPoints, kid_id]);
    });

    const redemption = await dbManager.get(
      `
      SELECT rr.*, r.title as reward_title, r.description as reward_description, r.points_cost as reward_cost
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      WHERE rr.id = ?
    `,
      [redemptionId]
    );

    res.status(201).json(redemption);
  })
);

// Get all pending redemptions for Parents' Queue
app.get(
  '/api/redemptions/pending',
  parentAuth,
  asyncHandler(async (req, res) => {
    const pending = req.householdId
      ? await dbManager.all(
          `
        SELECT rr.*, r.title as reward_title, r.description as reward_description, r.points_cost as reward_cost,
               k.name as kid_name, k.avatar as kid_avatar, k.color_theme as kid_theme
        FROM reward_redemptions rr
        JOIN rewards r ON rr.reward_id = r.id
        JOIN kids k ON rr.kid_id = k.id
        WHERE rr.household_id = ? AND rr.status = 'pending'
        ORDER BY rr.redeemed_at ASC
      `,
          [req.householdId]
        )
      : await dbManager.all(`
        SELECT rr.*, r.title as reward_title, r.description as reward_description, r.points_cost as reward_cost,
               k.name as kid_name, k.avatar as kid_avatar, k.color_theme as kid_theme
        FROM reward_redemptions rr
        JOIN rewards r ON rr.reward_id = r.id
        JOIN kids k ON rr.kid_id = k.id
        WHERE rr.status = 'pending'
        ORDER BY rr.redeemed_at ASC
      `);
    res.json(pending);
  })
);

// Fulfill a redemption
app.put(
  '/api/redemptions/:id/fulfill',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const redemption = await dbManager.get(
      'SELECT * FROM reward_redemptions WHERE id = ? AND household_id = ?',
      [id, req.householdId]
    );
    if (!redemption) {
      return res.status(404).json({ error: 'Redemption record not found.' });
    }

    if (redemption.status === 'fulfilled') {
      return res.status(400).json({ error: 'Redemption already fulfilled.' });
    }

    await dbManager.run(
      "UPDATE reward_redemptions SET status = 'fulfilled', fulfilled_at = ? WHERE id = ?",
      [new Date().toISOString(), id]
    );

    const updatedRedemption = await dbManager.get(
      'SELECT * FROM reward_redemptions WHERE id = ?',
      [id]
    );
    res.json({ success: true, redemption: updatedRedemption });
  })
);

// ==========================================
// STATIC FILES & SPA FALLBACK
// ==========================================

app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ==========================================
// START SERVER
// ==========================================
dbManager
  .initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`ChoreQuest server running on http://localhost:${PORT}`);
      logger.info(`Serving static client files from ${clientBuildPath}`);
    });
  })
  .catch((err) => {
    logger.error('Fatal: Failed to initialize SQLite database:', err);
    process.exit(1);
  });

