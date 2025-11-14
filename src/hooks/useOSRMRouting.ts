import { useState, useEffect, useCallback } from 'react';
import { 
  OSRMCoordinate, 
  OSRMRoute, 
  OSRMTripResponse,
  getOptimizedTrip,
  getRouteSummary,
  formatDistance,
  formatDuration
} from '../utils/osrmApi';

export interface RouteData {
  distance: string;
  duration: string;
  path: Array<{ lat: number; lng: number }>;
  waypoints: any[];
  optimizedOrder: number[];
  directions: any[];
  rawData: OSRMTripResponse;
}

export interface OSRMRoutingState {
  route: RouteData | null;
  loading: boolean;
  error: string | null;
  coordinates: OSRMCoordinate[];
}

export const useOSRMRouting = () => {
  const [state, setState] = useState<OSRMRoutingState>({
    route: null,
    loading: false,
    error: null,
    coordinates: []
  });

  const calculateRoute = useCallback(async (coordinates: OSRMCoordinate[]) => {
    if (coordinates.length < 2) {
      setState(prev => ({
        ...prev,
        error: 'At least 2 locations are required for route calculation',
        loading: false
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      coordinates
    }));

    try {
      const routeData = await getRouteSummary(coordinates);
      
      setState({
        route: routeData,
        loading: false,
        error: null,
        coordinates
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to calculate route',
        loading: false
      }));
    }
  }, []);

  const clearRoute = useCallback(() => {
    setState({
      route: null,
      loading: false,
      error: null,
      coordinates: []
    });
  }, []);

  const getOSRMRoute = useCallback((): OSRMRoute | null => {
    if (!state.route?.rawData.trips || state.route.rawData.trips.length === 0) {
      return null;
    }
    return state.route.rawData.trips[0];
  }, [state.route]);

  const getRouteMetrics = useCallback(() => {
    if (!state.route) {
      return {
        distance: 'N/A',
        duration: 'N/A',
        waypoints: 0,
        cost: '₹0'
      };
    }

    const osrmRoute = getOSRMRoute();
    if (!osrmRoute) {
      return {
        distance: state.route.distance,
        duration: state.route.duration,
        waypoints: state.coordinates.length,
        cost: '₹0'
      };
    }

    // Calculate estimated cost (rough calculation)
    const distanceKm = osrmRoute.distance / 1000;
    const estimatedCost = Math.round(distanceKm * 15); // ₹15 per km estimate

    return {
      distance: formatDistance(osrmRoute.distance),
      duration: formatDuration(osrmRoute.duration),
      waypoints: state.coordinates.length,
      cost: `₹${estimatedCost}`
    };
  }, [state.route, state.coordinates, getOSRMRoute]);

  return {
    ...state,
    calculateRoute,
    clearRoute,
    getOSRMRoute,
    getRouteMetrics
  };
};
