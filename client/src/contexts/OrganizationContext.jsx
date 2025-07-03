import React, { createContext, useContext, useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useAuth } from '../hooks/useAuth'
import { organizationService } from '../services/api'
import { setToken } from '../store/slices/authSlice'
import { getCurrentOrganization, setCurrentOrganization, getOrganizations } from '../services/organizationAPI'

// Organization type definition (using JSDoc for type hints)
/**
 * @typedef {Object} Organization
 * @property {string} id - Organization ID
 * @property {string} name - Organization name
 * @property {string} code - Organization code/slug
 * @property {Object} settings - Organization settings
 * @property {string} createdAt - Creation date
 * @property {string} updatedAt - Last update date
 */

/**
 * @typedef {Object} OrganizationContextType
 * @property {Organization|null} currentOrganization - Current active organization
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message
 * @property {Organization[]} availableOrganizations - Available organizations for user
 * @property {(orgId: string) => Promise<void>} switchOrganization - Function to switch organization
 * @property {() => Promise<void>} refreshOrganization - Function to refresh organization data
 */

// Create the context
const OrganizationContext = createContext(undefined)

/**
 * OrganizationProvider component that manages organization state
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const OrganizationProvider = ({ children }) => {
  const dispatch = useDispatch()
  const { user, token, isAuthenticated } = useAuth()
  const [currentOrganization, setCurrentOrganizationState] = useState(null)
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadOrganizations = async () => {
    // Only load organizations if user is authenticated
    if (!isAuthenticated || !user) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Load available organizations
      const orgsResponse = await getOrganizations()
      const availableOrgs = orgsResponse.organizations || []
      setOrganizations(availableOrgs)

      // Try to get current organization
      let currentOrg = null
      try {
        const currentResponse = await getCurrentOrganization()
        currentOrg = currentResponse.organization
      } catch (currentOrgError) {
        console.log('No current organization set, will use default')
      }

      // If no current org, but user has organizations, set the first one
      if (!currentOrg && availableOrgs.length > 0) {
        // For SuperAdmin, they might not have a default org
        if (user.role === 'SUPER_ADMIN') {
          // SuperAdmin can work without a default organization
          setCurrentOrganizationState(null)
        } else {
          // Regular users should have their organization set
          const userOrg = availableOrgs.find(org => org.id === user.organizationId) || availableOrgs[0]
          if (userOrg) {
            await switchOrganization(userOrg.id)
          }
        }
      } else {
        setCurrentOrganizationState(currentOrg)
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
      setError(error.message)
      // Clear organizations on error
      setOrganizations([])
      setCurrentOrganizationState(null)
    } finally {
      setLoading(false)
    }
  }

  const switchOrganization = async (organizationId) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      await setCurrentOrganization(organizationId)
      
      // Reload current organization data
      const response = await getCurrentOrganization()
      setCurrentOrganizationState(response.organization)
      
      // Trigger a page reload to refresh all organization-specific data
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch organization:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const initializeOrganization = async () => {
    // Only initialize if user is authenticated
    if (isAuthenticated && user) {
      await loadOrganizations()
    } else {
      // Clear organization data when not authenticated
      setOrganizations([])
      setCurrentOrganizationState(null)
      setLoading(false)
      setError(null)
    }
  }

  // Initialize organization context when auth state changes
  useEffect(() => {
    initializeOrganization()
  }, [isAuthenticated, user])

  // Context value
  const value = {
    currentOrganization,
    organizations,
    availableOrganizations: organizations,
    loading,
    error,
    switchOrganization,
    loadOrganizations,
    initializeOrganization,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

/**
 * Custom hook to use the organization context
 * @returns {OrganizationContextType} Organization context value
 */
export const useOrganization = () => {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

export default OrganizationProvider; 