const express = require('express');

const { getOverview, getTour, getLoginPage, getAccountPage, getMyToursPage } = require('../controllers/viewController');
const { isLoggedIn, protectRoute } = require('../utils/apiAuth');

const router = express.Router();

router.get('/account', protectRoute, getAccountPage);
router.get('/my-tours', protectRoute, getMyToursPage);

router.use(isLoggedIn);

router.get('/', getOverview);
router.get('/tour/:tourSlug', getTour);
router.get('/login', getLoginPage);

module.exports = router;
