const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const { catchAsync } = require('../utils/apiErrors');
const { getAll, getOne, createOne, deleteOne, updateOne, resWithoutData } = require('../utils/apiFuncs');

exports.getCheckoutSession = catchAsync(async (req, res) => {
  const tour = await Tour.findById(req.params.tourId);

  const domain = `${req.protocol}://${req.get('host')}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${domain}/tour/${tour.slug}?success=true`,
    cancel_url: `${domain}/tour/${tour.slug}?canceled=true`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`${domain}/img/tours/${tour.imageCover}`],
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

const createBookingCheckout = catchAsync(async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email }))._id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
});

exports.webhooksCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOKS_KEY);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json(resWithoutData('Success', 'Checkout completed successfully!'));
};

exports.getAllBookings = getAll(Booking, 'Bookings');
exports.getBooking = getOne(Booking, 'Booking');
exports.createBooking = createOne(Booking, 'Booking');
exports.updateBooking = updateOne(Booking, 'Booking');
exports.deleteBooking = deleteOne(Booking, 'Booking');
