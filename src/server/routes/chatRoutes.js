// src/server/routes/chatRoutes.js - Evidence-Grounded AI Research Assistant & RAG Engine API
import express from 'express';
import { db } from '../db/store.js';
import { VectorRetriever, generateEvidenceGroundedAnswer } from '../services/ragService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ask RAG Assistant an evidence-based question
router.post('/', requireAuth, (req, res) => {
  try {
    const { query, conversationId } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Inquiry query string is required.' });
    }

    // Load all indexed chunks
    const allChunks = db.chunks.find();
    const retriever = new VectorRetriever(allChunks);

    // Retrieve top 3 relevant chunks
    const retrieved = retriever.query(query, 3);

    // Synthesize grounded answer
    const ragResponse = generateEvidenceGroundedAnswer(query, retrieved);

    // Save into conversation history
    const userId = req.user.id || req.user._id;
    let convo = conversationId ? db.conversations.findById(conversationId) : null;

    if (!convo) {
      convo = db.conversations.insertOne({
        userId,
        title: query.length > 40 ? query.substring(0, 37) + '...' : query,
        messages: []
      });
    }

    // Append user message and assistant message
    const userMsg = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    const assistantMsg = {
      role: 'assistant',
      content: ragResponse.answer,
      citations: ragResponse.citations,
      evidenceScore: ragResponse.evidenceScore,
      safetyNotice: ragResponse.safetyNotice,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...(convo.messages || []), userMsg, assistantMsg];
    db.conversations.updateOne({ _id: convo._id }, { messages: updatedMessages });

    res.json({
      success: true,
      conversationId: convo._id,
      answer: ragResponse.answer,
      citations: ragResponse.citations,
      evidenceScore: ragResponse.evidenceScore,
      retrievedCount: ragResponse.retrievedCount,
      safetyNotice: ragResponse.safetyNotice
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user conversation history
router.get('/conversations', requireAuth, (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const conversations = db.conversations.find({ userId });
    conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      success: true,
      conversations
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a conversation
router.delete('/conversations/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.conversations.deleteOne({ _id: id });
    res.json({ success: true, message: 'Conversation deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
