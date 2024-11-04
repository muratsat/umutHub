const router=require('express').Router();
const IdeaController= require("../controllers/idea.controller");
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/createIdea',authMiddleware.auth,IdeaController.createIdea);

router.get('/getIdeaList',authMiddleware.auth,IdeaController.getIdeaList);

module.exports= router;