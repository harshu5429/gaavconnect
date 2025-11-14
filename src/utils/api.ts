import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-1a997823`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

export interface SavedRoute {
  id: string;
  origin: string;
  stops: any[];
  segments: any[];
  totalCost: number;
  totalDuration: string;
  totalDistance: string;
  algorithm: string;
  createdAt: string;
}

export interface CrowdReport {
  id: string;
  routeName: string;
  transportMode: string;
  fare: number;
  timing: string;
  comments: string;
  status: 'pending' | 'verified';
  createdAt: string;
}

export interface Stats {
  totalRoutes: number;
  totalReports: number;
  verifiedReports: number;
  activeUsers: number;
  villagesCovered: number;
  modeDistribution: Record<string, number>;
}

// Routes API
export async function saveRoute(route: Omit<SavedRoute, 'id' | 'createdAt'>) {
  try {
    const response = await fetch(`${API_BASE}/routes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(route),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save route');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving route:', error);
    throw error;
  }
}

export async function getRoute(routeId: string) {
  try {
    const response = await fetch(`${API_BASE}/routes/${routeId}`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch route');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching route:', error);
    throw error;
  }
}

export async function getRecentRoutes(): Promise<{ routes: SavedRoute[] }> {
  try {
    const response = await fetch(`${API_BASE}/routes`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch routes');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
}

// Crowd Reports API
export async function saveCrowdReport(report: Omit<CrowdReport, 'id' | 'createdAt' | 'status'>) {
  try {
    const response = await fetch(`${API_BASE}/crowd-reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save report');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving crowd report:', error);
    throw error;
  }
}

export async function getCrowdReports(): Promise<{ reports: CrowdReport[] }> {
  try {
    const response = await fetch(`${API_BASE}/crowd-reports`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch reports');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching crowd reports:', error);
    throw error;
  }
}

export async function updateReportStatus(reportId: string, status: 'pending' | 'verified') {
  try {
    const response = await fetch(`${API_BASE}/crowd-reports/${reportId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update report');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
}

// Stats API
export async function getStats(): Promise<{ stats: Stats }> {
  try {
    const response = await fetch(`${API_BASE}/stats`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}
