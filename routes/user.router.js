const mongoose = require('mongoose');
const UserModel = require('../models/user.model');
const ProjectModel = require('../models/project.model');
const router=require('express').Router();
const jwt = require('jsonwebtoken');

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