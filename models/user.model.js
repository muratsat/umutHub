const mongoose = require('mongoose');
const Class = require("../models/class.model");
const School = require("../models/school.model");
const ProjectModel = require("../models/project.model");

const { Schema } = mongoose;

//userschema
const userSchema = new Schema({
  email: {
    type: String,
    lowercase: true,
    required: true
  },
  name: String, 
  surname: String,
  rating : {
    type: Number,
    default: 0
  },
  photo: {
    filename: String,
    path: String,
    contentType: String
  },
  schoolId:{
    type : Schema.Types.ObjectId,
    ref: School.modelName
  },
  classId:{
    type : Schema.Types.ObjectId,
    ref: Class.modelName
  },
  projects: [{ type: Schema.Types.ObjectId, ref: ProjectModel.modelName }],
  otp: String,
  role : {
    type: Number,
    default: 0
  }
});

userSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('classId')) {
    const oldClassId = this.isNew ? null : this._oldClassId;
    
    if (oldClassId) {
      await Class.findByIdAndUpdate(oldClassId, { $inc: { studentCount: -1 } });
    }
    
    await Class.findByIdAndUpdate(this.classId, { $inc: { studentCount: 1 } });
  }
  next();
});

// Сохраняем старый classId перед изменением
userSchema.pre('findOneAndUpdate', async function(next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (docToUpdate) {
    this._oldClassId = docToUpdate.classId;
  }
  next();
});

// Middleware для обновления количества учеников в классе при обновлении пользователя
userSchema.post('findOneAndUpdate', async function() {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (docToUpdate && this._oldClassId && !docToUpdate.classId.equals(this._oldClassId)) {
    await Class.findByIdAndUpdate(this._oldClassId, { $inc: { studentCount: -1 } });
    await Class.findByIdAndUpdate(docToUpdate.classId, { $inc: { studentCount: 1 } });
  }
});

// Middleware для обновления количества учеников в классе при удалении пользователя
userSchema.pre('remove', async function(next) {
  await Class.findByIdAndUpdate(this.classId, { $inc: { studentCount: -1 } });
  next();
});

//defining model
const User = mongoose.model('user', userSchema);

module.exports = User;