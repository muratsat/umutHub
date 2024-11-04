const mongoose=require('mongoose');
const UserModel = require("../models/user.model");
const { Schema } = mongoose;
const School = require("../models/school.model");

const ideaSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    userId: { type: Schema.Types.ObjectId, ref: UserModel.modelName },
    schoolId:{
        type : Schema.Types.ObjectId,
        ref: School.modelName
      },
});

const IdeaModel = mongoose.model('idea', ideaSchema);

module.exports = IdeaModel;