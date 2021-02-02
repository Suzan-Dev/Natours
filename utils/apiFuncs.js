const { catchAsync, ApiErrors } = require('./apiErrors');
const ApiFeatures = require('./apiFeatures');

const resWithoutData = (status, message) => ({ status, message });
const resWithData = (status, message, data) => ({ status, message, data });
const resWithResultAndData = (status, message, result, data) => ({ status, message, result, data });

// Factory funcs

const getAll = (Model, type) =>
  catchAsync(async (req, res, next) => {
    let filterObj = {};
    if (req.params.tourId) filterObj = { tour: req.params.tourId };

    const features = new ApiFeatures(req.query, Model.find(filterObj)).filter().sort().limitFields().paginate();
    // const doc = await features.mongooseQueryObj.explain();
    const doc = await features.mongooseQueryObj;

    res.status(200).json(resWithResultAndData('Success', `${type} successfully fetched!`, doc.length, doc));
  });

const getOne = (Model, type, populateOpt) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOpt) query = query.populate(populateOpt);
    const doc = await query;

    if (!doc) return next(new ApiErrors(404, `${type} with provided id not found!`));

    res.status(200).json(resWithData('Success', `${type} successfully fetched!`, doc));
  });

const createOne = (Model, type) =>
  catchAsync(async (req, res, next) => {
    const newTour = await Model.create(req.body);
    res.status(201).json(resWithData('Success', `${type} successfully Added!`, newTour));
  });

const updateOne = (Model, type) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) return next(new ApiErrors(404, `${type} with provided id not found!`));

    res.status(200).json(resWithData('Success', `${type} successfully updated!`, doc));
  });

const deleteOne = (Model, type) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) return next(new ApiErrors(404, `${type} with provided id not found!`));

    res.status(200).json(resWithoutData('Success', `${type} successfully deleted!`));
  });

module.exports = { resWithoutData, resWithData, resWithResultAndData, getAll, getOne, createOne, deleteOne, updateOne };
