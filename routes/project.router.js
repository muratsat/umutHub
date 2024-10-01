const router=require('express').Router();
const ProjectController= require("../controllers/project.controller");


router.post('/createProject',ProjectController.createProject);

router.get('/getProjectList',ProjectController.getProjectList);







const mongoose = require('mongoose');
const ProjectModel = require('../models/project.model');
const UserModel = require('../models/user.model');
const updateUserRating = require('../utils/updateUserRating');

async function addUsersToProject(projectId, userIds) {


  try {
    // Проверяем, существует ли проект
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error('Проект не найден');
    }

    // Проверяем, что все пользователи существуют
    const users = await UserModel.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      throw new Error('Некоторые пользователи не найдены');
    }

    // Добавляем пользователей к проекту
    const updatedProject = await ProjectModel.findByIdAndUpdate(
      projectId,
      { $addToSet: { users: { $each: userIds } } },
    );

    // Добавляем проект к пользователям
    await UserModel.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { projects: projectId } },
    );

    for(const userId of userIds){
        await updateUserRating(userId, 1);
    }
    

    return updatedProject;
  } catch (error) {
    throw error;
  }
}

// Маршрут Express для добавления пользователей к проекту
router.post('/add-users', async (req, res) => {

  const { projectId,userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'userIds должен быть непустым массивом' });
  }

  try {
    const updatedProject = await addUsersToProject(projectId, userIds);
    res.json({
      message: 'Пользователи успешно добавлены к проекту',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error adding users to project:', error);
    res.status(400).json({ message: error.message });
  }
});


module.exports= router;