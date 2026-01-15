/**
 * API Configuration for Blood Donor Management System
 * 
 * This module provides the base URL and helper functions for API calls
 * to the backend server connected to the MySQL database (per ERD)
 */

// API base URL - can be configured via environment variable
// Always ensures /api prefix is present
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

// Helper function to make API requests
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// API endpoints matching the backend routes
export const API_ENDPOINTS = {
  // Auth
  REQUEST_OTP: '/auth/request-otp',
  VERIFY_OTP: '/auth/verify-otp',
  
  // Donors
  REGISTER_DONOR: '/donors/register',
  GET_PROFILE: '/donors/profile',
  UPDATE_PROFILE: '/donors/profile',
  DELETE_PROFILE: '/donors/profile',
  SEARCH_DONORS: '/donors/search',
  
  // Requests
  CREATE_REQUEST: '/requests/create',
  GET_ACTIVE_REQUESTS: '/requests/active',
  
  // Statistics
  GET_STATISTICS: '/statistics',
  
  // Health
  HEALTH_CHECK: '/health',
};
