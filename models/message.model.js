const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  discussionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

messageSchema.index({ discussionId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;