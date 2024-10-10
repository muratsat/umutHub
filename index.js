const express = require("express");
const app = express();
const path = require('path');
const expressEjsLayouts = require('express-ejs-layouts');
const connectDb = require('./db.js');
const PORT = process.env.PORT || 3000;
const session = require('express-session');

connectDb();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressEjsLayouts);
app.set('layout', 'layouts/admin');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// Настройка сессий
app.use(session({
  name: 'node-admin',
  resave: false,
  secret: 'mhckckgckc432xyfdxvn*&bmvmfzgdzhx',
  saveUninitialized: false,
  cookie: {
  }
}));

const adminRoutes = require('./routes/adminRoutes.js');
app.use('/admin', adminRoutes);

app.use('/', adminRoutes);


//Import and use the Authentication Route
const authRoutes = require("./routes/authRoute.js");
app.use('/auth', authRoutes);

//Import and use the OTPRoute
const otpRoutes = require("./routes/otpRoute.js");
app.use('/verify-otp', otpRoutes);

const schoolRoutes= require("./routes/school.router.js");
app.use('/school',schoolRoutes);

const classRoutes= require("./routes/class.router.js");
app.use('/class',classRoutes);

const projectRoutes= require("./routes/project.router.js");
app.use('/project',projectRoutes);

const userRoutes= require("./routes/user.router.js");
app.use('/users',userRoutes);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const surveyRoutes = require('./routes/survey.router.js');
app.use('/survey', surveyRoutes);

const ratingRoutes = require('./routes/raiting.router.js');
app.use('/rating', ratingRoutes);

const eventRoutes = require('./routes/event.router.js');
app.use('/event', eventRoutes);

const discussionRoutes = require('./routes/discussion.router.js');
app.use('/discussion', discussionRoutes);

const adminManageRoutes = require('./routes/admin.manage.router.js');
app.use('/adminManage', adminManageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
});


app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`)
});