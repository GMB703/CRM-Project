import React, { useState, useEffect } from 'react';
import { getLeadAnalytics, getRevenueAnalytics } from '../services/analyticsAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const AnalyticsDashboard = () => {
  const [leadData, setLeadData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const leadResponse = await getLeadAnalytics();
        if (leadResponse.data.success) {
          setLeadData([leadResponse.data.data]);
        }
        const revenueResponse = await getRevenueAnalytics();
        if (revenueResponse.data.success) {
          setRevenueData([revenueResponse.data.data]);
        }
      } catch (error) {
        console.error('Error loading analytics data:', error);
        toast.error('Failed to load analytics data');
      }
    };

    loadData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Lead Analytics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalLeads" fill="#8884d8" />
              <Bar dataKey="newLeads" fill="#82ca9d" />
              <Bar dataKey="wonLeads" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Revenue Analytics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalRevenue" fill="#8884d8" />
              <Bar dataKey="averageDealSize" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 