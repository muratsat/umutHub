const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Class = require('../models/class.model');
const School = require('../models/school.model');
const authMiddleware = require('../middlewares/authMiddleware');

// Получение списка рейтингов по всем школам
router.get('/all', authMiddleware.auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.aggregate([
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      { $unwind: '$classInfo' },
      {
        $lookup: {
          from: 'schools',
          localField: 'classInfo.schoolId',
          foreignField: '_id',
          as: 'schoolInfo'
        }
      },
      { $unwind: '$schoolInfo' },
      { $sort: { rating: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          rating: 1,
          'classInfo.name': 1,
          'schoolInfo.name': 1
        }
      }
    ]);

    const total = await User.countDocuments();

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ message: 'Ошибка при получении рейтингов' });
  }
});

// Получение списка рейтингов по конкретной школе
router.get('/school', authMiddleware.auth, async (req, res) => {
  try {
    const { schoolId } = req.body;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'Школа не найдена' });
    }

    const classIds = await Class.find({ schoolId: schoolId }).distinct('_id');

    const users = await User.find({ classId: { $in: classIds } })
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit)
      .select('name rating classId')
      .populate('classId', 'name');

    const total = await User.countDocuments({ classId: { $in: classIds } });

    res.json({
      school: school.name,
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error('Error fetching school ratings:', error);
    res.status(500).json({ message: 'Ошибка при получении рейтингов школы' });
  }
});

module.exports = router;