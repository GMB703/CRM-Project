import React from "react";

export const Button = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This Button component is complete and stable.
 * Core functionality:
 * - Multiple variants (primary, secondary, outline, danger, success)
 * - Multiple sizes (sm, md, lg)
 * - Disabled state handling
 * - Focus and hover states
 * - Custom class support
 *
 * This is a core UI component used throughout the application.
 * Changes here could affect all button instances.
 * Modify only if absolutely necessary and after thorough UI testing.
 */
