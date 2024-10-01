const mongoose=require('mongoose');
const SchoolModel = require("../models/school.model");
const { Schema } = mongoose;

const classSchema = new Schema({
    schoolId:{
        type : Schema.Types.ObjectId,
        ref: SchoolModel.modelName
    },
    name: {
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    studentCount: { type: Number, default: 0 },
});

const ClassModel = mongoose.model('class', classSchema);

module.exports = ClassModel;