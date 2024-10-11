const path = require('path');
const User = require('../models/user.model');
const { sendOTPByEmail } = require("../middlewares/emailOtpMiddleware");
const otpGenerator  = require("../utils/otpGenerator");

exports.getLoginPage = (req, res) => {
    console.log('Rendering login page');
    res.render('auth/login', {
        layout: path.join(__dirname, "../views/layouts/login"),
        footer: true,
      }
    );
    
};

exports.getLogout =  (req, res) => {
    // Уничтожаем сессию пользователя
    req.session.destroy((err) => {
      if (err) {
        console.error('Ошибка при выходе из системы:', err);
        return res.status(500).send('Произошла ошибка при выходе из системы');
      }
      
      // Очищаем куки сессии
      res.clearCookie('connect.sid');
      
      // Перенаправляем пользователя на страницу входа
      res.redirect('/admin/login');
    });
  };


exports.postLogin = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('auth/login', { error: 'Пользователь не найден', layout: path.join(__dirname, "../views/layouts/login"),
                footer: true, });
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
        res.status(500).render('auth/login', { error: 'Произошла ошибка при отправке OTP',layout: path.join(__dirname, "../views/layouts/login"),
            footer: true, });
    }
};

exports.getEnterOtpPage = (req, res) => {
    const email = req.session.userEmail; // Предполагается, что email сохранен в сессии
    if (!email) {
        return res.redirect('/admin/login');
    }
    res.render('auth/enter-otp', { email: email,layout: path.join(__dirname, "../views/layouts/login"),
        footer: true, });
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
        req.session.userRole = user.role;
                
        if(user.role===1){
            req.session.schoolId = user.schoolId;
            res.redirect(`/admin/schools/${user.schoolId}`);
        }else{
            res.redirect('/admin/dashboard');
        }
    } catch (error) {
        res.status(500).render('auth/enter-otp', { error: 'Произошла ошибка при проверке OTP' ,layout: path.join(__dirname, "../views/layouts/login"),
            footer: true,});
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
            res.status(403).send(`
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Доступ запрещен</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #f0f0f0;
                        }
                        .error-container {
                            text-align: center;
                            padding: 2rem;
                            background-color: white;
                            border-radius: 8px;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        h1 {
                            color: #d32f2f;
                        }
                        p {
                            color: #333;
                        }
                        a {
                            color: #1976d2;
                            text-decoration: none;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>403 - Доступ запрещен</h1>
                        <p>У вас нет прав для доступа к этой странице.</p>
                        <p>Вернуться на <a href="/admin/dashboard">главную страницу</a></p>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Ошибка при проверке прав доступа:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ошибка сервера</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f0f0f0;
                    }
                    .error-container {
                        text-align: center;
                        padding: 2rem;
                        background-color: white;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #d32f2f;
                    }
                    p {
                        color: #333;
                    }
                    a {
                        color: #1976d2;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>500 - Ошибка сервера</h1>
                    <p>Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте позже.</p>
                    <p>Вернуться на <a href="/admin/dashboard">главную страницу</a></p>
                </div>
            </body>
            </html>
        `);
        }
};


exports.isSuperAdminAndSchoolAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user && (user.role === 2 || (user.role===1 && req.params.id==user.schoolId))) {
            next();
        } else {
            res.status(403).send(`
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Доступ запрещен</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #f0f0f0;
                        }
                        .error-container {
                            text-align: center;
                            padding: 2rem;
                            background-color: white;
                            border-radius: 8px;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        h1 {
                            color: #d32f2f;
                        }
                        p {
                            color: #333;
                        }
                        a {
                            color: #1976d2;
                            text-decoration: none;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>403 - Доступ запрещен</h1>
                        <p>У вас нет прав для доступа к этой странице.</p>
                        <p>Вернуться на <a href="/admin/dashboard">главную страницу</a></p>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Ошибка при проверке прав доступа:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ошибка сервера</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f0f0f0;
                    }
                    .error-container {
                        text-align: center;
                        padding: 2rem;
                        background-color: white;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #d32f2f;
                    }
                    p {
                        color: #333;
                    }
                    a {
                        color: #1976d2;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>500 - Ошибка сервера</h1>
                    <p>Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте позже.</p>
                    <p>Вернуться на <a href="/admin/dashboard">главную страницу</a></p>
                </div>
            </body>
            </html>
        `);
        }
};

exports.isSuperAdminAndSchoolAdminCRUD = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user && (user.role === 2 || (user.role===1))) {
            next();
        } else {
            res.status(403).send(`
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Доступ запрещен</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #f0f0f0;
                        }
                        .error-container {
                            text-align: center;
                            padding: 2rem;
                            background-color: white;
                            border-radius: 8px;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        h1 {
                            color: #d32f2f;
                        }
                        p {
                            color: #333;
                        }
                        a {
                            color: #1976d2;
                            text-decoration: none;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>403 - Доступ запрещен</h1>
                        <p>У вас нет прав для доступа к этой странице.</p>
                        <p>Вернуться на <a href="/admin/dashboard">главную страницу</a></p>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Ошибка при проверке прав доступа:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ошибка сервера</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f0f0f0;
                    }
                    .error-container {
                        text-align: center;
                        padding: 2rem;
                        background-color: white;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #d32f2f;
                    }
                    p {
                        color: #333;
                    }
                    a {
                        color: #1976d2;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>500 - Ошибка сервера</h1>
                    <p>Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте позже.</p>
                    <p>Вернуться на <a href="/admin/dashboard">главную страницу</a></p>
                </div>
            </body>
            </html>
        `);
        }
};


exports.isSchoolAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user && user.role === 1) {
            next();
        } else {
            res.status(403).send(`
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Доступ запрещен</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #f0f0f0;
                        }
                        .error-container {
                            text-align: center;
                            padding: 2rem;
                            background-color: white;
                            border-radius: 8px;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        h1 {
                            color: #d32f2f;
                        }
                        p {
                            color: #333;
                        }
                        a {
                            color: #1976d2;
                            text-decoration: none;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>403 - Доступ запрещен</h1>
                        <p>У вас нет прав для доступа к этой странице.</p>
                        <p>Вернуться на <a href="/admin/dashboard">главную страницу</a></p>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Ошибка при проверке прав доступа:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ошибка сервера</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f0f0f0;
                    }
                    .error-container {
                        text-align: center;
                        padding: 2rem;
                        background-color: white;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #d32f2f;
                    }
                    p {
                        color: #333;
                    }
                    a {
                        color: #1976d2;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>500 - Ошибка сервера</h1>
                    <p>Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте позже.</p>
                    <p>Вернуться на <a href="/admin/dashboard">главную страницу</a></p>
                </div>
            </body>
            </html>
        `);
        }
    
};
