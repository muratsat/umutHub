const ProjectServices = require("../services/project.services");
const mongoose=require('mongoose');
const User = require("../models/user.model");


async function validateUsers(userIds) {
    const invalidUsers = [];
  
    for (const userId of userIds) {
      try {
        const _id = new mongoose.Types.ObjectId(userId);
        const checkUser = await User.findById(_id);
        if (!checkUser) {
          invalidUsers.push(userId);
        }
      } catch (error) {
        console.error(`Error checking user ${userId}:`, error);
        invalidUsers.push(userId);
      }
    }
  
    return invalidUsers;
  }

//   async function validateUsers(userIds) {
    
  
//     const invalidUsers = [];
  
//     for (let i = 0; i < 2; i++) {
//       const userId = userIds[i].userId;
//       try {
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//           invalidUsers.push(userId);
//           continue;
//         }
  
//         const _id = new mongoose.Types.ObjectId(userId);
//         const checkUser = await User.findById(_id);
//         if (!checkUser) {
//           invalidUsers.push(userId);
//         }
//       } catch (error) {
//         console.error(`Error checking user ${userId}:`, error);
//         invalidUsers.push(userId);
//       }
//     }
  
//     return invalidUsers;
//   }


exports.createProject = async (req,res,next) => {
    try {
        const {name, description, userIds} = req.body;

        const invalidUsers = await validateUsers(userIds);

        if (invalidUsers.length > 0) {
            return res.status(404).json({ 
              message: 'Некоторые пользователи не найдены', 
              invalidUsers 
            });
          }

        let newProject = await ProjectServices.createProject(name, description, userIds);

        await User.updateMany(
            { _id: { $in: userIds } },
            { $addToSet: { projects: newProject } }
          );

        res.json({status: true, success: newProject});
    } catch (error) {
        next(error);
    }
}

exports.getProjectList = async (req,res,next) => {
    try {

        let projectList = await ProjectServices.getProjectList();

        res.json({status: true, success: projectList });
    } catch (error) {
        next(error);
    }
}