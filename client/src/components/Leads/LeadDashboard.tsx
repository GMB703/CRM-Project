import React from 'react';

const LeadDashboard = ({ leads }) => {
  const newLeads = leads.filter((lead) => lead.status === 'NEW').length;
  const wonLeads = leads.filter((lead) => lead.status === 'WON').length;
  const conversionRate = leads.length > 0 ? (wonLeads / leads.length) * 100 : 0;
  const averageDealSize =
    wonLeads > 0
      ? leads
          .filter((lead) => lead.status === 'WON')
          .reduce((acc, lead) => acc + lead.estimatedValue, 0) / wonLeads
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="p-4 bg-blue-100 rounded-lg">
        <h3 className="text-lg font-semibold">New Leads</h3>
        <p className="text-3xl font-bold">{newLeads}</p>
      </div>
      <div className="p-4 bg-green-100 rounded-lg">
        <h3 className="text-lg font-semibold">Won Leads</h3>
        <p className="text-3xl font-bold">{wonLeads}</p>
      </div>
      <div className="p-4 bg-yellow-100 rounded-lg">
        <h3 className="text-lg font-semibold">Conversion Rate</h3>
        <p className="text-3xl font-bold">{conversionRate.toFixed(2)}%</p>
      </div>
      <div className="p-4 bg-purple-100 rounded-lg">
        <h3 className="text-lg font-semibold">Average Deal Size</h3>
        <p className="text-3xl font-bold">${averageDealSize.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default LeadDashboard; 