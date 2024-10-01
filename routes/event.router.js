const express = require('express');
const router = express.Router();
const mongoose=require('mongoose');
const Event = require('../models/event.model');
const Class = require('../models/class.model'); // Предполагается, что у вас есть модель Class
const authMiddleware = require('../middlewares/authMiddleware');

// Создание нового события (только для админа)
router.post('/createEvent', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { title, description, date, schoolId, classIds } = req.body;

    // Проверка существования классов
    if (classIds && classIds.length > 0) {
      const classCount = await Class.countDocuments({ _id: { $in: classIds } });
      if (classCount !== classIds.length) {
        return res.status(400).json({ message: 'Некоторые из указанных классов не существуют' });
      }
    }

    const event = new Event({
      title,
      description,
      date: new Date(date),
      schoolId,
      classIds,
      createdBy: req.user._id
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при создании события', error: error.message });
  }
});

// Получение списка событий
router.get('/eventList', authMiddleware.auth, async (req, res) => {
  try {
    const { classId } = req.body;
    // const query = {
    //   date: { $gte: new Date(start), $lte: new Date(end) }
    // };
    // if (classId) query.classIds = classId; // Изменено для поиска по массиву

    const _id = new mongoose.Types.ObjectId(classId);

    const events = await Event.find({ classIds: classId })
        .select('title description date')
        .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при получении событий', error: error.message });
  }
});

// Обновление события (только для админа)
router.put('/events/:id', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { title, description, date, schoolId, classIds } = req.body;

    // Проверка существования классов
    if (classIds && classIds.length > 0) {
      const classCount = await Class.countDocuments({ _id: { $in: classIds } });
      if (classCount !== classIds.length) {
        return res.status(400).json({ message: 'Некоторые из указанных классов не существуют' });
      }
    }

    const event = await Event.findByIdAndUpdate(req.params.id, {
      title,
      description,
      date: new Date(date),
      schoolId,
      classIds,
      updatedAt: Date.now()
    }, { new: true });

    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при обновлении события', error: error.message });
  }
});

// Остальные маршруты остаются без изменений

module.exports = router;