const ClassServices = require("../services/class.services");

exports.index = async (req,res,next) => {
    try {
        res.render('home', { title: 'Главная страница' });
    } catch (error) {
        next(error);
    }
}
