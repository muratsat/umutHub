const School = require('../../models/school.model');
const User = require('../../models/user.model');
const Class = require('../../models/class.model');

exports.getSchools = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Количество школ на странице
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        const searchRegex = new RegExp(searchQuery, 'i');

        const schoolsQuery = School.find({ name: searchRegex })
            .select('name description') // Выбираем имя и описание
            .skip(skip)
            .limit(limit)
            .lean();

        const [schools, totalSchools] = await Promise.all([
            schoolsQuery.exec(),
            School.countDocuments({ name: searchRegex })
        ]);

        // Получаем количество учеников и учителей для каждой школы
        const schoolsWithStats = await Promise.all(schools.map(async (school) => {
            const classes = await Class.find({ schoolId: school._id });
            const classIds = classes.map(c => c._id);

            const [studentCount, teacherCount] = await Promise.all([
                User.countDocuments({ classId: { $in: classIds }, role: 0 }),
                User.countDocuments({ classId: { $in: classIds }, role: 1 })
            ]);

            return {
                ...school,
                studentCount,
                teacherCount
            };
        }));

        const totalPages = Math.ceil(totalSchools / limit);

        res.render('admin/schools-list', {
            schools: schoolsWithStats,
            currentPage: page,
            totalPages,
            totalSchools,
            searchQuery,
            limit
        });
    } catch (error) {
        console.error('Error fetching schools:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке списка школ' });
    }
};

exports.getSchoolById = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const school = await School.findById(schoolId);
        
        if (!school) {
            return res.status(404).render('404', { message: 'Школа не найдена' });
        }

        // Получаем количество учеников и учителей
        const studentCount = await User.countDocuments({ schoolId: schoolId, role: 0 });
        const teacherCount = await User.countDocuments({ schoolId: schoolId, role: 1 });

        // Получаем список администраторов школы
        const schoolAdmins = await User.find({ schoolId: schoolId, role: 1 }).select('name email');

        res.render('admin/school', { 
            school, 
            studentCount, 
            teacherCount, 
            schoolAdmins 
        });
    } catch (error) {
        console.error('Error fetching school data:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке данных школы' });
    }
};

exports.getEditSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) {
            return res.status(404).render('error', { message: 'Школа не найдена' });
        }
        
        const classes = await Class.find({ schoolId: school._id });
        const classIds = classes.map(c => c._id);
        
        const [studentCount, teacherCount] = await Promise.all([
            User.countDocuments({ classId: { $in: classIds }, role: 0 }),
            User.countDocuments({ classId: { $in: classIds }, role: 1 })
        ]);

        res.render('admin/edit-school', { 
            school, 
            studentCount, 
            teacherCount,
            classes
        });
    } catch (error) {
        console.error('Error fetching school for edit:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке данных школы' });
    }
};

exports.postEditSchool = async (req, res) => {
    try {
        const { name, description } = req.body;
        const school = await School.findById(req.params.id);
        
        if (!school) {
            return res.status(404).render('error', { message: 'Школа не найдена' });
        }

        school.name = name;
        school.description = description;

        await school.save();

        res.redirect('/admin/schools');
    } catch (error) {
        console.error('Error updating school:', error);
        res.status(500).render('error', { message: 'Ошибка при обновлении школы' });
    }
};


exports.deleteSchool = async (req, res) => {
    try {
        const schoolId = req.params.id;

        // Проверяем, есть ли связанные классы
        const relatedClasses = await Class.find({ schoolId: schoolId });
        if (relatedClasses.length > 0) {
            return res.status(400).json({ success: false, message: 'Нельзя удалить школу, у которой есть классы' });
        }

        // Если классов нет, удаляем школу
        await School.findByIdAndDelete(schoolId);

        res.json({ success: true, message: 'Школа успешно удалена' });
    } catch (error) {
        console.error('Error deleting school:', error);
        res.status(500).json({ success: false, message: 'Ошибка при удалении школы' });
    }
};