const mongoose=require('mongoose');
// Notification Model (MongoDB)
const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['ALL', 'SCHOOL', 'CLASS', 'SPECIFIC_USERS'], 
      required: true 
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    schoolId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School' 
    },
    classId: String,
    readBy: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: { type: Date, default: Date.now }
  });

  const NotificationModel = mongoose.model('notification', notificationSchema);

module.exports = NotificationModel;