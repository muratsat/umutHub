const router=require('express').Router();
const SchoolController= require("../controllers/school.controller");

router.post('/createSchool',SchoolController.createSchool);

router.get('/getSchoolList',SchoolController.getSchoolList);

module.exports= router;