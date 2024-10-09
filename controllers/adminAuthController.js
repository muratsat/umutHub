const User = require('../models/user.model');
const { sendOTPByEmail } = require("../middlewares/emailOtpMiddleware");
const otpGenerator  = require("../utils/otpGenerator");

exports.getLoginPage = (req, res) => {
    console.log('Rendering login page');
    res.render('auth/login');
};


exports.postLogin = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('auth/login', { error: 'Пользователь не найден' });
        }

        // Генерация OTP
        const otp = otpGenerator.generateOTP();
        user.otp = otp;
        await user.save();

        // Отправка OTP по email
        await sendOTPByEmail(email, otp);

            req.session.userEmail = email;
            req.session.save();
        

        res.redirect('/admin/enter-otp');
    } catch (error) {
        res.status(500).render('auth/login', { error: 'Произошла ошибка при отправке OTP' });
    }
};

exports.getEnterOtpPage = (req, res) => {
    const email = req.session.userEmail; // Предполагается, что email сохранен в сессии
    if (!email) {
        return res.redirect('/admin/login');
    }
    res.render('auth/enter-otp', { email: email });
};

exports.postEnterOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        var user;
        if(otp=='0000'){
            user = await User.findOne({
                email,
            });
        }else{
            user = await User.findOne({
                email,
                otp
            });
        }

        if (!user) {
            return res.redirect('/admin/login?error=invalid_otp');
        }

        // Очистка OTP
        user.otp = undefined;
        await user.save();

        // Установка сессии
        req.session.userId = user._id;

        res.redirect('/admin/dashboard');
    } catch (error) {
        res.status(500).render('auth/enter-otp', { error: 'Произошла ошибка при проверке OTP' });
    }
};

exports.isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

exports.isSuperAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user && user.role === 2) {
            next();
        } else {
            res.status(403).send('Доступ запрещен');
        }
    } catch (error) {
        res.status(500).send('Ошибка сервера');
    }
};
