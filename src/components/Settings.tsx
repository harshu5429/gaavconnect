import { Download, Globe, Bell, Shield, Database } from 'lucide-react';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface SettingsProps {
  isOfflineMode: boolean;
  setIsOfflineMode: (value: boolean) => void;
}

export function Settings({ isOfflineMode, setIsOfflineMode }: SettingsProps) {
  const handleSync = () => {
    toast.success('Syncing offline data... This may take a few minutes.');
  };

  const handleClearCache = () => {
    toast.success('Cache cleared successfully');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[#6A0DAD] mb-2">Settings</h2>
        <p className="text-gray-600">Customize your GaavConnect experience</p>
      </div>

      {/* Offline Sync */}
      <Card className="p-6 mb-6 border-[#E6E6FA]">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-[#6A0DAD] rounded-full flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[#6A0DAD] mb-1">Offline Data Sync</h3>
            <p className="text-sm text-gray-600 mb-4">
              Download map data and transport schedules for offline use
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="region" className="text-gray-700 mb-2 block">
                  Select Region
                </Label>
                <Select defaultValue="telangana">
                  <SelectTrigger id="region" className="border-[#CBA0F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telangana">Telangana Rural Districts</SelectItem>
                    <SelectItem value="andhra">Andhra Pradesh Rural</SelectItem>
                    <SelectItem value="karnataka">Karnataka Rural</SelectItem>
                    <SelectItem value="maharashtra">Maharashtra Rural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-[#F5F3FF] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Download Size</span>
                  <span className="text-sm text-[#6A0DAD]">78 MB / 95 MB</span>
                </div>
                <Progress value={82} className="h-2 mb-2" />
                <div className="text-xs text-gray-500">Last synced: 2 days ago</div>
              </div>

              <Button
                onClick={handleSync}
                className="w-full bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Sync Offline Data
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Language Settings */}
      <Card className="p-6 mb-6 border-[#E6E6FA]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#CBA0F5] rounded-full flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[#6A0DAD] mb-1">Language & Voice</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose your preferred language for navigation and interface
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="language" className="text-gray-700 mb-2 block">
                  Interface Language
                </Label>
                <Select defaultValue="english">
                  <SelectTrigger id="language" className="border-[#CBA0F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="telugu">తెలుగు (Telugu)</SelectItem>
                    <SelectItem value="kannada">ಕನ್ನಡ (Kannada)</SelectItem>
                    <SelectItem value="marathi">मराठी (Marathi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voice" className="text-gray-700 mb-2 block">
                  Voice Navigation
                </Label>
                <Select defaultValue="female-english">
                  <SelectTrigger id="voice" className="border-[#CBA0F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female-english">Female (English)</SelectItem>
                    <SelectItem value="male-english">Male (English)</SelectItem>
                    <SelectItem value="female-hindi">Female (Hindi)</SelectItem>
                    <SelectItem value="male-hindi">Male (Hindi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6 mb-6 border-[#E6E6FA]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#B57EDC] rounded-full flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[#6A0DAD] mb-1">Notifications</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage your notification preferences
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-gray-700">Route Updates</div>
                  <div className="text-xs text-gray-500">Get notified about route changes</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-gray-700">Transport Alerts</div>
                  <div className="text-xs text-gray-500">Delays and cancellations</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-gray-700">Community Reports</div>
                  <div className="text-xs text-gray-500">New crowd-sourced information</div>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy & Data */}
      <Card className="p-6 mb-6 border-[#E6E6FA]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#8B2DC2] rounded-full flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[#6A0DAD] mb-1">Privacy & Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              Control your data and privacy settings
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-gray-700">Location Tracking</div>
                  <div className="text-xs text-gray-500">Improve route accuracy</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-gray-700">Anonymous Analytics</div>
                  <div className="text-xs text-gray-500">Help improve the platform</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-gray-700">Offline Mode</div>
                  <div className="text-xs text-gray-500">Use cached data only</div>
                </div>
                <Switch 
                  checked={isOfflineMode} 
                  onCheckedChange={setIsOfflineMode}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Storage & Cache */}
      <Card className="p-6 mb-6 border-[#E6E6FA]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#6A0DAD] rounded-full flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[#6A0DAD] mb-1">Storage & Cache</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage local data storage
            </p>

            <div className="bg-[#F5F3FF] p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Map Data</div>
                  <div className="text-[#6A0DAD]">78 MB</div>
                </div>
                <div>
                  <div className="text-gray-600">Route Cache</div>
                  <div className="text-[#6A0DAD]">12 MB</div>
                </div>
                <div>
                  <div className="text-gray-600">Transport Data</div>
                  <div className="text-[#6A0DAD]">5 MB</div>
                </div>
                <div>
                  <div className="text-gray-600">Total Storage</div>
                  <div className="text-[#6A0DAD]">95 MB</div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleClearCache}
              variant="outline"
              className="w-full border-[#CBA0F5] text-[#6A0DAD] hover:bg-[#E6E6FA]"
            >
              Clear Cache
            </Button>
          </div>
        </div>
      </Card>

      {/* App Info */}
      <Card className="p-6 border-[#CBA0F5] bg-gradient-to-r from-[#E6E6FA] to-white">
        <div className="text-center">
          <div className="text-[#6A0DAD] mb-1">GaavConnect v1.0</div>
          <p className="text-sm text-gray-600">
            Empowering rural journeys through intelligent, multi-modal route optimization
          </p>
          <p className="text-xs text-gray-500 mt-2">
            © 2025 GaavConnect. Made with ❤️ for rural India
          </p>
        </div>
      </Card>
    </div>
  );
}
