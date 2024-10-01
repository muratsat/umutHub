const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
  survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  selectedOption: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Убедимся, что пользователь может ответить на опрос только один раз
surveyResponseSchema.index({ survey: 1, user: 1 }, { unique: true });

const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

module.exports = SurveyResponse;