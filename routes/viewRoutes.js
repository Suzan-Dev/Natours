const express = require('express');

const { getOverview, getTour, getLoginPage, getAccountPage, getMyToursPage } = require('../controllers/viewController');
const { createBookingCheckout } = require('../controllers/bookingController');
const { isLoggedIn, protectRoute } = require('../utils/apiAuth');

const router = express.Router();

router.get('/account', protectRoute, getAccountPage);
router.get('/my-tours', protectRoute, getMyToursPage);

router.use(isLoggedIn);

router.get('/', getOverview);
router.get('/tour/:tourSlug', createBookingCheckout, getTour);
router.get('/login', getLoginPage);

module.exports = router;
