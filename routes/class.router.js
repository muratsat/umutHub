const router=require('express').Router();
const ClassController= require("../controllers/class.controller");
const { index } = require('../controllers/index.contoller');

router.get('/nd', index);

router.post('/createClass',ClassController.createClass);

router.get('/getClassList',ClassController.getClassList);

module.exports= router;