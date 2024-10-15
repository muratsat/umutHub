const mongoose = require('mongoose');
const ClassModel = require("../models/class.model");
const User = require("../models/user.model");
const School = require("../models/school.model");


const optionSchema = new mongoose.Schema({
  optionId: { type: Number, required: true },
  optionName: { type: String, required: true }
},{ _id: false });

const surveySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  options: [optionSchema],
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: ClassModel.modelName }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: User.modelName, required: true },
  createdAt: { type: Date, default: Date.now },
  schoolId:{
    type : mongoose.Schema.Types.ObjectId,
    ref: School.modelName
  },
});

surveySchema.index({ _id: 1, 'options.optionId': 1 }, { unique: true });

const Survey = mongoose.model('survey', surveySchema);

module.exports = Survey;