const mongoose = require('mongoose');
const UserModel = require('../models/user.model');
const Survey = require('../models/survey.model');
const ProjectModel = require('../models/project.model');
const Discussion = require('../models/discussion.model');
const EventModel = require('../models/event.model');

const router=require('express').Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');
const IdeaModel = require("../models/idea.model");
const SurveyResponse = require('../models/surveyResponse.model');




async function getUserProjects(userId) {
  try {
    // Проверяем, существует ли пользователь
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Получаем проекты пользователя
    const projects = await ProjectModel.find({ users: userId })
      .select('name description') // Выбираем только нужные поля
      .lean(); // Используем lean() для получения простых JS объектов

    return projects;
  } catch (error) {
    console.error('Error fetching user projects:', error);
    throw error;
  }
}

router.get('/userDashboard', authMiddleware.auth, async (req, res) => {
  try {
    const user = req.user;

    const userSurveysIds = await SurveyResponse.find({ user: user._id }).select('survey selectedOption');
    console.log(userSurveysIds);
      const userSurveys = await Promise.all(userSurveysIds.map(async (userSurveyId) => {
        var surveyItem=await Survey.findById(userSurveyId.survey).select('name description options');
    console.log(surveyItem);
    var selectedOption=userSurveyId.selectedOption
        return {
          id: surveyItem._id,
          name: surveyItem.name,
          description: surveyItem.description,
          options: surveyItem.options,
          selectedOption
        };
    }));

    const projects = await ProjectModel.find({ users: user._id })
      .select('name description') // Выбираем только нужные поля
      .lean();

      const ideas = await IdeaModel.find({userId : user._id}).select('name description');

    res.json({userName : user.name,ideas,projects,userSurveys});
  } catch (error) {
    console.error('Error fetching available surveys:', error);
    res.status(500).json({ message: 'Ошибка при получении доступных опросов' });
  }
});


router.get('/userAction', authMiddleware.auth, async (req, res) => {
  try {
    const user = req.user;

    var surveysIds=[];
    const userSurveysIds = await SurveyResponse.find({ user: user._id }).select('survey');
      await Promise.all(userSurveysIds.map(async (userSurveyId) => {
        surveysIds.push(userSurveyId.survey);
    }));

    var surveys= await Survey.find({classes: user.classId, _id: { $nin:  surveysIds}})


    const events = await EventModel.find({ classIds: user.classId })
        .select('title description date')
        .sort({ createdAt: -1 });

    const querySchool = { isActive: true, schoolId : req.user.schoolId };
    const queryGlobal = { isActive: true,  isGlobal: true };

    const discussionsSchool = await Discussion.find(querySchool)
      .sort({ createdAt: -1 })
      .select('title description');

      const discussionsGlobal = await Discussion.find(queryGlobal)
      .sort({ createdAt: -1 })
      .select('title description');

      // const ideas = await IdeaModel.find({userId : user._id}).select('name description');

    res.json({surveys,events,discussionsSchool,discussionsGlobal});
  } catch (error) {
    console.error('Error fetching available surveys:', error);
    res.status(500).json({ message: 'Ошибка при получении доступных опросов' });
  }
});


// Маршрут Express для получения проектов пользователя
router.get('/projects', async (req, res) => {
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Недействительный ID пользователя' });
  }

  try {
    const projects = await getUserProjects(userId);
    res.json({
      message: 'Проекты пользователя успешно получены',
      projects: projects
    });
  } catch (error) {
    console.error('Error in /users/projects route:', error);
    if (error.message === 'Пользователь не найден') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  }
});

router.delete('/deleteUser', authMiddleware.auth, async (req, res) => {
  try {

    // Проверяем существование пользователя

    // Удаляем пользователя
    await UserModel.findByIdAndDelete(req.user._id);

    // Можно также удалить связанные данные
    // await Post.deleteMany({ userId });
    // await Comment.deleteMany({ userId });
    
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});







//---------------------------------
const upload = require('../middlewares/multerMiddleware');


router.post('/photo', upload.single('photo'), async (req, res) => {
  try {
    const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Authorization token not found' });
  }
    const decoded = jwt.verify(token, 'secret');
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Файл не был загружен' });
      }

    user.photo = {
      filename: req.file.filename,
      path: req.file.path,
      contentType: req.file.mimetype
    };

    await user.save();

    res.json({ message: 'Фото успешно загружено', user });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ message: 'Ошибка при загрузке фото' });
  }
});

module.exports= router;