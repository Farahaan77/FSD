// src/server/routes/savedRoutes.js - Saved Resources & Bookmarking API
import express from 'express';
import { db } from '../db/store.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all saved resources for user
router.get('/', requireAuth, (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const items = db.saved.find({ userId });
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      items
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bookmark / Save a resource
router.post('/', requireAuth, (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { resourceType, referenceId, title, summary, tags } = req.body;

    if (!referenceId || !title) {
      return res.status(400).json({ success: false, message: 'Reference ID and title are required.' });
    }

    // Check if already saved
    const existing = db.saved.findOne({ userId, referenceId });
    if (existing) {
      return res.json({ success: true, message: 'Resource already saved.', item: existing });
    }

    const item = db.saved.insertOne({
      userId,
      resourceType: resourceType || 'research_guide',
      referenceId,
      title,
      summary: summary || '',
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      message: 'Resource saved to personal collection.',
      item
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove a saved resource
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    
    // Can delete by _id or referenceId
    const item = db.saved.findById(id) || db.saved.findOne({ userId, referenceId: id });
    if (item) {
      db.saved.deleteOne({ _id: item._id });
    }

    res.json({ success: true, message: 'Resource removed from saved collection.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
