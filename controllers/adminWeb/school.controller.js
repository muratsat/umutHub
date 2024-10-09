const School = require('../../models/school.model');
const User = require('../../models/user.model');
const Class = require('../../models/class.model');
const Survey = require('../../models/survey.model');
const SurveyResponse = require('../../models/surveyResponse.model');

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
                teacherCount,
                classCount: classes.length
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

exports.getCreateSchool = async (req, res) => {
    res.render('admin/school-create');
};

exports.getCreateClass = async (req, res) => {
    try {
        let schools
        const schoolId=req.params.id;
        if(req.params.id){
            const school=await School.findById(schoolId);
            schools=[school];
        }else{
            schools=await School.find();
        }
        
        
        if (!schools) {
            return res.status(404).render('error', { message: 'Школ не найдено' });
        }

        res.render('admin/class-create', { 
            schools
        });
    } catch (error) {
        console.error('Error fetching school data:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке данных школ' });
    }
};

exports.postCreateSchool = async (req, res) => {
    try {
        const { name, description } = req.body;
        const existingSchool = await School.findOne({ name: name });
        
        if (existingSchool) {
            return res.status(404).render('error', { message: 'Школа с таким названием уже существует' });
        }

        const newSchool = new School({ name, description });
        await newSchool.save();
        res.redirect('/admin/schools');
    } catch (error) {
        console.error('Error creating school:', error);
        res.status(500).render('error', { message: 'Ошибка при создании школы' });
    }
};

exports.postCreateClass = async (req, res) => {
    try {
        const { name, description, schoolId } = req.body;
        const existingClass = await Class.findOne({ name: name });
        
        if (existingClass) {
            return res.status(404).render('error', { message: 'Класс с таким названием уже существует' });
        }

        const newClass = new Class({ name, description, schoolId });
        await newClass.save();
        res.redirect('/admin/classes');
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).render('error', { message: 'Ошибка при создании класса' });
    }
};

exports.getSchoolById = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const school = await School.findById(schoolId);
        
        if (!school) {
            return res.status(404).render('404', { message: 'Школа не найдена' });
        }

        const classes = await Class.find({ schoolId: school._id });
            const classIds = classes.map(c => c._id);

            const [studentCount, teacherCount] = await Promise.all([
                User.countDocuments({ classId: { $in: classIds }, role: 0 }),
                User.countDocuments({ classId: { $in: classIds }, role: 1 })
            ]);

        // Получаем список администраторов школы
        const schoolAdmins = await User.find({ classId: { $in: classIds }, role: 1}).select('name email');

        res.render('admin/school', { 
            school, 
            classCount: classes.length,
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

exports.deleteClass = async (req, res) => {
    try {
        const classId = req.params.id;

        // Проверяем, есть ли связанные классы
        const relatedUsers = await User.find({ classId: classId });
        if (relatedUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Нельзя удалить класс, у которой есть ученики' });
        }

        // Если классов нет, удаляем школу
        await Class.findByIdAndDelete(classId);

        res.json({ success: true, message: 'Класс успешно удален' });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ success: false, message: 'Ошибка при удалении класса' });
    }
};

exports.getSchoolClasses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Количество классов на странице
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        const searchRegex = new RegExp(searchQuery, 'i');

        const classesQuery = Class.find({ 
            schoolId: req.params.id,
            name: searchRegex 
        })
            .select('name description')
            .skip(skip)
            .limit(limit)
            .lean();

        const [classes, totalClasses] = await Promise.all([
            classesQuery.exec(),
            Class.countDocuments({ schoolId: req.params.id, name: searchRegex })
        ]);
        
        const classesWithStats = await Promise.all(classes.map(async (classItem) => {
            const studentCount = await User.countDocuments({ classId: classItem._id, role: 0 });
            return {
                ...classItem,
                studentCount
            };
        }));

        const schoolId = req.params.id;
        const school = await School.findById(schoolId);

        const totalPages = Math.ceil(totalClasses / limit);

        res.render('admin/school-classes', {
            classes: classesWithStats,
            currentPage: page,
            totalPages,
            totalClasses,
            searchQuery,
            limit,
            school
        });
    } catch (error) {
        console.error('Error fetching school classes:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке классов' });
    }
};

// exports.getSchoolClasses = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = 10; // Количество классов на странице
//         const skip = (page - 1) * limit;

//         const searchQuery = req.query.search || '';
//         const searchRegex = new RegExp(searchQuery, 'i');

//         const classes = await Class.find({ schoolId: req.params.id });

//         const classesQuery = await Class.find({ name: searchRegex })
//             .populate('name description')
//             .skip(skip)
//             .limit(limit)
//             .lean();

//         const [classesSecond, totalClasses] = await Promise.all([
//             classesQuery.exec(),
//             classes.countDocuments({ name: searchRegex })
//         ]);
        
//         const classesWithStats = await Promise.all(classesSecond.map(async (classItem) => {
//             const studentCount = await User.countDocuments({ classId: classItem._id, role: 0 });
//             return {
//                 ...classItem,
//                 studentCount
//             };
//         }));

//         const totalPages = Math.ceil(totalClasses / limit);
//         // res.render('admin/school-classes', { school, classes });
//         res.render('admin/school-classes', {
//             classes: classesWithStats,
//             currentPage: page,
//             totalPages,
//             totalClasses,
//             searchQuery,
//             limit
//         });
//     } catch (error) {
//         console.error('Error fetching school classes:', error);
//         res.status(500).render('error', { message: 'Ошибка при загрузке классов' });
//     }
// };

exports.getClassesList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Количество классов на странице
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        const searchRegex = new RegExp(searchQuery, 'i');

        const classesQuery = Class.find({ name: searchRegex })
            .populate('name')
            .skip(skip)
            .limit(limit)
            .lean();

        const [classes, totalClasses] = await Promise.all([
            classesQuery.exec(),
            Class.countDocuments({ name: searchRegex })
        ]);

        // Получаем количество учеников для каждого класса
        const classesWithStats = await Promise.all(classes.map(async (classItem) => {
            const studentCount = await User.countDocuments({ classId: classItem._id, role: 0 });
            const school = await School.findById(classItem.schoolId).select('name');
            const schoolName = school ? school.name : 'Неизвестная школа';
            return {
                ...classItem,
                studentCount,
                schoolName
            };
        }));

        const totalPages = Math.ceil(totalClasses / limit);

        res.render('admin/classes', {
            classes: classesWithStats,
            currentPage: page,
            totalPages,
            totalClasses,
            searchQuery,
            limit
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке списка классов' });
    }
};

exports.getClass = async (req, res) => {
    try {
        const classId = req.params.id;
        const classItem = await Class.findById(classId).populate('schoolId', 'name');
        
        if (!classItem) {
            return res.status(404).render('error', { message: 'Класс не найден' });
        }

        const students = await User.find({ classId: classId, role: 0 })
            .select('name surname email rating')
            .sort({ rating: -1 }); // Сортировка по рейтингу (по убыванию)

        res.render('admin/class-details', {
            classItem,
            students,
            studentCount: students.length
        });
    } catch (error) {
        console.error('Error fetching class details:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке информации о классе' });
    }
};


exports.getEditClass = async (req, res) => {
    try {
        // const schoolId=req.params.id;
        
        const myClass=await Class.findById(req.params.id);
        if (!myClass) {
            return res.status(404).render('error', { message: 'Класс не найден' });
        }

        const schools=await School.find();
        
        
        if (!schools) {
            return res.status(404).render('error', { message: 'Школы не найдены' });
        }

        res.render('admin/class-edit', { 
            schools,
            myClass
        });
    } catch (error) {
        console.error('Error fetching class for edit:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке данных школы' });
    }
};

exports.postEditClass = async (req, res) => {
    try {
        const { name, description, schoolId } = req.body;
        const myClass = await Class.findById(req.params.id);
        
        if (!myClass) {
            return res.status(404).render('error', { message: 'Класс не найден' });
        }

        const school = await School.findById(schoolId);
        
        if (!school) {
            return res.status(404).render('error', { message: 'Школа не найдена' });
        }

        myClass.name = name;
        myClass.description = description;
        myClass.schoolId=schoolId;

        await myClass.save();

        res.redirect('/admin/classes');
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).render('error', { message: 'Ошибка при обновлении класса' });
    }
};

exports.getSchoolStudents = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        const classes = await Class.find({ schoolId: req.params.id });
        const classIds = classes.map(c => c._id);
        const students = await User.find({ classId: { $in: classIds }, role: 0 });
        res.render('admin/school-students', { school, students });
    } catch (error) {
        console.error('Error fetching school students:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке учеников' });
    }
};


exports.getSchoolAdmins = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        const admins = await User.find({ schoolId: req.params.id, role: 1 });
        res.render('admin/school-admins', { school, admins });
    } catch (error) {
        console.error('Error fetching school admins:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке администраторов' });
    }
};


exports.getAdmins = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Количество классов на странице
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        const searchRegex = new RegExp(searchQuery, 'i');

        const adminsQuery = User.find({role: 1, email: searchRegex })
            .populate('name')
            .skip(skip)
            .limit(limit)
            .lean();

        const [admins, totalAdmins] = await Promise.all([
            adminsQuery.exec(),
            User.countDocuments({ email: searchRegex, role: 1 })
        ]);

        // Получаем количество учеников для каждого класса
        const adminsWithStats = await Promise.all(admins.map(async (adminItem) => {
            const school = await School.findById(adminItem.schoolId).select('name');
            const schoolName = school ? school.name : 'Неизвестная школа';
            return {
                ...adminItem,
                schoolName
            };
        }));

        const totalPages = Math.ceil(totalAdmins / limit);

        res.render('admin/admin-list', {
            admins: adminsWithStats,
            currentPage: page,
            totalPages,
            totalAdmins,
            searchQuery,
            limit
        });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке списка админов' });
    }
};

exports.getPupils = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Количество классов на странице
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        const searchRegex = new RegExp(searchQuery, 'i');

        const pupilsQuery = User.find({role: 0, email: searchRegex })
            .populate('name')
            .skip(skip)
            .limit(limit)
            .lean();

        const [pupils, totalPupils] = await Promise.all([
            pupilsQuery.exec(),
            User.countDocuments({ email: searchRegex, role: 0})
        ]);

        // Получаем количество учеников для каждого класса
        const pupilsWithStats = await Promise.all(pupils.map(async (pupilItem) => {
            const pupilClass = await Class.findById(pupilItem.classId);
            var school;
            if(pupilClass){
                school = await School.findById(pupilClass.schoolId).select('name');
            }
            const className = pupilClass ? pupilClass.name : 'Неизвестный класс';
            const schoolName = school ? school.name : 'Неизвестная школа';
            return {
                ...pupilItem,
                schoolName,
                className
            };
        }));

        const totalPages = Math.ceil(totalPupils / limit);

        res.render('admin/pupil/pupil-list', {
            pupils: pupilsWithStats,
            currentPage: page,
            totalPages,
            totalPupils,
            searchQuery,
            limit
        });
    } catch (error) {
        console.error('Error fetching pupils:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке списка учеников' });
    }
};

exports.deletePupil = async (req, res) => {
    try {
        const pupilId = req.params.id;

        await User.findByIdAndDelete(pupilId);

        res.json({ success: true, message: 'Ученик успешно удален' });
    } catch (error) {
        console.error('Error deleting pupil:', error);
        res.status(500).json({ success: false, message: 'Ошибка при удалении ученика' });
    }
};


exports.getCreateAdmin = async (req, res) => {
    try {
        let schools
        const schoolId=req.params.id;
        if(schoolId){
            const school=await School.findById(schoolId);
            schools=[school];
        }else{
            schools=await School.find();
        }
        
        
        if (!schools) {
            return res.status(404).render('error', { message: 'Школ не найдено' });
        }

        res.render('admin/admin-create', { 
            schools
        });
    } catch (error) {
        console.error('Error fetching school data:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке данных школ' });
    }
};

exports.postCreateAdmin = async (req, res) => {
    try {
        const { name, surname, schoolId, email} = req.body;
        const existingAdmin = await User.findOne({ email });
        
        if (existingAdmin) {
            return res.status(404).render('error', { message: 'Админ уже существует' });
        }

        const newAdmin = new User({ name, surname, schoolId, email, role: 1 });
        await newAdmin.save();
        res.redirect('/admin/list');
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).render('error', { message: 'Ошибка при создании админа' });
    }
};

exports.getEditAdmin = async (req, res) => {
    try {
        // const schoolId=req.params.id;
        
        const admin=await User.findById(req.params.id);
        if (!admin) {
            return res.status(404).render('error', { message: 'Админ не найден' });
        }

        const schools=await School.find();
        
        
        if (!schools) {
            return res.status(404).render('error', { message: 'Школы не найдены' });
        }

        res.render('admin/admin-edit', { 
            schools,
            admin
        });
    } catch (error) {
        console.error('Error fetching admin for edit:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке данных админа' });
    }
};

exports.postEditAdmin = async (req, res) => {
    try {
        const { name, surname, schoolId, email } = req.body;
        const admin = await User.findById(req.params.id);
        
        if (!admin) {
            return res.status(404).render('error', { message: 'Админ не найден' });
        }

        const school = await School.findById(schoolId);
        
        if (!school) {
            return res.status(404).render('error', { message: 'Школа не найдена' });
        }

        admin.name = name;
        admin.surname = surname;
        admin.schoolId=schoolId;
        admin.email=email;

        await admin.save();

        res.redirect('/admin/list');
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).render('error', { message: 'Ошибка при редактировании админа' });
    }
};


exports.deleteAdmin = async (req, res) => {
    try {
        const adminId = req.params.id;

        await User.findByIdAndDelete(adminId);

        res.json({ success: true, message: 'Админ успешно удален' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ success: false, message: 'Ошибка при удалении админа' });
    }
};



exports.getSurveys = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Количество опросов на странице
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        const searchRegex = new RegExp(searchQuery, 'i');

        const surveysQuery = Survey.find({name: searchRegex })
            .populate('name')
            .skip(skip)
            .limit(limit)
            .lean();

        const [surveys, totalSurveys] = await Promise.all([
            surveysQuery.exec(),
            Survey.countDocuments({ name: searchRegex})
        ]);

        // Получаем количество учеников для каждого класса
        const surveysWithStats = await Promise.all(surveys.map(async (surveyItem) => {
            const surveyClass = await Class.findById(surveyItem.classes[0]);
            var school;
            if(surveyClass){
                school = await School.findById(surveyClass.schoolId).select('name');
            }
            const className = surveyClass ? surveyClass.name : 'Неизвестный класс';
            const schoolName = school ? school.name : 'Неизвестная школа';
            const surveyResCount=await SurveyResponse.countDocuments({survey:surveyItem._id})

            console.log(`${surveyResCount} survey response count`)
            return {
                ...surveyItem,
                schoolName,
                surveyResCount
            };
        }));

        const totalPages = Math.ceil(totalSurveys / limit);

        res.render('admin/survey/survey-list.ejs', {
            surveys: surveysWithStats,
            currentPage: page,
            totalPages,
            totalSurveys,
            searchQuery,
            limit
        });
    } catch (error) {
        console.error('Error fetching surveys:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке списка опросов' });
    }
};