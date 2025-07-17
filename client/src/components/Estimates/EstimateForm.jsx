import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../hooks/useAuth";
import { useOrganization } from "../../contexts/OrganizationContext.jsx";
import { LoadingSpinner } from "../UI/LoadingSpinner.jsx";
import { Button } from "../UI/Button.jsx";
import { api } from "../../services/api";

const EstimateForm = ({ estimate, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    projectId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    description: "",
    notes: "",
    validUntil: "",
    taxRate: 0,
    discountAmount: 0,
    discountType: "amount", // 'amount' or 'percentage'
    lineItems: [
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        unit: "each",
        notes: "",
      },
    ],
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load clients
        const clientsResponse = await api.get("/clients");
        setClients(clientsResponse.data.data || []);

        // Load projects
        const projectsResponse = await api.get("/projects");
        setProjects(projectsResponse.data.data || []);

        // Load catalog items
        const catalogResponse = await api.get("/estimates/catalog");
        setCatalogItems(catalogResponse.data.data || []);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  // Load estimate data if editing
  useEffect(() => {
    if (estimate) {
      setFormData({
        title: estimate.title || "",
        clientId: estimate.clientId || "",
        projectId: estimate.projectId || "",
        clientName: estimate.clientName || "",
        clientEmail: estimate.clientEmail || "",
        clientPhone: estimate.clientPhone || "",
        clientAddress: estimate.clientAddress || "",
        description: estimate.description || "",
        notes: estimate.notes || "",
        validUntil: estimate.validUntil
          ? new Date(estimate.validUntil).toISOString().split("T")[0]
          : "",
        taxRate: estimate.taxRate || 0,
        discountAmount: estimate.discountAmount || 0,
        discountType: estimate.discountType || "amount",
        lineItems:
          estimate.lineItems?.length > 0
            ? estimate.lineItems
            : [
                {
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  unit: "each",
                  notes: "",
                },
              ],
      });
    }
  }, [estimate]);

  // Handle client selection
  const handleClientChange = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData((prev) => ({
        ...prev,
        clientId,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone || "",
        clientAddress: client.address || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        clientId: "",
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        clientAddress: "",
      }));
    }
  };

  // Handle line item changes
  const handleLineItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  // Add line item
  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          unit: "each",
          notes: "",
        },
      ],
    }));
  };

  // Remove line item
  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index),
      }));
    }
  };

  // Add catalog item to line items
  const addCatalogItem = (catalogItem) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          description: catalogItem.name,
          quantity: 1,
          unitPrice: catalogItem.price,
          unit: catalogItem.unit || "each",
          notes: catalogItem.description || "",
        },
      ],
    }));
    setSearchTerm("");
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    let discount = 0;
    if (formData.discountType === "percentage") {
      discount = subtotal * (formData.discountAmount / 100);
    } else {
      discount = formData.discountAmount;
    }

    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (formData.taxRate / 100);
    const total = afterDiscount + tax;

    return {
      subtotal,
      discount,
      tax,
      total,
    };
  };

  const totals = calculateTotals();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.clientName.trim()) {
      toast.error("Client name is required");
      return;
    }

    if (!formData.clientEmail.trim()) {
      toast.error("Client email is required");
      return;
    }

    if (
      formData.lineItems.length === 0 ||
      !formData.lineItems.some((item) => item.description.trim())
    ) {
      toast.error("At least one line item is required");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...formData,
        totalAmount: totals.total,
        subtotalAmount: totals.subtotal,
        taxAmount: totals.tax,
        discountAmount: totals.discount,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
      });
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  // Filter catalog items
  const filteredCatalogItems = catalogItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimate Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter estimate title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valid Until
          </label>
          <input
            type="date"
            value={formData.validUntil}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, validUntil: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserIcon className="w-5 h-5 mr-2" />
          Client Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Existing Client
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project (Optional)
            </label>
            <select
              value={formData.projectId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, projectId: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a project...</option>
              {projects
                .filter(
                  (p) => !formData.clientId || p.clientId === formData.clientId,
                )
                .map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clientName: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter client name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Email *
            </label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  clientEmail: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter client email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Phone
            </label>
            <input
              type="tel"
              value={formData.clientPhone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  clientPhone: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter client phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Address
            </label>
            <input
              type="text"
              value={formData.clientAddress}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  clientAddress: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter client address"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter estimate description"
        />
      </div>

      {/* Catalog Items */}
      {catalogItems.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add from Catalog
          </h3>

          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search catalog items..."
            />
          </div>

          {searchTerm && (
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredCatalogItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addCatalogItem(item)}
                  className="p-3 hover:bg-blue-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        ${item.price}
                      </div>
                      <div className="text-sm text-gray-500">
                        per {item.unit}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Line Items */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
          <Button
            type="button"
            onClick={addLineItem}
            variant="outline"
            size="sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {formData.lineItems.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleLineItemChange(index, "description", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Item description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleLineItemChange(
                        index,
                        "quantity",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleLineItemChange(
                        index,
                        "unitPrice",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={item.unit}
                    onChange={(e) =>
                      handleLineItemChange(index, "unit", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="each">Each</option>
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="sqft">Sq Ft</option>
                    <option value="linear_ft">Linear Ft</option>
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                </div>

                <div className="md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-800"
                    disabled={formData.lineItems.length === 1}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) =>
                    handleLineItemChange(index, "notes", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes for this item"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Pricing Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type
            </label>
            <select
              value={formData.discountType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  discountType: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="amount">Fixed Amount</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount {formData.discountType === "percentage" ? "(%)" : "($)"}
            </label>
            <input
              type="number"
              value={formData.discountAmount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  discountAmount: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              value={formData.taxRate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  taxRate: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>

        {/* Totals Summary */}
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">
                  -${totals.discount.toFixed(2)}
                </span>
              </div>
            )}
            {totals.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${totals.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Internal Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Internal notes (not visible to client)"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {estimate ? "Updating..." : "Creating..."}
            </>
          ) : estimate ? (
            "Update Estimate"
          ) : (
            "Create Estimate"
          )}
        </Button>
      </div>
    </form>
  );
};

export { EstimateForm };
