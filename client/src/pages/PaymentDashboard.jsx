import React, { useState, useEffect } from 'react';
import { getPayments } from '../services/paymentAPI';
import toast from 'react-hot-toast';

const PaymentDashboard = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const response = await getPayments();
        if (response.data.success) {
          setPayments(response.data.data);
        }
      } catch (error) {
        console.error('Error loading payments:', error);
        toast.error('Failed to load payments');
      }
    };

    loadPayments();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payment Dashboard</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Stripe ID</th>
            <th className="py-2 px-4 border-b">Amount</th>
            <th className="py-2 px-4 border-b">Currency</th>
            <th className="py-2 px-4 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="py-2 px-4 border-b">{payment.stripeId}</td>
              <td className="py-2 px-4 border-b">{payment.amount / 100}</td>
              <td className="py-2 px-4 border-b">{payment.currency}</td>
              <td className="py-2 px-4 border-b">{payment.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentDashboard; 