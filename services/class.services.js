const ClassModel = require("../models/class.model");

class ClassServices{
    static async createClass(schoolId,name,description){
        const createSchool = new ClassModel({schoolId,name,description});
        return await createSchool.save();
    }

    static async getClassList(schoolId){
        
        const classData = await ClassModel.find({schoolId}).select('_id name');
        return classData;
    }
}

module.exports = ClassServices;