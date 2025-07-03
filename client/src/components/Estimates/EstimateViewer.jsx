import React from 'react';
import {
  PencilIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useOrganization } from '../../contexts/OrganizationContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import Button from '../UI/Button';

const EstimateViewer = ({ 
  estimate, 
  onClose, 
  onEdit, 
  onDownloadPDF, 
  onEmail, 
  actionLoading 
}) => {
  const { currentOrganization } = useOrganization();

  if (!estimate) return null;

  // Calculate totals
  const subtotal = estimate.lineItems?.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0) || 0;

  let discount = 0;
  if (estimate.discountType === 'percentage') {
    discount = subtotal * (estimate.discountAmount / 100);
  } else {
    discount = estimate.discountAmount || 0;
  }

  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * ((estimate.taxRate || 0) / 100);
  const total = afterDiscount + tax;

  // Status configuration
  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, label: 'Draft' },
    sent: { color: 'bg-blue-100 text-blue-800', icon: EnvelopeIcon, label: 'Sent' },
    approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Rejected' },
    expired: { color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon, label: 'Expired' },
  };

  const statusInfo = statusConfig[estimate.status] || statusConfig.draft;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Actions */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{estimate.title}</h2>
          <div className="flex items-center mt-2 space-x-4">
            <span className="text-sm text-gray-500">
              Estimate #{estimate.estimateNumber}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={onDownloadPDF}
            disabled={actionLoading?.includes('pdf')}
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-800"
          >
            {actionLoading?.includes('pdf') ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            )}
            PDF
          </Button>
          <Button
            onClick={onEmail}
            disabled={actionLoading?.includes('email')}
            variant="outline"
            size="sm"
            className="text-purple-600 hover:text-purple-800"
          >
            {actionLoading?.includes('email') ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <EnvelopeIcon className="w-4 h-4 mr-2" />
            )}
            Email
          </Button>
        </div>
      </div>

      {/* Estimate Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        {/* Company Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {currentOrganization?.logoUrl && (
              <img
                src={currentOrganization.logoUrl}
                alt={currentOrganization.name}
                className="h-12 w-auto mb-4"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="text-2xl font-bold text-gray-900">
              {currentOrganization?.name || 'Your Company'}
            </div>
            <div className="text-gray-600 mt-1">
              {currentOrganization?.address && (
                <div>{currentOrganization.address}</div>
              )}
              {currentOrganization?.phone && (
                <div>{currentOrganization.phone}</div>
              )}
              {currentOrganization?.email && (
                <div>{currentOrganization.email}</div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600 mb-2">ESTIMATE</div>
            <div className="text-sm text-gray-600">
              <div>Estimate #: {estimate.estimateNumber}</div>
              <div>Date: {new Date(estimate.createdAt).toLocaleDateString()}</div>
              {estimate.validUntil && (
                <div>Valid Until: {new Date(estimate.validUntil).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <UserIcon className="w-5 h-5 mr-2" />
              Bill To:
            </h3>
            <div className="text-gray-700">
              <div className="font-medium">{estimate.clientName}</div>
              {estimate.clientEmail && (
                <div className="flex items-center mt-1">
                  <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                  {estimate.clientEmail}
                </div>
              )}
              {estimate.clientPhone && (
                <div className="flex items-center mt-1">
                  <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                  {estimate.clientPhone}
                </div>
              )}
              {estimate.clientAddress && (
                <div className="flex items-center mt-1">
                  <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                  {estimate.clientAddress}
                </div>
              )}
            </div>
          </div>

          {estimate.project && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                Project:
              </h3>
              <div className="text-gray-700">
                <div className="font-medium">{estimate.project.name}</div>
                {estimate.project.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {estimate.project.description}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {estimate.description && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <div className="text-gray-700 whitespace-pre-wrap">
              {estimate.description}
            </div>
          </div>
        )}

        {/* Line Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Description
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-900">
                    Qty
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-900">
                    Unit Price
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-900">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {estimate.lineItems?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="font-medium text-gray-900">{item.description}</div>
                      {item.notes && (
                        <div className="text-sm text-gray-600 mt-1">{item.notes}</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Discount {estimate.discountType === 'percentage' ? `(${estimate.discountAmount}%)` : ''}:
                  </span>
                  <span className="font-medium text-red-600">-${discount.toFixed(2)}</span>
                </div>
              )}
              
              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({estimate.taxRate}%):</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• This estimate is valid for 30 days from the date issued unless otherwise specified.</p>
            <p>• Prices are subject to change without notice.</p>
            <p>• Payment terms: Net 30 days upon acceptance of estimate.</p>
            <p>• Work will commence upon signed approval and receipt of deposit if required.</p>
            {estimate.validUntil && (
              <p>• This estimate expires on {new Date(estimate.validUntil).toLocaleDateString()}.</p>
            )}
          </div>
        </div>

        {/* Internal Notes (only visible in viewer, not in PDF) */}
        {estimate.notes && (
          <div className="border-t border-gray-200 pt-6 mt-6 bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Internal Notes</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {estimate.notes}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              * Internal notes are not included in client-facing documents
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
          Thank you for your business!
        </div>
      </div>

      {/* Close Button */}
      <div className="flex justify-center mt-6">
        <Button
          onClick={onClose}
          variant="outline"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default EstimateViewer;
