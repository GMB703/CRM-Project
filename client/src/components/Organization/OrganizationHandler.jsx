import React, { useState, useEffect } from 'react'
import OrganizationSelector from './OrganizationSelector'

/**
 * OrganizationHandler Component
 * Handles organization-related events from the API interceptors
 * and displays appropriate UI components
 */
const OrganizationHandler = () => {
  const [showSelector, setShowSelector] = useState(false)
  const [availableOrganizations, setAvailableOrganizations] = useState([])
  const [showAccessDenied, setShowAccessDenied] = useState(false)
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('')

  useEffect(() => {
    // Listen for organization selection required event
    const handleOrganizationSelectionRequired = (event) => {
      console.log('Organization selection required:', event.detail)
      setAvailableOrganizations(event.detail.organizations || [])
      setShowSelector(true)
    }

    // Listen for organization access denied event
    const handleOrganizationAccessDenied = (event) => {
      console.log('Organization access denied:', event.detail)
      setAccessDeniedMessage(event.detail.message || 'Access to this organization is denied.')
      setShowAccessDenied(true)
    }

    // Add event listeners
    window.addEventListener('organizationSelectionRequired', handleOrganizationSelectionRequired)
    window.addEventListener('organizationAccessDenied', handleOrganizationAccessDenied)

    // Cleanup event listeners
    return () => {
      window.removeEventListener('organizationSelectionRequired', handleOrganizationSelectionRequired)
      window.removeEventListener('organizationAccessDenied', handleOrganizationAccessDenied)
    }
  }, [])

  const handleOrganizationSelect = (orgId) => {
    console.log('Organization selected:', orgId)
    setShowSelector(false)
    setAvailableOrganizations([])
    // The switchOrganization call in OrganizationSelector will handle the rest
  }

  const handleSelectorCancel = () => {
    setShowSelector(false)
    setAvailableOrganizations([])
    // Optionally redirect to login or show a message
    window.location.href = '/login'
  }

  const handleAccessDeniedClose = () => {
    setShowAccessDenied(false)
    setAccessDeniedMessage('')
    // Optionally redirect to login or dashboard
    window.location.href = '/login'
  }

  return (
    <>
      {/* Organization Selection Modal */}
      {showSelector && (
        <OrganizationSelector
          organizations={availableOrganizations}
          onSelect={handleOrganizationSelect}
          onCancel={handleSelectorCancel}
        />
      )}

      {/* Organization Access Denied Modal */}
      {showAccessDenied && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600">
                {accessDeniedMessage}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAccessDeniedClose}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default OrganizationHandler 