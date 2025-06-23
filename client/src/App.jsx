import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'

// Layout components
import Layout from './components/Layout/Layout'
import LoadingSpinner from './components/UI/LoadingSpinner'

// Auth components
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'

// Main pages
import Dashboard from './pages/Dashboard/Dashboard'
import Clients from './pages/Clients/Clients'
import Projects from './pages/Projects/Projects'
import Tasks from './pages/Tasks/Tasks'
import Estimates from './pages/Estimates/Estimates'
import Invoices from './pages/Invoices/Invoices'
import Calendar from './pages/Calendar/Calendar'
import Reports from './pages/Reports/Reports'
import Settings from './pages/Settings/Settings'

// Hooks
import { useAuth } from './hooks/useAuth'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Public Route component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Page transition component
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
)

function App() {
  return (
    <>
      <Helmet>
        <title>Home-Remodeling CRM</title>
        <meta name="description" content="Manage your construction projects efficiently" />
      </Helmet>

      <AnimatePresence mode="wait">
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <PageTransition>
                  <Login />
                </PageTransition>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <PageTransition>
                  <Register />
                </PageTransition>
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <PageTransition>
                  <ForgotPassword />
                </PageTransition>
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <PageTransition>
                  <ResetPassword />
                </PageTransition>
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="clients"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PageTransition>
                    <Clients />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="projects"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PageTransition>
                    <Projects />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="tasks"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PageTransition>
                    <Tasks />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="estimates"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PageTransition>
                    <Estimates />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="invoices"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PageTransition>
                    <Invoices />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="calendar"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PageTransition>
                    <Calendar />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="reports"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PageTransition>
                    <Reports />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PageTransition>
                    <Settings />
                  </PageTransition>
                </Suspense>
              }
            />
          </Route>

          {/* 404 route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-primary-500">404</h1>
                  <p className="text-xl text-gray-600 mt-4">Page not found</p>
                  <button
                    onClick={() => window.history.back()}
                    className="btn btn-primary mt-6"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default App 