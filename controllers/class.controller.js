const ClassServices = require("../services/class.services");

exports.createClass = async (req,res,next) => {
    try {
        const {schoolId,name, description} = req.body;

        let newClass = await ClassServices.createClass(schoolId,name,description);

        res.json({status: true, success:newClass});
    } catch (error) {
        next(error);
    }
}

exports.getClassList = async (req,res,next) => {
    try {
        const {schoolId} = req.body;
        let classList = await ClassServices.getClassList(schoolId);
        res.json({status: true, success:classList});
    } catch (error) {
        next(error);
    }
}