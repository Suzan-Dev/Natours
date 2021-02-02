const Tour = require('../models/tourModel');
const { resWithData, resWithResultAndData, getAll, getOne, createOne, deleteOne, updateOne } = require('../utils/apiFuncs');
const { catchAsync, ApiErrors } = require('../utils/apiErrors');
// const ApiFeatures = require('../utils/apiFeatures');

exports.aliasBestFiveTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,-ratingsQuantity';
  next();
};

exports.getAllTours = getAll(Tour, 'Tours');
exports.getTour = getOne(Tour, 'Tour', 'reviews');
exports.createTour = createOne(Tour, 'Tour');
exports.updateTour = updateOne(Tour, 'Tour');
exports.deleteTour = deleteOne(Tour, 'Tour');

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        totalTours: { $sum: 1 },
        totalRatings: { $sum: '$ratingsQuantity' },
        averageRating: { $avg: '$ratingsAverage' },
        averagePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { averagePrice: 1 },
    },
  ]);

  res.status(200).json(resWithData('Success', 'Tour stats successfully fetched!', stats));
});

exports.getTourMonthlyPlans = catchAsync(async (req, res, next) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const { year } = req.params;

  const plans = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        tours: { $sum: 1 },
        tourNames: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { month: 1 },
    },
    {
      $limit: 12,
    },
  ]);

  const plansWithMonthNames = plans.map(({ tours, tourNames, month }) => ({
    month: monthNames[month - 1],
    tours: tours,
    tourNames: tourNames,
  }));

  res.status(200).json(resWithResultAndData('Success', 'Tour monthly plans successfully fetched!', plans.length, plansWithMonthNames));
});

exports.getToursWithinRadius = catchAsync(async (req, res, next) => {
  const { distance, latitude, longitude, unit } = req.query;

  if (!distance || !latitude || !longitude) {
    return next(new ApiErrors(400, 'Please provide distance, latitude and longitude fields!'));
  }
  if (unit !== 'mi' && unit !== 'km') {
    return next(new ApiErrors(400, 'Unit can only be in kilometers(km) or miles(mi)!'));
  }

  // convert to radian
  const radius = unit === 'mi' ? +distance / 3958.8 : +distance / 6371;
  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[longitude, latitude], radius] } } });

  res.status(200).json(resWithResultAndData('Success', 'Nearby Tours successfully fetched!', tours.length, tours));
});

exports.getToursDistance = catchAsync(async (req, res, next) => {
  const { latitude, longitude, unit } = req.query;

  if (!latitude || !longitude) {
    return next(new ApiErrors(400, 'Please provide latitude and longitude fields!'));
  }
  if (unit !== 'mi' && unit !== 'km') {
    return next(new ApiErrors(400, 'Unit can only be in kilometers(km) or miles(mi)!'));
  }

  const multiplier = unit === 'km' ? 0.001 : 0.000621371;

  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+longitude, +latitude],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json(resWithResultAndData('Success', 'Tours distance successfully fetched!', tours.length, tours));
});
