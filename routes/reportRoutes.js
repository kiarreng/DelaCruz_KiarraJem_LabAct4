const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reportCtrl = require('../controllers/reportController');

router.get('/reports/users-with-roles', auth(true), reportCtrl.usersWithRoles);
router.get('/reports/users-with-profiles', auth(true), reportCtrl.usersWithProfiles);
router.get('/reports/roles-right-join', auth(true), reportCtrl.rolesRightJoin);
router.get('/reports/profiles-full-outer', auth(true), reportCtrl.profilesFullOuter);
router.get('/reports/user-role-combos', auth(true), reportCtrl.userRoleCombos);
router.get('/reports/referrals', auth(true), reportCtrl.referrals);
router.get('/reports/latest-login', auth(true), reportCtrl.latestLogin);

module.exports = router;