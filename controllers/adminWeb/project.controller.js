const Project = require('../../models/project.model');
const School = require('../../models/school.model');
const Class = require('../../models/class.model');
const User = require('../../models/user.model');
const path = require('path');



// Projects controller
exports.getProjectList = async (req,res,next) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Количество опросов на странице
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        const searchRegex = new RegExp(searchQuery, 'i');

        let projectQuery;

        if(req.session.userRole===1){
            projectQuery = Project.find({name: searchRegex, schoolId: req.session.schoolId})
            .populate('name')
            .skip(skip)
            .limit(limit)
            .lean();
        }else{
            projectQuery = Project.find({name: searchRegex })
            .populate('name')
            .skip(skip)
            .limit(limit)
            .lean();
        }
        

        const [projects, totalProject] = await Promise.all([
            projectQuery.exec(),
            Project.countDocuments({ name: searchRegex})
        ]);

        const projectsWithStats = await Promise.all(projects.map(async (projectItem) => {
            var school=await School.findById(projectItem.schoolId).select('name');
            const schoolName = school ? school.name : 'Неизвестная школа';
            const inProjectUserCount=projectItem.users.length;
            return {
                ...projectItem,
                schoolName,
                inProjectUserCount
            };
        }));

        const totalPages = Math.ceil(totalProject / limit);

        if(req.session.userRole===1){
            res.render('admin/project/project-list.ejs', {
                projects: projectsWithStats,
                currentPage: page,
                totalPages,
                totalProject,
                searchQuery,
                limit,
                layout: path.join(__dirname, "../../views/layouts/schoolAdmin"),
                headerTitle: `Проекты`,
                currentPageTitle: 'projects',
                schoolId: req.session.schoolId
            });
        }
        res.render('admin/project/project-list.ejs', {
            projects: projectsWithStats,
            currentPage: page,
            totalPages,
            totalProject,
            searchQuery,
            limit
        });

    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).render('error', { message: 'Ошибка при загрузке списка проектов' });
    }
}

exports.deleteProject = async (req, res) => {
    try {
        const projectId = req.params.id;

        // Проверяем, есть ли связанные классы
        const project = await Project.findById(projectId);
        if (project.users.length > 0) {
            return res.status(400).json({ success: false, message: 'Нельзя удалить проект, у которого есть участники' });
        }

        // Если классов нет, удаляем школу
        await Project.findByIdAndDelete(projectId);

        res.json({ success: true, message: 'Проект успешно удален' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ success: false, message: 'Ошибка при удалении проекта' });
    }
};

exports.editProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);
        const schools = await School.find();

        res.render('admin/project/project-edit', { 
            project,
            schools
        });
    } catch (error) {
        console.error('Error loading project edit page:', error);
        res.status(500).send('Ошибка при загрузке страницы редактирования проекта');
    }
};

exports.createProject = async (req, res) => {
    try {
        const schools = await School.find().lean();
        const classes = await Class.find().lean();
        res.render('admin/project/project-create', { 
            schools,
            classes
        });
    } catch (error) {
        console.error('Error loading project create page:', error);
        res.status(500).send('Ошибка при загрузке страницы создание проекта');
    }
};