import React, { useState, useEffect } from 'react'
import { useOrganization } from '../../contexts/OrganizationContext'
import { organizationService } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../UI/LoadingSpinner'
import toast from 'react-hot-toast'

/**
 * OrganizationSwitcher Component
 * Allows super admin users to switch between organizations
 */
const OrganizationSwitcher = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const { 
    currentOrganization, 
    availableOrganizations, 
    switchOrganization, 
    isLoading: contextLoading,
    error 
  } = useOrganization()
  const [isSwitching, setIsSwitching] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Check if user can switch organizations
  const canSwitch = user?.role === 'SUPER_ADMIN' && availableOrganizations?.length > 1

  const handleSwitchOrganization = async (organizationId) => {
    if (!organizationId || organizationId === currentOrganization?.id) {
      return
    }

    setIsSwitching(true)
    setSelectedOrgId(organizationId)
    
    try {
      // Use the enhanced context switchOrganization function
      await switchOrganization(organizationId)
      
      toast.success('Organization switched successfully')
      
      // Close the switcher modal
      onClose()
      
    } catch (error) {
      console.error('Failed to switch organization:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to switch organization')
    } finally {
      setIsSwitching(false)
      setSelectedOrgId('')
    }
  }

  const filteredOrganizations = (availableOrganizations || []).filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!canSwitch || user?.role !== 'SUPER_ADMIN') {
    return null
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Switch Organization
            </h3>
            <button
              onClick={onClose}
              disabled={isSwitching}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {currentOrganization && (
            <p className="text-sm text-gray-500 mt-1">
              Currently in: <span className="font-medium">{currentOrganization.name}</span>
            </p>
          )}
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Organization List */}
        <div className="max-h-64 overflow-y-auto">
          {contextLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                {searchTerm ? 'No organizations match your search' : 'No organizations available'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredOrganizations.map((org) => {
                const isCurrent = org.id === currentOrganization?.id
                
                return (
                  <button
                    key={org.id}
                    onClick={() => handleSwitchOrganization(org.id)}
                    disabled={isSwitching || isCurrent}
                    className={`w-full px-6 py-3 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isCurrent ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {org.name}
                        </p>
                        {org.code && (
                          <p className="text-xs text-gray-500">
                            Code: {org.code}
                          </p>
                        )}
                        {org.userCount !== undefined && (
                          <p className="text-xs text-gray-500">
                            {org.userCount} user{org.userCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div>
                        {isCurrent && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Current
                          </span>
                        )}
                        {isSwitching && selectedOrgId === org.id && (
                          <LoadingSpinner size="sm" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            Super admin access • Switch to any organization
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrganizationSwitcher 