// src/server/routes/researchRoutes.js - Research Library & Evidence Repository API
import express from 'express';
import { db } from '../db/store.js';

const router = express.Router();

// Get research documents with search and category filtering
router.get('/', (req, res) => {
  try {
    const { category, search, limit = 20, page = 1 } = req.query;
    let documents = db.research.find();

    if (category && category !== 'All') {
      documents = documents.filter(doc => doc.category.toLowerCase() === category.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.toLowerCase();
      documents = documents.filter(doc => 
        doc.title.toLowerCase().includes(q) ||
        doc.abstract.toLowerCase().includes(q) ||
        (doc.tags && doc.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sort by publication year or creation date
    documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = documents.length;
    const startIndex = (page - 1) * limit;
    const paginated = documents.slice(startIndex, startIndex + Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      documents: paginated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single research document by ID or Slug
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const doc = db.research.findById(id) || db.research.findOne({ slug: id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Research document not found.' });
    }

    // Fetch associated chunks
    const chunks = db.chunks.find({ docId: doc._id || doc.id });

    res.json({
      success: true,
      document: {
        ...doc,
        chunks
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
