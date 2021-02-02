class ApiErrors extends Error {
  constructor(statusCode, message) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'Failure' : 'Error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const sendErrorDev = (err, req, res) => {
  // Api
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // Rendered Website
  res.status(err.statusCode).render('error', {
    title: 'Page Not Found',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // Api
  if (req.originalUrl.startsWith('/api')) {
    // Operational/Trusted errors
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Programming/Unknown errors
    console.error(err);
    return res.status(500).json({
      status: 'Error',
      message: 'Something went wrong!',
    });
  }

  // Rendered Website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Page Not Found',
      msg: err.message,
    });
  }

  console.error(err);
  res.status(err.statusCode).render('error', {
    title: 'Page Not Found',
    msg: '404, Page Not Found!',
  });
};

const handleCastErrorDB = (err) => {
  const message = `Provided value '${err.value}' for ${err.path} field is invalid!`;
  return new ApiErrors(400, message);
};

const handleDuplicateErrorDB = (err) => {
  const message = `Tour with the name '${err.keyValue.name}' already exists!`;
  return new ApiErrors(400, message);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(({ message }) => message);
  const message = `Invalid entered data. ${errors.join(' ')}`;
  return new ApiErrors(400, message);
};

const handleJWTErrorAuth = () => new ApiErrors(401, 'Invalid token, Please log in again!');

const handleJWTExpiredErrorAuth = () => new ApiErrors(401, 'Your token has expired, Please log in again!');

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error';

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message; // req as no message when destructuring!

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateErrorDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTErrorAuth();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredErrorAuth();

    sendErrorProd(error, req, res);
  } else {
    sendErrorDev(err, req, res);
  }
};

const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

module.exports = { globalErrorHandler, ApiErrors, catchAsync };
