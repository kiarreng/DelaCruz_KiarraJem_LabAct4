const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/auth/signup', ctrl.signup);
router.post('/auth/login', ctrl.login);
router.post('/auth/logout', auth(true), ctrl.logout);
router.get('/profile', auth(true), ctrl.profile);

module.exports = router;