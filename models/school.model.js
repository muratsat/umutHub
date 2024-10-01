const mongoose = require('mongoose');
const { Schema } = mongoose;

//userschema
const schoolSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: { type: String, default: 'Описание отсутствует' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

//defining model
const SchoolModel = mongoose.model('school', schoolSchema);

module.exports = SchoolModel;