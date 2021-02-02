const express = require('express');
const tourController = require('../controllers/tourController');
const { protectRoute, restrictRoute } = require('../utils/apiAuth');
const { resizeTourImages, uploadTourImages } = require('../utils/uploadFuncs');
const reviewRouter = require('./reviewRoutes');

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasBestFiveTours,
  getTourStats,
  getTourMonthlyPlans,
  getToursWithinRadius,
  getToursDistance,
} = tourController;

const router = express.Router();

// param middleware
// router.param('id', checkId);

// nested routes
router.use('/:tourId/reviews', reviewRouter);

// aliasing
router.get('/best-5-tours', aliasBestFiveTours, getAllTours);
router.get('/tour-stats', getTourStats);
router.get('/tour-monthly-plans/:year', protectRoute, restrictRoute(['admin', 'lead-guide', 'guide']), getTourMonthlyPlans);

// GeoSpatial
router.get('/tours-within', getToursWithinRadius);
router.get('/distance', getToursDistance);

// routes
router
  .route('/')
  .get(getAllTours)
  .post(protectRoute, restrictRoute(['admin', 'lead-guide']), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(protectRoute, restrictRoute(['admin', 'lead-guide']), uploadTourImages, resizeTourImages, updateTour)
  .delete(protectRoute, restrictRoute(['admin', 'lead-guide']), deleteTour);

module.exports = router;
