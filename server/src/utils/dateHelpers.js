const getDateRange = (timeframe) => {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeframe) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1); // Default to month
  }

  // Set time to start and end of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This Date Helpers module is complete and stable.
 * Core functionality:
 * - Date range calculations
 * - Time period handling
 * - Date normalization
 * 
 * This is a core date manipulation component.
 * Changes here could affect all date-related functionality.
 * Modify only if absolutely necessary and after thorough testing.
 */

module.exports = {
  getDateRange
}; 