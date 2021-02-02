/* eslint-disable */
import axios from 'axios';
const stripe = Stripe('pk_test_51HUTXJHXCOtqMoqVZzldNSLB41eaILHBfP0RA00oewC4U3v0TeFlu5gsbacxYJ0tIbHVHSIzDBvZR4M692teqVUq00pSOJWc0E');
import showToast from './toasts';

export const bookTour = async (tourId) => {
  try {
    // Get Checkout session form Api
    const res = await axios(`http://localhost:8000/api/v1/bookings/checkout-session/${tourId}`);

    // Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: res.data.session.id,
    });
  } catch (err) {
    showToast('error', err.response.data.message);
  }
};
