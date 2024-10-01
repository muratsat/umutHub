const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  isGlobal: { type: Boolean, default: false },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Индексы для оптимизации запросов
discussionSchema.index({ isGlobal: 1, schoolId: 1, createdAt: -1 });
discussionSchema.index({ isActive: 1 });

const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion;