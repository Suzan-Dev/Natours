const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const { catchAsync } = require('../utils/apiErrors');
const { getAll, getOne, createOne, deleteOne, updateOne } = require('../utils/apiFuncs');

exports.getCheckoutSession = catchAsync(async (req, res) => {
  const tour = await Tour.findById(req.params.tourId);

  const domain = `${req.protocol}://${req.get('host')}/tour/${tour.slug}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${domain}?success=true&tour=${tour.id}&user=${req.user._id}&price=${tour.price}`,
    cancel_url: `${domain}?canceled=true`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: 'Success',
    message: 'Session created successfully!',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // Later will be replaced with stripe webhooks as this is not secure
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = getAll(Booking, 'Bookings');
exports.getBooking = getOne(Booking, 'Booking');
exports.createBooking = createOne(Booking, 'Booking');
exports.updateBooking = updateOne(Booking, 'Booking');
exports.deleteBooking = deleteOne(Booking, 'Booking');
