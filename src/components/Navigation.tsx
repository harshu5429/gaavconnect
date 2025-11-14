import { Map, TrendingUp, Settings as SettingsIcon, Wifi, WifiOff, HelpCircle } from 'lucide-react';

type View = 'home' | 'route-result' | 'admin' | 'settings' | 'help';

interface NavigationProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOfflineMode: boolean;
}

export function Navigation({ currentView, setCurrentView, isOfflineMode }: NavigationProps) {
  return (
    <>
      {/* Top Header */}
      <header className="bg-[#6A0DAD] text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Map className="w-6 h-6 text-[#6A0DAD]" />
              </div>
              <div>
                <h1 className="text-xl">GaavConnect</h1>
                <p className="text-xs text-[#E6E6FA]">Empowering rural journeys</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isOfflineMode ? (
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs">Offline</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs">Online</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E6E6FA] z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button
              onClick={() => setCurrentView('home')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'home' || currentView === 'route-result'
                  ? 'text-[#6A0DAD] bg-[#E6E6FA]'
                  : 'text-gray-500'
              }`}
            >
              <Map className="w-5 h-5" />
              <span className="text-xs">Routes</span>
            </button>
            
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'admin'
                  ? 'text-[#6A0DAD] bg-[#E6E6FA]'
                  : 'text-gray-500'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Analytics</span>
            </button>
            
            <button
              onClick={() => setCurrentView('help')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'help'
                  ? 'text-[#6A0DAD] bg-[#E6E6FA]'
                  : 'text-gray-500'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-xs">Help</span>
            </button>
            
            <button
              onClick={() => setCurrentView('settings')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'settings'
                  ? 'text-[#6A0DAD] bg-[#E6E6FA]'
                  : 'text-gray-500'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
