const path = require('path');

const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const { createBookingCheckout } = require('./controllers/bookingController');
const { globalErrorHandler, ApiErrors } = require('./utils/apiErrors');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// for only our frontend website
// app.use(
//   cors({
//     origin: 'http://example.com',
//   })
// );

// for only a route
// app.options('/api/v1/tours/:id', cors());

// middleware
app.use(cors());
app.options('*', cors()); // for update,delete requests
app.use(helmet({ contentSecurityPolicy: false }));

const apiLimiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again after an hour!',
});

app.use('/api/', apiLimiter);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.post('/webhooks-checkout', express.raw({ type: 'application/json' }), createBookingCheckout);

app.use(express.json({ limit: '15kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// NoSQL Query injection & XSS & Parameter pollution protection & compression
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: ['difficulty', 'ratingsAverage', 'ratingsQuantity', 'duration', 'maxGroupSize', 'price'],
  })
);
app.use(compression());

// mounting routers(middleware)
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// handling not matched route
app.all('*', (req, res, next) => {
  // next(new ApiErrors(404, `Can't find ${req.originalUrl} route. Please try existing route instead!`));
  next(new ApiErrors(404, `404, Page Not Found!`));
});

// global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
