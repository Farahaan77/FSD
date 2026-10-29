// src/server/routes/wellnessRoutes.js - Personal Wellness Journal & Habit Analytics API
import express from 'express';
import { db } from '../db/store.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get wellness entries and analytics for current user
router.get('/', requireAuth, (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let entries = db.wellness.find({ userId });

    // Sort by entryDate descending
    entries.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));

    // Compute weekly activity metrics for the dashboard bar chart
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayBars = days.map(d => ({ day: d, energy: 0, sleep: 0, entries: 0 }));

    entries.slice(0, 14).forEach(e => {
      const date = new Date(e.entryDate);
      const dayIdx = (date.getDay() + 6) % 7; // Convert 0(Sun)..6(Sat) to 0(Mon)..6(Sun)
      if (dayIdx >= 0 && dayIdx < 7) {
        dayBars[dayIdx].energy = e.energyRating;
        dayBars[dayIdx].sleep = e.sleepDuration;
        dayBars[dayIdx].entries += 1;
      }
    });

    const avgSleep = entries.length
      ? (entries.reduce((acc, curr) => acc + Number(curr.sleepDuration || 0), 0) / entries.length).toFixed(1)
      : '7.4';

    const avgEnergy = entries.length
      ? (entries.reduce((acc, curr) => acc + Number(curr.energyRating || 0), 0) / entries.length).toFixed(1)
      : '7.8';

    res.json({
      success: true,
      entries,
      totalEntries: entries.length,
      analytics: {
        avgSleepHours: avgSleep,
        avgEnergyScore: avgEnergy,
        weeklyChart: dayBars
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new wellness entry
router.post('/', requireAuth, (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { entryDate, sleepDuration, energyRating, moodRating, exerciseMinutes, notes } = req.body;

    if (!sleepDuration || !energyRating) {
      return res.status(400).json({ success: false, message: 'Sleep duration and energy rating are required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry = db.wellness.insertOne({
      userId,
      entryDate: entryDate || todayStr,
      sleepDuration: parseFloat(sleepDuration),
      energyRating: parseInt(energyRating, 10),
      moodRating: parseInt(moodRating || 7, 10),
      exerciseMinutes: parseInt(exerciseMinutes || 30, 10),
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Wellness journal entry logged successfully.',
      entry: newEntry
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete wellness entry
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.wellness.deleteOne({ _id: id });
    res.json({ success: true, message: 'Wellness entry deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
