const express = require('express');
const router = express.Router();
const Survey = require('../models/survey.model');
const User = require('../models/user.model');
const Class = require('../models/class.model');

const authMiddleware = require('../middlewares/authMiddleware');
const SurveyResponse = require('../models/surveyResponse.model');
const mongoose = require('mongoose');
const updateUserRating = require('../utils/updateUserRating');

// Создание нового опроса (только для админа)
router.post('/createSurvey', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { name, description, options, classIds } = req.body;

    // Проверка наличия необходимых полей
    if (!name || !description || !Array.isArray(options) || options.length === 0 || !Array.isArray(classIds)) {
      return res.status(400).json({ message: 'Неверные данные опроса' });
    }

    const classes = await Class.find({ _id: { $in: classIds } });
    if (classes.length !== classIds.length) {
      return res.status(400).json({ message: 'Некоторые из указанных классов не существуют' });
    }

    // Добавляем optionId к каждому варианту ответа
    const optionsWithIds = options.map((option, index) => ({
      ...option,
      optionId: index + 1
    }));

    const survey = new Survey({
      name,
      description,
      options: optionsWithIds,
      classes: classIds,
      createdBy: req.user._id // Предполагается, что ID пользователя доступен в req.user после аутентификации
    });

    await survey.save();

    res.status(201).json({ message: 'Опрос успешно создан', survey });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ message: 'Ошибка при создании опроса' });
  }
});


router.post('/edit', authMiddleware.isAdmin, async (req, res) => {
    try {
      const {id ,name, description, options, classIds } = req.body;
  
      // Проверка наличия необходимых полей
      if (!name || !description || !Array.isArray(options) || options.length === 0 || !Array.isArray(classIds)) {
        return res.status(400).json({ message: 'Неверные данные опроса' });
      }
  
      const classes = await Class.find({ _id: { $in: classIds } });
      if (classes.length !== classIds.length) {
        return res.status(400).json({ message: 'Некоторые из указанных классов не существуют' });
      }

      const survey = await Survey.findById(id);
    if (!survey) {
      return res.status(404).json({ message: 'Опрос не найден' });
    }

    const optionsWithIds = options.map((option, index) => ({
        ...option,
        optionId: index + 1
      }));
  
  
      survey.name = name;
    survey.description = description;
    survey.options = optionsWithIds;
    survey.classes = classIds;
    
  
      await survey.save();
  
      res.json({ message: 'Опрос успешно обновлен', survey });
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при обновлении опроса' });
    }
  });

// Получение списка всех опросов
router.get('/getSurvey',authMiddleware.auth, async (req, res) => {
  try {
    const surveys = await Survey.find({classes: req.user.classId}).select('name description options').sort({ createdAt: -1 });
    res.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ message: 'Ошибка при получении опросов' });
  }
});

// Получение конкретного опроса по ID
router.get('/getSurvey/:id', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: 'Опрос не найден' });
    }
    res.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ message: 'Ошибка при получении опроса' });
  }
});

router.get('/available', authMiddleware.authUser, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
  
      const availableSurveys = await Survey.find({ classes: user.classId })
        .select('name description options createdAt')
        .sort({ createdAt: -1 });
  
      res.json(availableSurveys);
    } catch (error) {
      console.error('Error fetching available surveys:', error);
      res.status(500).json({ message: 'Ошибка при получении доступных опросов' });
    }
  });
  


router.post('/respond', authMiddleware.authUser, async (req, res) => {
    try {
      const { id,selectedOption } = req.body;
  
      const survey = await Survey.findById(id);
      if (!survey) {
        return res.status(404).json({ message: 'Опрос не найден' });
      }

      const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (!survey.classes.includes(user.classId)) {
      return res.status(403).json({ message: 'У вас нет доступа к этому опросу' });
    }
  
      // Проверяем, существует ли выбранный вариант ответа
      if (!survey.options.some(option => option.optionId === selectedOption)) {
        return res.status(400).json({ message: 'Недопустимый вариант ответа' });
      }
  
      // Создаем или обновляем ответ пользователя
      await SurveyResponse.findOneAndUpdate(
        { survey: id, user: req.user._id },
        { selectedOption },
        { upsert: true, new: true }
      );

      await updateUserRating(req.user._id, 1);
  
      res.json({ message: 'Ваш ответ успешно сохранен' });
    } catch (error) {
      console.error('Error responding to survey:', error);
      if (error.code === 11000) { // Ошибка дублирования ключа
        return res.status(400).json({ message: 'Вы уже ответили на этот опрос' });
      }
      res.status(500).json({ message: 'Ошибка при сохранении ответа' });
    }
  });
  
  // Получение результатов опроса (для администраторов)
  router.get('/results', authMiddleware.isAdmin, async (req, res) => {
    try {
      const { id } = req.body;
  
      const survey = await Survey.findById(id);
      if (!survey) {
        return res.status(404).json({ message: 'Опрос не найден' });
      }

      var _id = new mongoose.Types.ObjectId(id);
      const results = await SurveyResponse.aggregate([
        { $match: { survey: _id } },
        { $group: { _id: '$selectedOption', count: { $sum: 1 } } }
      ]);
  
      const formattedResults = survey.options.map(option => {
        const result = results.find(r => r._id === option.optionId);
        return {
          optionId: option.optionId,
          optionName: option.optionName,
          votes: result ? result.count : 0
        };
      });
  
      res.json({ survey, results: formattedResults });
    } catch (error) {
      console.error('Error fetching survey results:', error);
      res.status(500).json({ message: 'Ошибка при получении результатов опроса' });
    }
  });

module.exports = router;
