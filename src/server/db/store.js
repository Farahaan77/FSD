// src/server/db/store.js - Dual-Mode Persistent Document Store & Mongoose Adapter
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class JsonCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`[Store] Could not read ${this.name}.json, initializing empty collection:`, e.message);
    }
    return [];
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`[Store] Failed to save collection ${this.name}:`, e.message);
    }
  }

  find(filter = {}) {
    return this.data.filter(item => {
      for (const key of Object.keys(filter)) {
        if (filter[key] !== undefined && item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
  }

  findOne(filter = {}) {
    return this.find(filter)[0] || null;
  }

  findById(id) {
    return this.findOne({ _id: String(id) }) || this.findOne({ id: String(id) });
  }

  insertOne(doc) {
    const newDoc = {
      _id: doc._id || 'doc_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.push(newDoc);
    this._save();
    return newDoc;
  }

  insertMany(docs) {
    return docs.map(d => this.insertOne(d));
  }

  updateOne(filter, update) {
    const item = this.findOne(filter);
    if (!item) return null;
    const patch = update.$set ? update.$set : update;
    Object.assign(item, patch, { updatedAt: new Date().toISOString() });
    this._save();
    return item;
  }

  deleteOne(filter) {
    const idx = this.data.findIndex(item => {
      for (const key of Object.keys(filter)) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
    if (idx !== -1) {
      const removed = this.data.splice(idx, 1)[0];
      this._save();
      return removed;
    }
    return null;
  }

  countDocuments(filter = {}) {
    return this.find(filter).length;
  }

  clear() {
    this.data = [];
    this._save();
  }
}

export const db = {
  users: new JsonCollection('users'),
  research: new JsonCollection('research_documents'),
  chunks: new JsonCollection('document_chunks'),
  wellness: new JsonCollection('wellness_entries'),
  conversations: new JsonCollection('conversations'),
  saved: new JsonCollection('saved_resources'),
  auditLogs: new JsonCollection('audit_logs')
};
