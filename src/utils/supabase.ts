/**
 * Local authentication system using localStorage
 * Bypasses Supabase for development/demo purposes
 */

import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const SUPABASE_URL = ((import.meta as any).env.VITE_SUPABASE_URL || '') as string;
const SUPABASE_ANON_KEY = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || '') as string;

// Check if credentials are available
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Supabase credentials not configured. Using local authentication.');
  console.warn('To fix this, add your Supabase URL and anon key to the .env file');
}

// Create client only if valid credentials are provided
export const supabase = (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'https://placeholder.supabase.co') 
  ? null 
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * User type for authentication
 */
export interface GaavUser {
  id: string;
  email: string;
  created_at: string;
  preferences?: {
    default_transport_mode?: string;
    theme?: 'light' | 'dark';
  };
}

// Local storage keys
const AUTH_KEY = 'gaav_auth';
const USER_KEY = 'gaav_user';

/**
 * Local user interface
 */
interface LocalUser {
  id: string;
  email: string;
  created_at: string;
  preferences?: {
    default_transport_mode?: string;
    theme?: 'light' | 'dark';
  };
}

/**
 * Sign up a new user (local)
 */
export async function signUpUser(email: string, _password: string) {
  // For demo purposes, create a local user
  const user: LocalUser = {
    id: `local_${Date.now()}`,
    email,
    created_at: new Date().toISOString(),
    preferences: {
      default_transport_mode: 'bus',
      theme: 'light',
    },
  };

  // Store in localStorage
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_KEY, 'true');

  return { user };
}

/**
 * Sign in an existing user (local)
 */
export async function signInUser(email: string, _password: string) {
  // For demo purposes, accept any email/password
  const user: LocalUser = {
    id: `local_${Date.now()}`,
    email,
    created_at: new Date().toISOString(),
    preferences: {
      default_transport_mode: 'bus',
      theme: 'light',
    },
  };

  // Store in localStorage
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_KEY, 'true');

  return { user };
}

/**
 * Sign out the current user (local)
 */
export async function signOutUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Get the current user (local)
 */
export async function getCurrentUser() {
  try {
    const auth = localStorage.getItem(AUTH_KEY);
    if (!auth) return null;

    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    return user as LocalUser;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get current session (local)
 */
export async function getCurrentSession() {
  try {
    const auth = localStorage.getItem(AUTH_KEY);
    if (!auth) return null;

    const user = await getCurrentUser();
    if (!user) return null;

    return {
      user,
      access_token: 'local_token',
      expires_at: Date.now() + 86400000, // 24 hours
    };
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Route saved by user
 */
export interface SavedRoute {
  id: string;
  user_id: string;
  origin: string;
  origin_lat: number;
  origin_lng: number;
  stops: Array<{
    name: string;
    lat: number;
    lng: number;
  }>;
  total_distance: number;
  total_cost: number;
  total_duration: number;
  optimized_route: number[];
  transport_mode: string;
  created_at: string;
  name?: string;
  is_favorite?: boolean;
}

/**
 * Crowd report for specific location
 */
export interface CrowdReport {
  id: string;
  user_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  severity: 'low' | 'medium' | 'high';
  crowd_count?: number;
  description: string;
  verified: boolean;
  upvotes: number;
  created_at: string;
  expires_at: string;
}

// Local storage keys for data
const ROUTES_KEY = 'gaav_routes';
const CROWD_REPORTS_KEY = 'gaav_crowd_reports';

/**
 * Save a route (local)
 */
export async function saveRoute(route: Omit<SavedRoute, 'id' | 'created_at'>) {
  try {
    const existingRoutes = JSON.parse(localStorage.getItem(ROUTES_KEY) || '[]');
    const newRoute = {
      ...route,
      id: `route_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    
    existingRoutes.push(newRoute);
    localStorage.setItem(ROUTES_KEY, JSON.stringify(existingRoutes));
    
    return newRoute;
  } catch (error) {
    console.error('Save route error:', error);
    throw error;
  }
}

/**
 * Get user's saved routes (local)
 */
export async function getUserRoutes(userId: string) {
  try {
    const routes = JSON.parse(localStorage.getItem(ROUTES_KEY) || '[]');
    return routes.filter((route: SavedRoute) => route.user_id === userId);
  } catch (error) {
    console.error('Get routes error:', error);
    return [];
  }
}

/**
 * Delete a saved route (local)
 */
export async function deleteRoute(routeId: string) {
  try {
    const existingRoutes = JSON.parse(localStorage.getItem(ROUTES_KEY) || '[]');
    const updatedRoutes = existingRoutes.filter((route: SavedRoute) => route.id !== routeId);
    localStorage.setItem(ROUTES_KEY, JSON.stringify(updatedRoutes));
  } catch (error) {
    console.error('Delete route error:', error);
    throw error;
  }
}

/**
 * Create a crowd report (local)
 */
export async function createCrowdReport(report: Omit<CrowdReport, 'id' | 'created_at' | 'upvotes' | 'verified'>) {
  try {
    const existingReports = JSON.parse(localStorage.getItem(CROWD_REPORTS_KEY) || '[]');
    const newReport = {
      ...report,
      id: `report_${Date.now()}`,
      created_at: new Date().toISOString(),
      upvotes: 0,
      verified: false,
    };
    
    existingReports.push(newReport);
    localStorage.setItem(CROWD_REPORTS_KEY, JSON.stringify(existingReports));
    
    return newReport;
  } catch (error) {
    console.error('Create crowd report error:', error);
    throw error;
  }
}

/**
 * Get crowd reports for location (local)
 */
export async function getCrowdReports(latitude: number, longitude: number, radiusKm: number = 5) {
  try {
    const reports = JSON.parse(localStorage.getItem(CROWD_REPORTS_KEY) || '[]');
    
    // Filter by distance client-side
    return reports.filter((report: CrowdReport) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        report.latitude,
        report.longitude
      );
      return distance <= radiusKm && new Date(report.expires_at) > new Date();
    });
  } catch (error) {
    console.error('Get crowd reports error:', error);
    return [];
  }
}

/**
 * Upvote a crowd report (local)
 */
export async function upvoteCrowdReport(reportId: string) {
  try {
    const existingReports = JSON.parse(localStorage.getItem(CROWD_REPORTS_KEY) || '[]');
    const reportIndex = existingReports.findIndex((report: CrowdReport) => report.id === reportId);
    
    if (reportIndex !== -1) {
      existingReports[reportIndex].upvotes += 1;
      localStorage.setItem(CROWD_REPORTS_KEY, JSON.stringify(existingReports));
    }
  } catch (error) {
    console.error('Upvote error:', error);
    throw error;
  }
}

/**
 * Helper: Calculate distance using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
