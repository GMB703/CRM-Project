import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '../components/Payments/PaymentForm';

const PaymentPage = () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return (
      <div className="p-6 text-red-600">
        Stripe publishable key is not configured. Please set
        <code className="mx-1 bg-gray-100 px-1">VITE_STRIPE_PUBLISHABLE_KEY</code>
        in your environment.
      </div>
    );
  }

  const stripePromise = loadStripe(publishableKey);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Make a Payment</h1>
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </div>
  );
};

export default PaymentPage; 