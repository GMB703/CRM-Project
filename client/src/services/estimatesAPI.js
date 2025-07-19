import { api } from "./api";

/**
 * Fetch a single estimate by ID.
 * Returns the unwrapped data object if the API response uses `{ success, data }` shape,
 * otherwise returns the full response data.
 * @param {string|number} id
 */
export const getEstimateById = async (id) => {
  if (!id) throw new Error("Estimate ID is required");
  const response = await api.get(`/estimates/${id}`);
  // Support both wrapped and unwrapped API formats
  return response.data?.data ?? response.data;
}; 