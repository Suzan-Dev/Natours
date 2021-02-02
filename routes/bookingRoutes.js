const express = require('express');
const bookingController = require('../controllers/bookingController');
const { protectRoute, restrictRoute } = require('../utils/apiAuth');

const router = express.Router();
const { getCheckoutSession, getAllBookings, createBooking, getBooking, updateBooking, deleteBooking } = bookingController;

router.use(protectRoute);

// routes
router.get('/checkout-session/:tourId', getCheckoutSession);

router.use(restrictRoute(['admin', 'lead-guide']));

router.route('/').get(getAllBookings).post(createBooking);
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

module.exports = router;
