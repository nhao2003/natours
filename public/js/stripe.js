import axios from "axios";
import { showAlert } from "./alerts.js";
import { loadStripe } from '@stripe/stripe-js';
 
export const bookTour = async tourId => {
  const stripe = await loadStripe(
    "pk_test_51NndluCjE8i9saXi5glPj90Eqvr69eK2f4R7xSqHzypZj1x4sas20Qj6pCMvP1C3cEW39fxYln2xOPC0ujh2QtgZ00i6LPRlcf"
  );
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert(err);
  }
}
