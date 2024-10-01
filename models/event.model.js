const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }], // Изменено на массив
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Индексы
eventSchema.index({ date: 1 });
eventSchema.index({ schoolId: 1, date: 1 });
eventSchema.index({ classIds: 1, date: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;