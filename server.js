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

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
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
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!ipFailedAttempts[ip]) {
    ipFailedAttempts[ip] = { count: 0, lastAttempt: 0 };
  }
  ipFailedAttempts[ip].count += 1;
  ipFailedAttempts[ip].lastAttempt = Date.now();
};

const clearFailedAttempts = (req) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  delete ipFailedAttempts[ip];
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
  // Refresh session on active request
  activeParentSessions[token].expiresAt = Date.now() + 2 * 60 * 60 * 1000;
  next();
};

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files from Vite build in production
const clientBuildPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuildPath));

// Utility to catch async express errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
// 1. KIDS API ENDPOINTS
// ==========================================

// Get all kids
app.get(
  '/api/kids',
  asyncHandler(async (req, res) => {
    const kids = await dbManager.all(
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
      'SELECT id, name, avatar, points, color_theme FROM kids WHERE id = ?',
      [id]
    );
    if (!kid) {
      return res.status(404).json({ error: 'Kid profile not found.' });
    }
    // Return empty string for pin so frontend starts with an empty/masked input
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

    // Hash the provided pin or fallback to a standard non-sensitive placeholder '1234'
    const pinToHash = pin || '1234';
    const { hash, salt } = dbManager.hashPin(pinToHash);

    const result = await dbManager.run(
      'INSERT INTO kids (name, avatar, color_theme, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?)',
      [name, avatar, color_theme || 'purple', hash, salt]
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

    const kid = await dbManager.get('SELECT * FROM kids WHERE id = ?', [id]);
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
      'UPDATE kids SET name = ?, avatar = ?, color_theme = ?, pin_hash = ?, pin_salt = ?, points = ? WHERE id = ?',
      [updatedName, updatedAvatar, updatedTheme, updatedHash, updatedSalt, updatedPoints, id]
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

    const kid = await dbManager.get('SELECT pin_hash, pin_salt FROM kids WHERE id = ?', [id]);
    if (!kid) {
      return res.status(404).json({ error: 'Kid profile not found.' });
    }

    const { hash } = dbManager.hashPin(pin || '', kid.pin_salt);

    if (kid.pin_hash === hash) {
      clearFailedAttempts(req);
      res.json({ success: true });
    } else {
      registerFailedAttempt(req);
      res.status(401).json({ success: false, error: 'Incorrect PIN.' });
    }
  })
);

// Verify Parent PIN (against master environment/fallback PIN)
app.post(
  '/api/verify-parent-pin',
  rateLimiter,
  asyncHandler(async (req, res) => {
    const { pin } = req.body;
    const parentMasterPin = process.env.PARENT_PIN || '0510';

    if (pin === parentMasterPin) {
      clearFailedAttempts(req);
      // Generate secure session token
      const token = crypto.randomBytes(16).toString('hex');
      activeParentSessions[token] = {
        expiresAt: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
      };
      res.json({ success: true, token });
    } else {
      registerFailedAttempt(req);
      res.status(401).json({ success: false, error: 'Incorrect PIN.' });
    }
  })
);

// Delete a kid
app.delete(
  '/api/kids/:id',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await dbManager.run('DELETE FROM kids WHERE id = ?', [id]);
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
    const chores = await dbManager.all(`
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
      'INSERT INTO chores (title, description, points, schedule_type, schedule_days, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
      [
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

    const chore = await dbManager.get('SELECT * FROM chores WHERE id = ?', [id]);
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
      'UPDATE chores SET title = ?, description = ?, points = ?, schedule_type = ?, schedule_days = ?, assigned_to = ?, is_active = ? WHERE id = ?',
      [
        updatedTitle,
        updatedDesc,
        updatedPoints,
        updatedType,
        updatedDays,
        updatedAssigned,
        updatedActive,
        id
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
    // Let's do a hard delete to keep database clean
    const result = await dbManager.run('DELETE FROM chores WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chore not found.' });
    }
    res.json({ success: true, message: 'Chore deleted successfully.' });
  })
);

// Get all active chores for a kid on a specific date, matching completions
app.get(
  '/api/chores/daily/:kidId/:date',
  asyncHandler(async (req, res) => {
    const { kidId, date } = req.params; // YYYY-MM-DD

    // Parse weekday index (0-6, where 0 is Sunday)
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay(); // 0-6

    // 1. Get all active chores that are either assigned to this kid OR assigned to all (NULL)
    const allChores = await dbManager.all(
      `
    SELECT c.*, k.name as assigned_to_name, k.avatar as assigned_to_avatar
    FROM chores c
    LEFT JOIN kids k ON c.assigned_to = k.id
    WHERE c.is_active = 1 AND (c.assigned_to IS NULL OR c.assigned_to = ?)
  `,
      [kidId]
    );

    // 2. Filter chores by their scheduling schedule
    const filteredChores = allChores.filter((chore) => {
      if (chore.schedule_type === 'daily') return true;
      if (chore.schedule_type === 'weekly') {
        // For simple weekly chores, we show them every day, but they can only be completed once per calendar week
        // (or we can let the child check it off on any day of the week). Let's return true, and the UI can show if it has been completed this week.
        return true;
      }
      if (chore.schedule_type === 'alternate') {
        // "Every other day" schedule calculated from a fixed reference date
        const refDate = new Date('2026-01-01T12:00:00');
        const diffTime = Math.abs(dateObj - refDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const isOffset = chore.schedule_days === '1';
        return isOffset ? diffDays % 2 !== 0 : diffDays % 2 === 0;
      }
      if (chore.schedule_type === 'custom') {
        // schedule_days is a comma separated string of day indices, e.g. '1,3,5' (Mon, Wed, Fri)
        // Note: standard JS getDay() is 0 (Sunday) to 6 (Saturday).
        // Let's store weekday mappings in schedule_days: 0 (Sun), 1 (Mon), 2 (Tue), 3 (Wed), 4 (Thu), 5 (Fri), 6 (Sat)
        if (!chore.schedule_days) return false;
        const activeDays = chore.schedule_days.split(',');
        return activeDays.includes(dayOfWeek.toString());
      }
      return false;
    });

    // 3. Attach completion status for each of the selected chores for this specific kid and date
    const finalChores = [];
    for (const chore of filteredChores) {
      let completion = null;
      if (chore.schedule_type === 'weekly') {
        // Find any completion within the same calendar week of the target date
        // For simplicity in SQLite, let's look for completions in the last 7 days, or we can find completion in the current YYYY-MM-DD's week.
        // Let's get the start and end of week date strings.
        const startOfWeek = new Date(dateObj);
        startOfWeek.setDate(dateObj.getDate() - dayOfWeek); // Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

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
        // Daily or Custom schedule - matches specific completed_date
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

// Log a chore completion (Submits for approval)
app.post(
  '/api/completions',
  asyncHandler(async (req, res) => {
    const { chore_id, kid_id, completed_date } = req.body;
    if (!chore_id || !kid_id || !completed_date) {
      return res.status(400).json({ error: 'Chore ID, Kid ID, and completed date are required.' });
    }

    // Check if completion already exists for daily/custom
    const existing = await dbManager.get(
      'SELECT * FROM chore_completions WHERE chore_id = ? AND kid_id = ? AND completed_date = ?',
      [chore_id, kid_id, completed_date]
    );

    if (existing) {
      // If it was rejected, we allow logging again (resubmit). If pending or approved, we shouldn't overwrite.
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
      "INSERT INTO chore_completions (chore_id, kid_id, completed_date, status, completed_at) VALUES (?, ?, ?, 'pending', ?)",
      [chore_id, kid_id, completed_date, new Date().toISOString()]
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
    const pending = await dbManager.all(`
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

// Approve chore completion (releases gold coins!)
app.put(
  '/api/completions/:id/approve',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const completion = await dbManager.get('SELECT * FROM chore_completions WHERE id = ?', [id]);
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

    // Run transaction to update status and add points
    await dbManager.transaction(async () => {
      // 1. Update completion record
      await dbManager.run(
        "UPDATE chore_completions SET status = 'approved', approved_at = ? WHERE id = ?",
        [new Date().toISOString(), id]
      );
      // 2. Add points to kid
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

// Reject chore completion (sends feedback back)
app.put(
  '/api/completions/:id/reject',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;

    const completion = await dbManager.get('SELECT * FROM chore_completions WHERE id = ?', [id]);
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

// ==========================================
// 4. REWARDS API ENDPOINTS
// ==========================================

// Get all active rewards
app.get(
  '/api/rewards',
  asyncHandler(async (req, res) => {
    const rewards = await dbManager.all(
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
      'INSERT INTO rewards (title, description, points_cost) VALUES (?, ?, ?)',
      [title, description || '', points_cost]
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

    const reward = await dbManager.get('SELECT * FROM rewards WHERE id = ?', [id]);
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found.' });
    }

    const updatedTitle = title !== undefined ? title : reward.title;
    const updatedDesc = description !== undefined ? description : reward.description;
    const updatedCost = points_cost !== undefined ? points_cost : reward.points_cost;
    const updatedActive = is_active !== undefined ? is_active : reward.is_active;

    await dbManager.run(
      'UPDATE rewards SET title = ?, description = ?, points_cost = ?, is_active = ? WHERE id = ?',
      [updatedTitle, updatedDesc, updatedCost, updatedActive, id]
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
    const result = await dbManager.run('DELETE FROM rewards WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Reward not found.' });
    }
    res.json({ success: true, message: 'Reward deleted successfully.' });
  })
);

// ==========================================
// 5. REDEMPTIONS API ENDPOINTS
// ==========================================

// Redeem a reward (Deducts points immediately, sets status to pending)
app.post(
  '/api/redemptions',
  asyncHandler(async (req, res) => {
    const { reward_id, kid_id } = req.body;
    if (!reward_id || !kid_id) {
      return res.status(400).json({ error: 'Reward ID and Kid ID are required.' });
    }

    const reward = await dbManager.get('SELECT * FROM rewards WHERE id = ? AND is_active = 1', [
      reward_id
    ]);
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

    // Run transaction to log redemption and deduct points
    await dbManager.transaction(async () => {
      // 1. Insert redemption record
      const result = await dbManager.run(
        "INSERT INTO reward_redemptions (reward_id, kid_id, redeemed_at, status) VALUES (?, ?, ?, 'pending')",
        [reward_id, kid_id, new Date().toISOString()]
      );
      redemptionId = result.id;

      // 2. Deduct points from kid
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
    const pending = await dbManager.all(`
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

// Fulfill a redemption (Mark as claimed/given)
app.put(
  '/api/redemptions/:id/fulfill',
  parentAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const redemption = await dbManager.get('SELECT * FROM reward_redemptions WHERE id = ?', [id]);
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

    const updatedRedemption = await dbManager.get('SELECT * FROM reward_redemptions WHERE id = ?', [
      id
    ]);
    res.json({ success: true, redemption: updatedRedemption });
  })
);

// ==========================================
// STATIC FILES FALLBACK
// ==========================================

// Handle SPA routing: send index.html for all other requests
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
