const mongoose=require('mongoose');
const UserModel = require("../models/user.model");
const { Schema } = mongoose;

const projectSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    users: [{ type: Schema.Types.ObjectId, ref: UserModel.modelName }]
});

const ProjectModel = mongoose.model('project', projectSchema);

module.exports = ProjectModel;