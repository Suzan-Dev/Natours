const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protectRoute, restrictRoute } = require('../utils/apiAuth');

const router = express.Router({ mergeParams: true });
const { getAllReviews, getReview, createReview, updateReview, deleteReview, getTourAndUserID } = reviewController;

router.use(protectRoute);

// routes
router
  .route('/')
  .get(getAllReviews)
  .post(restrictRoute(['traveller']), getTourAndUserID, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictRoute(['traveller', 'admin']), updateReview)
  .delete(restrictRoute(['traveller', 'admin']), deleteReview);

module.exports = router;
