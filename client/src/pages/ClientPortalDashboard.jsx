import React, { useState, useEffect } from 'react';
import { clientLogin, getEstimates, getContracts } from '../services/clientPortalAPI';
import toast from 'react-hot-toast';

const ClientPortalDashboard = () => {
  const [token, setToken] = useState(localStorage.getItem('clientToken'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [estimates, setEstimates] = useState([]);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (token) {
        try {
          const estimatesResponse = await getEstimates();
          if (estimatesResponse.data.success) {
            setEstimates(estimatesResponse.data.data);
          }
          const contractsResponse = await getContracts();
          if (contractsResponse.data.success) {
            setContracts(contractsResponse.data.data);
          }
        } catch (error) {
          console.error('Error loading data:', error);
          toast.error('Failed to load data');
        }
      }
    };

    loadData();
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await clientLogin({ email, password });
      if (response.data.success) {
        localStorage.setItem('clientToken', response.data.token);
        setToken(response.data.token);
        toast.success('Logged in successfully');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Failed to log in');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    setToken(null);
  };

  if (!token) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Client Portal Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Client Portal</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Logout
        </button>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">Estimates</h2>
        <div className="space-y-4">
          {estimates.map((estimate) => (
            <div key={estimate.id} className="p-4 border rounded">
              <h3 className="font-semibold">{estimate.title}</h3>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Contracts</h2>
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div key={contract.id} className="p-4 border rounded">
              <h3 className="font-semibold">{contract.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientPortalDashboard; 