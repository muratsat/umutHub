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

router.get('/schools',adminAuth.isAuthenticated,adminAuth.isSuperAdmin, schoolController.getSchools);
router.get('/schools/:id',adminAuth.isAuthenticated,adminAuth.isSuperAdmin, schoolController.getSchoolById);
router.get('/schools/:id/edit', schoolController.getEditSchool);
router.post('/schools/:id/edit', schoolController.postEditSchool);
router.delete('/schools/:id', schoolController.deleteSchool);
// router.get('/users', adminController.getSchoolAdmins);
// router.get('/create-school-admin', adminController.getCreateSchoolAdmin);
// router.post('/create-school-admin', adminController.postCreateSchoolAdmin);

module.exports = router;