import React, { useState, useEffect } from 'react'
import { useOrganization } from '../../contexts/OrganizationContext'
import LoadingSpinner from '../UI/LoadingSpinner'

/**
 * OrganizationSelector Component
 * Displays when user needs to select an organization (triggered by 300 status from API)
 */
const OrganizationSelector = ({ organizations, onSelect, onCancel }) => {
  const { switchOrganization, isLoading } = useOrganization()
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-select first organization if only one available
  useEffect(() => {
    if (organizations && organizations.length === 1) {
      setSelectedOrgId(organizations[0].id)
    }
  }, [organizations])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedOrgId) return

    setIsSubmitting(true)
    try {
      await switchOrganization(selectedOrgId)
      onSelect?.(selectedOrgId)
    } catch (error) {
      console.error('Failed to switch organization:', error)
      // Error handling is done in the context
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
  }

  if (isLoading || isSubmitting) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">
              {isSubmitting ? 'Switching organization...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Select Organization
          </h2>
          <p className="text-gray-600">
            Please select an organization to continue accessing the system.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
              Available Organizations
            </label>
            <select
              id="organization"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select an organization...</option>
              {organizations?.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} {org.code ? `(${org.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!selectedOrgId || isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {organizations?.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              No organizations available. Please contact your administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrganizationSelector 