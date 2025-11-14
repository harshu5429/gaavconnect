/**
 * Offline support utilities using IndexedDB
 */

const DB_NAME = 'gaavconnect';
const DB_VERSION = 1;

interface PendingRoute {
  id: string;
  user_id: string;
  origin: string;
  stops: any[];
  total_distance: number;
  total_cost: number;
  created_at: string;
}

interface PendingReport {
  id: string;
  user_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  created_at: string;
}

// Initialize database
export function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('routes')) {
        db.createObjectStore('routes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-routes')) {
        db.createObjectStore('pending-routes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-reports')) {
        db.createObjectStore('pending-reports', { keyPath: 'id' });
      }
    };
  });
}

// Save route to offline storage
export async function saveRouteOffline(route: PendingRoute): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-routes'], 'readwrite');
    const store = transaction.objectStore('pending-routes');
    const request = store.add(route);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Save report to offline storage
export async function saveReportOffline(report: PendingReport): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-reports'], 'readwrite');
    const store = transaction.objectStore('pending-reports');
    const request = store.add(report);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Get pending routes
export async function getPendingRoutes(): Promise<PendingRoute[]> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-routes'], 'readonly');
    const store = transaction.objectStore('pending-routes');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Get pending reports
export async function getPendingReports(): Promise<PendingReport[]> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-reports'], 'readonly');
    const store = transaction.objectStore('pending-reports');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Delete pending route
export async function deletePendingRoute(routeId: string): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-routes'], 'readwrite');
    const store = transaction.objectStore('pending-routes');
    const request = store.delete(routeId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Delete pending report
export async function deletePendingReport(reportId: string): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-reports'], 'readwrite');
    const store = transaction.objectStore('pending-reports');
    const request = store.delete(reportId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Sync offline data
export async function syncOfflineData(registration: ServiceWorkerRegistration): Promise<void> {
  if (!('sync' in registration)) {
    console.warn('Background Sync not supported');
    return;
  }

  try {
    const pendingRoutes = await getPendingRoutes();
    const pendingReports = await getPendingReports();

    if (pendingRoutes.length > 0) {
      await (registration.sync as any).register('sync-routes');
    }
    if (pendingReports.length > 0) {
      await (registration.sync as any).register('sync-reports');
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen for online/offline events
export function setupOfflineListener(onStatusChange: (isOnline: boolean) => void): () => void {
  const handleOnline = () => onStatusChange(true);
  const handleOffline = () => onStatusChange(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
