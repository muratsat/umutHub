const User = require('../models/user.model');
const School = require('../models/school.model');
const Class = require('../models/class.model');
const AdminLog = require('../models/adminLog.model');

exports.getDashboard = async (req, res) => {
  try {
    const schoolCount = await School.countDocuments();
    const classCount = await Class.countDocuments();
    const teacherCount = await User.countDocuments({ role: 1 });

    res.render('admin/dashboard', {
      schoolCount,
      classCount,
      teacherCount,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).render('error', { message: 'Ошибка при загрузке данных панели управления' });
  }
};

exports.getSchoolAdmins = async (req, res) => {
  try {
    const schoolAdmins = await User.find({ role: 1 }).populate('schoolId');
    res.render('admin/schoolAdmins', { title: 'School Admins', schoolAdmins });
  } catch (error) {
    res.status(500).render('error', { message: 'Error loading school admins' });
  }
};

exports.getCreateSchoolAdmin = async (req, res) => {
  try {
    const schools = await School.find();
    res.render('admin/createSchoolAdmin', { title: 'Create School Admin', schools });
  } catch (error) {
    res.status(500).render('error', { message: 'Error loading create school admin form' });
  }
};

exports.postCreateSchoolAdmin = async (req, res) => {
  try {
    const { name, email, password, schoolId } = req.body;
    // Здесь должна быть логика создания/обновления школьного администратора
    // Используйте код из предыдущего примера

    res.redirect('/admin/school-admins');
  } catch (error) {
    res.status(400).render('admin/createSchoolAdmin', {
      title: 'Create School Admin',
      error: error.message,
      schools: await School.find()
    });
  }
};