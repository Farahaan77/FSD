// server.js - Express Gateway & Application Entry Point
import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import authRoutes from './src/server/routes/authRoutes.js';
import researchRoutes from './src/server/routes/researchRoutes.js';
import chatRoutes from './src/server/routes/chatRoutes.js';
import wellnessRoutes from './src/server/routes/wellnessRoutes.js';
import savedRoutes from './src/server/routes/savedRoutes.js';
import adminRoutes from './src/server/routes/adminRoutes.js';
import { seedDatabaseIfEmpty } from './src/server/seed/seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

// Security & Parsing Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Frontend Static Assets
const PUBLIC_DIR = path.resolve(__dirname, 'src/public');
app.use(express.static(PUBLIC_DIR));

// Mount REST API Endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/research', researchRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/wellness', wellnessRoutes);
app.use('/api/v1/saved', savedRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    application: 'AI-Powered Wellness Recommendation Platform (Wellnote RAG)',
    student: 'Mohammed Farahaan F (310624149035)',
    institution: 'Easwari Engineering College (Autonomous)',
    timestamp: new Date().toISOString()
  });
});

// Single Page Application Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Seed sample data and boot server
await seedDatabaseIfEmpty();

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🌿 WELLNOTE - AI-POWERED WELLNESS RECOMMENDATION PLATFORM`);
  console.log(`   Author: Mohammed Farahaan F (310624149035)`);
  console.log(`   Course: 2311CSE503R - Full Stack Development`);
  console.log(`   College: SRM Easwari Engineering College (Autonomous)`);
  console.log(`================================================================`);
  console.log(`🚀 Live Application Gateway: http://localhost:${PORT}`);
  console.log(`📡 REST API Base:            http://localhost:${PORT}/api/v1`);
  console.log(`================================================================`);
});
