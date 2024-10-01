const SchoolServices = require("../services/school.services");

exports.createSchool = async (req,res,next) => {
    try {
        const {name, description} = req.body;

        let school = await SchoolServices.createSchool(name,description);

        res.json({status: true, success:school});
    } catch (error) {
        next(error);
    }
}

exports.getSchoolList = async (req,res,next) => {
    try {

        let school = await SchoolServices.getSchoolList();

        res.json({status: true, success:school});
    } catch (error) {
        next(error);
    }
}