const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const IdeaModel = require("../models/idea.model");
const authController = require("../controllers/authController");
const SurveyResponse = require('../models/surveyResponse.model');
const School = require('../models/school.model');
const Class = require('../models/class.model');

//Registration Route
router.post('/register', authController.registerUser);

router.post('/registerDetail', authMiddleware.auth, authController.registerDetail);

//loginUser route
router.post('/login', authController.loginUser);

//getallusers route
router.get('/all', authController.getUsers);

//remove users
router.delete('/remove/:username',authController.removeUsers);


//Profile route using authentication
router.get('/profile', authMiddleware.auth, async(req, res) => {
  const user = req.user;
  const projects=user.projects;
  const ideas=await IdeaModel.find({userId : user._id});
  const surveys = await SurveyResponse.find({user : user._id});
  const school = await School.findById(user.schoolId).select('name');
  const userClass = await Class.findById(user.classId).select('name');
  const classes = await Class.find({schoolId : user.schoolId, _id : { $nin:  user.classId}}).select('name').lean()  // преобразует в простой объект
  .then(classes => classes.map(c => ({
    id: c._id,
    name: c.name
  })));
  res.json({  
    id : user._id,
    name : user.name,
    surname : user.surname,
    rating : user.rating,
    photo : user.photo.path,
    projects :  projects.length,
    ideas : ideas.length,
    surveys : surveys.length, 
    school : school.name,
    classUser : {
      id : userClass._id, 
      name : userClass.name
    },
    classes : classes
   });
});

module.exports = router;