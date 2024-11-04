const router=require('express').Router();
const SchoolController= require("../controllers/school.controller");
const authMiddleware=require("../middlewares/authMiddleware");

router.post('/createSchool',authMiddleware.isAdmin,SchoolController.createSchool);

router.get('/getSchoolList',authMiddleware.auth,SchoolController.getSchoolList);

module.exports= router;