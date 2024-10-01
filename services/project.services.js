const ProjectModel = require("../models/project.model");
const mongoose=require('mongoose');
const User = require("../models/user.model");

class ProjectServices{
    static async createProject(name,description,userIds){
        const createProject = new ProjectModel({name,description,users:userIds});
        // for (const userId of userIds){
        //     const _id = new mongoose.Types.ObjectId(userId);
        //     const user = await User.findById(_id);
        //     user.projects.push(createProject._id);
        // }
        return await createProject.save();
    }

    static async getProjectList(){
        const projectData = await ProjectModel.find();
        return projectData;
    }
}

module.exports = ProjectServices;