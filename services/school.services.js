const SchoolModel = require("../models/school.model");

class SchoolServices{
    static async createSchool(name,description){
        const createSchool = new SchoolModel({name,description});
        return await createSchool.save();
    }

    static async getSchoolList(){
        const schoolData = await SchoolModel.find().select('_id name');
        return schoolData;
    }
}

module.exports = SchoolServices;