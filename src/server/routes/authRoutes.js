// src/server/routes/authRoutes.js - Authentication & Profile API
import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/store.js';
import { signToken, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, interests } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = db.users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = db.users.insertOne({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      interests: interests || ['Peptide Biology', 'Metabolic Health']
    });

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = db.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Current user profile
router.get('/me', requireAuth, (req, res) => {
  const user = db.users.findById(req.user.id) || req.user;
  res.json({
    success: true,
    user: {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests || ['Peptide Biology', 'Clinical Evidence']
    }
  });
});

// Update profile preferences
router.patch('/profile', requireAuth, (req, res) => {
  const { name, interests, bio } = req.body;
  const updated = db.users.updateOne(
    { _id: req.user.id },
    { name, interests, bio }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: updated
  });
});

export default router;
