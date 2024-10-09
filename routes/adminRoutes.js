const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../controllers/adminAuthController');
const schoolController = require('../controllers/adminWeb/school.controller');


router.get('/login', adminAuth.getLoginPage);
router.post('/login', adminAuth.postLogin);
router.get('/enter-otp', adminAuth.getEnterOtpPage);
router.post('/enter-otp', adminAuth.postEnterOtp);


router.get('/dashboard',adminAuth.isAuthenticated,adminAuth.isSuperAdmin, adminController.getDashboard);


router.get('/list',adminAuth.isAuthenticated,adminAuth.isSuperAdmin, schoolController.getAdmins);
router.get('/create', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getCreateAdmin);
router.post('/create', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.postCreateAdmin);
router.delete('/:id', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.deleteAdmin);
router.get('/:id/edit', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getEditAdmin);
router.post('/:id/edit', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.postEditAdmin);


router.get('/schools',adminAuth.isAuthenticated,adminAuth.isSuperAdmin, schoolController.getSchools);
router.get('/schools/create', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getCreateSchool);
router.post('/schools/create', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.postCreateSchool);
router.get('/schools/:id',adminAuth.isAuthenticated,adminAuth.isSuperAdmin, schoolController.getSchoolById);
router.get('/schools/:id/edit', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getEditSchool);
router.post('/schools/:id/edit', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.postEditSchool);
router.delete('/schools/:id', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.deleteSchool);

router.get('/schools/:id/classes',adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getSchoolClasses);
router.get('/classes',adminAuth.isAuthenticated,adminAuth.isSuperAdmin, schoolController.getClassesList);
router.get('/classes/create', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getCreateClass);
router.get('/schools/:id/classes/create', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getCreateClass);
router.post('/classes/create', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.postCreateClass);
router.get('/classes/:id', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getClass);
router.get('/classes/:id/edit', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getEditClass);
router.post('/classes/:id/edit', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.postEditClass);
router.delete('/classes/:id', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.deleteClass);

router.get('/pupils',adminAuth.isAuthenticated,adminAuth.isSuperAdmin, schoolController.getPupils);
router.delete('/pupils/:id', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.deletePupil);
// router.get('/pupils/:id/edit', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getEditPupil);
// router.post('/pupils/:id/edit', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.postEditPupil);


router.get('/surveys',adminAuth.isAuthenticated, adminAuth.isSuperAdmin,schoolController.getSurveys);

router.get('/schools/:id/pupils', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getSchoolStudents);
router.get('/schools/:id/admins', adminAuth.isAuthenticated,adminAuth.isSuperAdmin,schoolController.getSchoolAdmins);
// router.get('/users', adminController.getSchoolAdmins);
// router.get('/create-school-admin', adminController.getCreateSchoolAdmin);
// router.post('/create-school-admin', adminController.postCreateSchoolAdmin);

module.exports = router;