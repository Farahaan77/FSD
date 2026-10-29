// src/server/models/MongooseSchemas.js - Mongoose Schemas for MongoDB & Data Modeling
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  interests: [{ type: String }],
  bio: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const ResearchDocumentSchema = new Schema({
  title: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    enum: ['Peptide Biology', 'Clinical Evidence', 'Safety & Toxicology', 'Metabolic Studies', 'Neurobiology'], 
    default: 'Peptide Biology',
    index: true 
  },
  evidenceLevel: { 
    type: String, 
    enum: ['Level I - Meta Analysis', 'Level II - Randomized Trial', 'Level III - In Vivo Preclinical', 'Level IV - In Vitro Mechanistic'], 
    default: 'Level III - In Vivo Preclinical' 
  },
  authors: [{ type: String }],
  doi: { type: String, default: '' },
  publicationYear: { type: Number, default: 2024 },
  journal: { type: String, default: '' },
  abstract: { type: String, required: true },
  limitations: { type: String, default: '' },
  safetyNotes: { type: String, default: '' },
  tags: [{ type: String, index: true }],
  chunkCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const DocumentChunkSchema = new Schema({
  docId: { type: Schema.Types.ObjectId, ref: 'ResearchDocument', required: true, index: true },
  docTitle: { type: String, required: true },
  chunkIndex: { type: Number, required: true },
  heading: { type: String, default: '' },
  content: { type: String, required: true },
  tags: [{ type: String }],
  tokenCount: { type: Number, default: 0 },
  vectorKeywords: [{ type: String }]
});

export const WellnessEntrySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  entryDate: { type: String, required: true, index: true }, // YYYY-MM-DD
  sleepDuration: { type: Number, required: true }, // Hours (e.g. 7.5)
  energyRating: { type: Number, min: 1, max: 10, required: true },
  moodRating: { type: Number, min: 1, max: 10, default: 7 },
  exerciseMinutes: { type: Number, default: 30 },
  waterIntakeLiters: { type: Number, default: 2.5 },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const ConversationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New Research Inquiry' },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    citations: [{
      docId: { type: String },
      docTitle: { type: String },
      chunkIndex: { type: Number },
      excerpt: { type: String },
      doi: { type: String }
    }],
    evidenceScore: { type: Number, default: 0.92 },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

export const SavedResourceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resourceType: { type: String, enum: ['research_guide', 'chat_response'], required: true },
  referenceId: { type: String, required: true },
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export const AuditLogSchema = new Schema({
  userId: { type: String, default: 'system' },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, default: '' },
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '127.0.0.1' },
  timestamp: { type: Date, default: Date.now }
});
