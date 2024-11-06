const User = require('../models/user.model');
const Notification = require('../models/notification.model');


// notification.service.js
class NotificationService {
  constructor(io) {
    this.io = io;
  }

  async sendNotification(notification) {
    try {
      let recipients = [];

      // Определяем получателей
      switch (notification.type) {
        case 'ALL':
          recipients = await User.find({ isActive: true }).select('_id');
          break;

        case 'SCHOOL':
          recipients = await User.find({ 
            schoolId: notification.schoolId,
            isActive: true 
          }).select('_id');
          break;

        case 'CLASS':
          recipients = await User.find({ 
            schoolId: notification.schoolId,
            classId: notification.classId,
            isActive: true 
          }).select('_id');
          break;

        case 'SPECIFIC_USERS':
          recipients = notification.recipients;
          break;
      }

      // Отправляем уведомление активным пользователям
      recipients.forEach((recipient) => {
        const socketId = connectedUsers.get(recipient._id.toString());
        if (socketId) {
          this.io.to(socketId).emit('new_notification', notification);
        }
      });

      return recipients.map(r => r._id);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    return Notification.findByIdAndUpdate(
      notificationId,
      {
        $addToSet: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      },
      { new: true }
    );
  }

  async getUserNotifications(userId, page = 1, limit = 20) {
    const user = await User.findById(userId);
    
    return Notification.find({
      $or: [
        { type: 'ALL' },
        { type: 'SCHOOL', schoolId: user.schoolId },
        { type: 'CLASS', schoolId: user.schoolId, classId: user.classId },
        { type: 'SPECIFIC_USERS', recipients: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('createdBy', 'name')
    .lean();
  }
}

// routes/admin.js
router.post('/notifications', auth, adminOnly, async (req, res) => {
  try {
    const notification = new Notification({
      title: req.body.title,
      body: req.body.body,
      type: req.body.type,
      recipients: req.body.recipients,
      schoolId: req.body.schoolId,
      classId: req.body.classId,
      createdBy: req.user._id
    });

    await notification.save();
    
    const recipients = await notificationService.sendNotification(notification);
    
    res.status(201).json({ notification, recipientCount: recipients.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});