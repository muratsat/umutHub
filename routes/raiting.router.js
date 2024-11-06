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



    const userList = await User.aggregate([
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
        $match: {
          _id: { $ne: req.user._id },
          role : 0,
          schoolId : req.user.schoolId
        }
      },
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
          surname: 1,
          'classInfo.name': 1,
          'schoolInfo.name': 1
        }
      }
    ]);

    const users = await Promise.all(userList.map(async (user) => {
      
      return {
        _id : user._id,
        rating : user.rating,
        name : `${user.name} ${user.surname}`,
        className : user.classInfo.name,
        schoolName : user.schoolInfo.name
      };


  }));

    const total = await User.countDocuments({role : 0});

    res.json({
      name : req.user.name,
      surname : req.user.surname,
      rating : req.user.rating,
      photo : req.user.photo.path,
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers : total
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ message: 'Ошибка при получении рейтингов' });
  }
});

router.get('/allSchool', authMiddleware.auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userSchoolId = req.user.schoolId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Сначала получаем школу пользователя
    const userSchoolRating = await User.aggregate([
      {
        $group: {
          _id: "$schoolId",
          totalRating: { $sum: "$rating" },
          userCount: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: userSchoolId,
        }
      },
      {
        $lookup: {
          from: "schools",
          localField: "_id",
          foreignField: "_id",
          as: "schoolInfo"
        }
      },
      {
        $unwind: "$schoolInfo"
      },
      {
        $project: {
          _id: 1,
          schoolName: "$schoolInfo.name",
          rating: "$totalRating",
          userCount: 1
        }
      }
    ]);

    // Получаем остальные школы с пагинацией
    const otherSchoolsRatings = await User.aggregate([
      {
        $group: {
          _id: "$schoolId",
          totalRating: { $sum: "$rating" }
        }
      },
      {
        $match: {
          _id: { $ne: userSchoolId }, // Исключаем школу пользователя
        }
      },
      {
        $lookup: {
          from: "schools",
          localField: "_id",
          foreignField: "_id",
          as: "schoolInfo"
        }
      },
      {
        $unwind: "$schoolInfo"
      },
      {
        $project: {
          schoolName: "$schoolInfo.name",
          rating: "$totalRating"
        }
      },
      {
        $sort: {
          rating: -1
        }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    // Получаем общее количество школ (кроме школы пользователя)
    const totalSchools = await User.aggregate([
      {
        $group: {
          _id: "$schoolId"
        }
      },
      {
        $match: {
          _id: { $ne: userSchoolId }
        }
      },
      {
        $count: "total"
      }
    ]);

    const totalPages = Math.ceil((totalSchools[0]?.total || 0) / limit);

    return res.status(200).json({
      userSchoolName : userSchoolRating[0].schoolName,
      userSchoolRating : userSchoolRating[0].rating,
      schools: otherSchoolsRatings,
      currentPage: page,
      totalPages
    });

  } catch (error) {
    console.error('Error getting school ratings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;