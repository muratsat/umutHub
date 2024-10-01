const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['create_school_admin', 'update_school_admin', 'delete_school_admin', 'create_school', 'update_school', 'delete_school', 'other']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  affectedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  affectedSchool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

module.exports = AdminLog;