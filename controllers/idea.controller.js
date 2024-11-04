const mongoose=require('mongoose');
const User = require("../models/user.model");
const IdeaModel = require("../models/idea.model");




exports.createIdea = async (req,res,next) => {
    try {
        const {name, description} = req.body;

        const idea = new IdeaModel({name,description,userId: req.user._id, schoolId: req.user.schoolId});
    
        await idea.save();

        res.json({status: true, success: idea});
    } catch (error) {
        next(error);
    }
}

exports.getIdeaList = async (req,res,next) => {
    try {

      const ideaList = await IdeaModel.find({userId : req.user._id}).select('name description');

        res.json({status: true, success: ideaList });
    } catch (error) {
        next(error);
    }
}