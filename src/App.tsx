import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './components/Home';
import { RouteResult } from './components/RouteResult';
import { CrowdReport } from './components/CrowdReport';
import { AdminDashboard } from './components/AdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Settings } from './components/Settings';
import { Navigation } from './components/Navigation';
import { HelpGuide } from './components/HelpGuide';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

type View = 'home' | 'route-result' | 'crowd-report' | 'admin' | 'settings' | 'help';

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface RouteSegment {
  mode: 'walk' | 'bus' | 'auto' | 'bike';
  from: string;
  to: string;
  distance: string;
  duration: string;
  cost: number;
  reliability: number;
}

export interface OptimizedRoute {
  stops: Stop[];
  segments: RouteSegment[];
  totalCost: number;
  totalDuration: string;
  totalDistance: string;
  algorithm: 'tsp-genetic' | 'tsp-aco' | 'greedy' | 'nearest-neighbor';
}

export interface RouteOptions {
  routes: OptimizedRoute[];
  selectedRouteIndex: number;
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#CBA0F5] border-t-[#6A0DAD] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

// Main app content (with navigation)
function AppContent() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [allRoutes, setAllRoutes] = useState<OptimizedRoute[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isDOMReady, setIsDOMReady] = useState(false);

  // Ensure DOM is fully ready before rendering components that might use IntersectionObserver
  useEffect(() => {
    const checkDOMReady = () => {
      if (document.readyState === 'complete' && document.body) {
        setIsDOMReady(true);
      } else {
        // Wait a bit more and check again
        setTimeout(checkDOMReady, 100);
      }
    };
    
    checkDOMReady();
  }, []);

  const handleRouteGenerated = (route: OptimizedRoute, allRoutes?: OptimizedRoute[]) => {
    setOptimizedRoute(route);
    if (allRoutes) {
      setAllRoutes(allRoutes);
    }
    setCurrentView('route-result');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  // Don't render until DOM is ready
  if (!isDOMReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6E6FA] via-white to-[#F5F3FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#CBA0F5] border-t-[#6A0DAD] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6E6FA] via-white to-[#F5F3FF]">
      <Navigation 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isOfflineMode={isOfflineMode}
      />
      
      <main className="pb-16">
        {currentView === 'home' && (
          <Home onRouteGenerated={handleRouteGenerated} />
        )}
        
        {currentView === 'route-result' && optimizedRoute && (
          <RouteResult 
            route={optimizedRoute} 
            allRoutes={allRoutes}
            onBack={handleBackToHome}
          />
        )}
        
        {currentView === 'crowd-report' && (
          <CrowdReport />
        )}
        
        {currentView === 'admin' && (
          <AdminDashboard />
        )}
        
        {currentView === 'settings' && (
          <Settings 
            isOfflineMode={isOfflineMode}
            setIsOfflineMode={setIsOfflineMode}
          />
        )}
        
        {currentView === 'help' && (
          <HelpGuide />
        )}
      </main>
      
      {/* Only render Toaster after DOM is ready and in a safe way */}
      {isDOMReady && (
        <div id="toast-container">
          <Toaster />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
