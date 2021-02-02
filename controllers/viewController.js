const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const { catchAsync, ApiErrors } = require('../utils/apiErrors');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.tourSlug }).populate('reviews');

  if (!tour) {
    return next(new ApiErrors(404, "Tour with provided name doesn't exists!"));
  }

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginPage = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Login',
  });
});

exports.getAccountPage = catchAsync(async (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
});

exports.getMyToursPage = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id });

  const toursId = bookings.map((booking) => booking.tour);
  const tours = await Tour.find({ _id: { $in: toursId } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
