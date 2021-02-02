const Review = require('../models/reviewModel');
const { createOne, deleteOne, updateOne, getOne, getAll } = require('../utils/apiFuncs');
// const { catchAsync, ApiErrors } = require('../utils/apiErrors');
// const ApiFeatures = require('../utils/apiFeatures');

exports.getTourAndUserID = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.getAllReviews = getAll(Review, 'Reviews');
exports.getReview = getOne(Review, 'Review');
exports.createReview = createOne(Review, 'Review');
exports.updateReview = updateOne(Review, 'Review');
exports.deleteReview = deleteOne(Review, 'Review');
