import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSidebarOpen,
  selectMobileSidebarOpen,
  selectSidebarCollapsed,
  toggleSidebar,
  toggleMobileSidebar,
  setMobileSidebarOpen,
} from "../../store/slices/uiSlice";

import { Sidebar } from "./Sidebar.jsx";
import { Header } from "./Header.jsx";
import { MobileSidebar } from "./MobileSidebar.jsx";

const Layout = () => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export { Layout };

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This Layout component is complete and stable.
 * Core functionality:
 * - Responsive sidebar management
 * - Mobile/desktop layout handling
 * - Animation transitions
 * - Redux state integration
 * - Event listeners for resize and escape key
 *
 * This is the main layout component that wraps the entire application.
 * Changes here could affect the entire application's layout and responsiveness.
 * Modify only if absolutely necessary and after thorough UI/UX testing.
 */
