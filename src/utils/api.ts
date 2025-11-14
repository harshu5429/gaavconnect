// Local API functions using localStorage for development/demo
// This bypasses the need for Supabase configuration

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

// Local storage keys
const ROUTES_KEY = 'gaav_local_routes';
const REPORTS_KEY = 'gaav_local_reports';
const STATS_KEY = 'gaav_local_stats';

// Initialize local stats if not exists
const initializeStats = (): Stats => ({
  totalRoutes: 0,
  totalReports: 0,
  verifiedReports: 0,
  activeUsers: 1,
  villagesCovered: 25,
  modeDistribution: {
    bus: 45,
    auto: 30,
    walk: 15,
    bike: 10
  }
});

// Routes API
export async function saveRoute(route: Omit<SavedRoute, 'id' | 'createdAt'>) {
  try {
    const existingRoutes = JSON.parse(localStorage.getItem(ROUTES_KEY) || '[]');
    const newRoute = {
      ...route,
      id: `route_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    existingRoutes.push(newRoute);
    localStorage.setItem(ROUTES_KEY, JSON.stringify(existingRoutes));
    
    // Update stats
    const stats = getStats();
    stats.totalRoutes += 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    
    return newRoute;
  } catch (error) {
    console.error('Save route error:', error);
    throw error;
  }
}

// Helper function to get stats
const getStats = (): Stats => {
  const stored = localStorage.getItem(STATS_KEY);
  if (!stored) {
    const stats = initializeStats();
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    return stats;
  }
  return JSON.parse(stored);
};

export async function getRoute(routeId: string) {
  try {
    const routes = JSON.parse(localStorage.getItem(ROUTES_KEY) || '[]');
    const route = routes.find((r: SavedRoute) => r.id === routeId);
    
    if (!route) {
      throw new Error('Route not found');
    }
    
    return route;
  } catch (error) {
    console.error('Error fetching route:', error);
    throw error;
  }
}

export async function getRecentRoutes(): Promise<{ routes: SavedRoute[] }> {
  try {
    const routes = JSON.parse(localStorage.getItem(ROUTES_KEY) || '[]');
    // Return last 10 routes, most recent first
    const recentRoutes = routes
      .sort((a: SavedRoute, b: SavedRoute) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    return { routes: recentRoutes };
  } catch (error) {
    console.error('Error fetching routes:', error);
    return { routes: [] };
  }
}

// Crowd Reports API
export async function saveCrowdReport(report: Omit<CrowdReport, 'id' | 'createdAt' | 'status'>) {
  try {
    const existingReports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    const newReport = {
      ...report,
      id: `report_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
    };
    
    existingReports.push(newReport);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(existingReports));
    
    // Update stats
    const stats = getStats();
    stats.totalReports += 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    
    return newReport;
  } catch (error) {
    console.error('Error saving crowd report:', error);
    throw error;
  }
}

export async function getCrowdReports(): Promise<{ reports: CrowdReport[] }> {
  try {
    const reports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    // Return last 20 reports, most recent first
    const recentReports = reports
      .sort((a: CrowdReport, b: CrowdReport) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
    
    return { reports: recentReports };
  } catch (error) {
    console.error('Error fetching crowd reports:', error);
    return { reports: [] };
  }
}

export async function updateReportStatus(reportId: string, status: 'pending' | 'verified') {
  try {
    const reports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    const reportIndex = reports.findIndex((r: CrowdReport) => r.id === reportId);
    
    if (reportIndex === -1) {
      throw new Error('Report not found');
    }
    
    reports[reportIndex].status = status;
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    
    // Update stats
    if (status === 'verified') {
      const stats = getStats();
      stats.verifiedReports += 1;
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
    
    return reports[reportIndex];
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
}

// Stats API
export async function getStatsFromAPI(): Promise<{ stats: Stats }> {
  try {
    const stats = getStats();
    return { stats };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { stats: initializeStats() };
  }
}
