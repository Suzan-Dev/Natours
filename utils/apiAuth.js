const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const { catchAsync, ApiErrors } = require('./apiErrors');
const Email = require('./mailClass');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const sendSuccessResWithToken = (req, res, statusCode, message, user) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(Date.now() + process.env.JWT_TOKEN_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers('x-forwarded-proto') === 'https',
  });

  user.password = undefined;
  user.active = undefined;

  res.status(statusCode).json({
    status: 'Success',
    message,
    token,
    data: user,
  });
};

exports.signUp = catchAsync(async (req, res) => {
  // const user = await User.create(req.body); // getting all fields -> security risk
  const { name, email, password, confirmPassword, role } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    confirmPassword,
    role,
  });

  // didn't used await here as it takes long time only to signup
  const url = `${req.protocol}://${req.get('host')}/account`;
  new Email(user, url).sendWelcome();

  sendSuccessResWithToken(res, 201, 'User successfully signed up!', user);
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiErrors(400, 'Please provide an email & password!'));
  }

  // check if email or password or both is incorrect
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new ApiErrors(401, 'Email or password is incorrect!'));
  }

  sendSuccessResWithToken(res, 200, 'Successfully logged in!', user);
});

exports.logOut = catchAsync(async (req, res) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  };
  res.cookie('jwt', 'LoggedOut!', cookieOptions);
  res.status(200).json({
    status: 'Success',
    message: 'Successfully logged out!',
  });
});

// important part -> checking if token used is stolen one
exports.protectRoute = catchAsync(async (req, res, next) => {
  const { authorization } = req.headers;
  const { jwt: jwtAuth } = req.cookies;

  let token;

  // Get token & check if its there
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  } else if (jwtAuth) {
    token = jwtAuth;
  }

  if (!token) {
    return next(new ApiErrors(401, 'Please log in first!'));
  }

  // Verify token -> its error in apiErrors file
  // promisify a func(method)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  const existingUser = await User.findById(decoded.id);
  if (!existingUser) {
    return next(new ApiErrors(401, "The user belonging to this token doesn't exists!"));
  }

  // Check if user has changed password after the token was issued(created)
  if (existingUser.checkIfPasswordChanged(decoded.iat)) {
    return next(new ApiErrors(401, 'User recently changed password. Please log in again!'));
  }

  req.user = existingUser;
  // sending user variable to pug
  res.locals.user = existingUser;
  next();
});

// RENDERING: to display dynamic header
exports.isLoggedIn = async (req, res, next) => {
  const { jwt: jwtAuth } = req.cookies;

  if (jwtAuth) {
    try {
      // promisify a func(method)
      const decoded = await promisify(jwt.verify)(jwtAuth, process.env.JWT_SECRET);

      // Check if user still exists
      const existingUser = await User.findById(decoded.id);
      if (!existingUser) {
        return next();
      }

      // Check if user has changed password after the token was issued(created)
      if (existingUser.checkIfPasswordChanged(decoded.iat)) {
        return next();
      }

      // sending user variable to pug
      res.locals.user = existingUser;
      return next();
    } catch {
      return next();
    }
  }
  next();
};

exports.restrictRoute = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiErrors(403, "You don't have permission to perform this action!"));
  }
  next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiErrors(400, 'Please enter your email address!'));
  }

  // Check if user with provided email exists
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiErrors(404, "Provided email address doesn't exists!"));
  }

  // Generate random reset token
  const resetToken = await user.createForgotPasswordToken();
  await user.save({ validateBeforeSave: false }); // removing validations

  try {
    // Send reset token to user's email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/forgot-password/${resetToken}`;
    new Email(user, resetUrl).sendResetPasswordToken();

    res.status(200).json({
      status: 'Success',
      message: 'Reset token successfully sent to your email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ApiErrors(500, 'There was an error sending the email. Please try again later!'));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // encrypt token
  const passwordResetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  // check encrypted tokens & expires Date
  const user = await User.findOne({ passwordResetToken, passwordResetTokenExpires: { $gt: Date.now() } });
  if (!user) {
    return next(new ApiErrors(400, 'Token is invalid or has expired!'));
  }

  // Password reset
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  sendSuccessResWithToken(res, 200, 'Password changed successfully!', user);
});

// TODO: 'Invalid token, Please log in again! -> JsonWebTokenError' coming from protectRoute middleware!
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { password, newPassword, confirmNewPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.checkPassword(password, user.password))) {
    return next(new ApiErrors(401, 'Your entered password is incorrect!'));
  }

  // NOTE: User.findByIdAndUpdate will NOT work here
  user.password = newPassword;
  user.confirmPassword = confirmNewPassword;
  await user.save();

  sendSuccessResWithToken(res, 200, 'Password updated successfully!', user);
});
