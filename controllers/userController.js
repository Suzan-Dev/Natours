const User = require('../models/userModel');
const { catchAsync, ApiErrors } = require('../utils/apiErrors');
const { resWithoutData, resWithData, deleteOne, updateOne, getOne, getAll } = require('../utils/apiFuncs');

const filterObj = (obj, fields) => {
  const newFilteredObj = {};

  Object.keys(obj).forEach((key) => {
    if (fields.includes(key)) newFilteredObj[key] = obj[key];
  });

  return newFilteredObj;
};

// like /me route
exports.currentUser = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.updateCurrentUser = catchAsync(async (req, res, next) => {
  // console.log(req.file, req.body);
  const { password, confirmPassword } = req.body;

  if (password || confirmPassword) {
    return next(new ApiErrors(400, "This route is not for password updating. Use '/update-password' route instead!"));
  }

  // filter unwanted fields
  const filteredUserInfo = filterObj(req.body, ['name', 'email']);
  filteredUserInfo.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredUserInfo, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(resWithData('Success', 'User successfully updated!', updatedUser));
});

exports.deleteCurrentUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(200).json(resWithoutData('Success', 'User successfully deleted!'));
});

exports.getAllUsers = getAll(User, 'Users');
exports.getUser = getOne(User, 'User');
exports.updateUser = updateOne(User, 'User');
exports.deleteUser = deleteOne(User, 'User');
