const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const School = require('../models/school.model');
const authMiddleware = require('../middlewares/authMiddleware');
 
// Создание школьного администратора
router.post('/create-school-admin', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { name, email, schoolId } = req.body;

    // Проверка существования школы
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'Школа не найдена' });
    }

    let user = await User.findOne({ email });
    let action;

    if (user) {
      // Если пользователь существует, обновляем его роль
      user.role = 1;
      user.schoolId = schoolId;
      action = 'update_school_admin';
    } else {
      // Если пользователь не существует, создаем нового
    //   const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        name,
        email,
        role: 1,
        schoolId
      });
      action = 'create_school_admin';
    }

    await user.save();

    // // Логирование действия
    // await AdminLog.create({
    //   action,
    //   performedBy: req.user._id,
    //   affectedUser: user._id,
    //   details: { schoolId }
    // });

    res.status(action === 'create_school_admin' ? 201 : 200).json({
      message: `Школьный администратор успешно ${action === 'create_school_admin' ? 'создан' : 'обновлен'}`,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        schoolId: user.schoolId
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при создании школьного администратора', error: error.message });
  }
});

// Получение списка всех школьных администраторов
router.get('/school-admins', authMiddleware.isAdmin, async (req, res) => {
  try {
    const schoolAdmins = await User.find({ role: 1 })
      .select('name email schoolId')
      .populate('schoolId', 'name');

    res.json(schoolAdmins);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при получении списка школьных администраторов', error: error.message });
  }
});

// Удаление школьного администратора
router.delete('/school-admin', authMiddleware.isAdmin, async (req, res) => {
  try {
    const admin = await User.findOneAndDelete({ _id: req.body.id, role: 1 });
    if (!admin) {
      return res.status(404).json({ message: 'Школьный администратор не найден' });
    }
    res.json({ message: 'Школьный администратор успешно удален', admin });
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при удалении школьного администратора', error: error.message });
  }
});

module.exports = router;