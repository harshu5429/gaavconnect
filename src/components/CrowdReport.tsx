import { useState, useEffect } from 'react';
import { MessageSquare, Send, MapPin, AlertCircle, ThumbsUp, Clock, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createCrowdReport, getCrowdReports as fetchCrowdReports, upvoteCrowdReport } from '../utils/supabase';
import { VILLAGES } from '../utils/villages';

export function CrowdReport() {
  const { user } = useAuth();
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [crowdCount, setCrowdCount] = useState('');
  const [description, setDescription] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadReports();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  };

  const loadReports = async () => {
    try {
      setIsLoading(true);
      // For now, fetch all reports - in production use user's location
      if (userLocation) {
        const crowdReports = await fetchCrowdReports(userLocation.lat, userLocation.lng, 50);
        setReports(crowdReports);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load crowd reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || !description || !user?.id) {
      toast.error('Please fill in all required fields and ensure you are logged in');
      return;
    }

    const selectedVillage = VILLAGES.find(v => v.name === location);
    if (!selectedVillage) {
      toast.error('Please select a valid location from suggestions');
      return;
    }

    setIsSubmitting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4); // Reports expire after 4 hours

      await createCrowdReport({
        user_id: user.id,
        location_name: location,
        latitude: selectedVillage.lat,
        longitude: selectedVillage.lng,
        severity,
        crowd_count: crowdCount ? parseInt(crowdCount) : undefined,
        description,
        expires_at: expiresAt.toISOString(),
      });

      toast.success('Report submitted successfully!');
      setLocation('');
      setSeverity('medium');
      setCrowdCount('');
      setDescription('');
      
      // Reload reports
      await loadReports();
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (reportId: string) => {
    try {
      await upvoteCrowdReport(reportId);
      toast.success('Upvoted!');
      await loadReports();
    } catch (error) {
      console.error('Failed to upvote:', error);
      toast.error('Failed to upvote report');
    }
  };

  const locationSuggestions = VILLAGES.map(v => v.name);

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h2 className="text-[#6A0DAD] mb-2">Report Crowd Conditions</h2>
        <p className="text-gray-600">Help your community by reporting real-time crowd data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Form */}
        <div className="lg:col-span-1">
          <Card className="p-6 border-[#E6E6FA] shadow-md sticky top-6">
            <h3 className="text-lg font-bold text-[#6A0DAD] mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              New Report
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location */}
              <div>
                <Label className="text-[#6A0DAD] font-semibold mb-2 block">Location *</Label>
                <Input
                  type="text"
                  value={location}
                  onChange={(e: any) => setLocation(e.target.value)}
                  placeholder="Search location..."
                  list="village-list"
                  className="border-[#CBA0F5]"
                />
                <datalist id="village-list">
                  {locationSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              {/* Severity */}
              <div>
                <Label className="text-[#6A0DAD] font-semibold mb-2 block">Severity Level *</Label>
                <Select value={severity} onValueChange={(value: any) => setSeverity(value)}>
                  <SelectTrigger className="border-[#CBA0F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Light crowd</SelectItem>
                    <SelectItem value="medium">Medium - Moderate crowd</SelectItem>
                    <SelectItem value="high">High - Heavy crowd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Crowd Count */}
              <div>
                <Label className="text-[#6A0DAD] font-semibold mb-2 block">Estimated Count</Label>
                <Input
                  type="number"
                  value={crowdCount}
                  onChange={(e: any) => setCrowdCount(e.target.value)}
                  placeholder="Number of people"
                  className="border-[#CBA0F5]"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-[#6A0DAD] font-semibold mb-2 block">Description *</Label>
                <Textarea
                  value={description}
                  onChange={(e: any) => setDescription(e.target.value)}
                  placeholder="Describe the crowd situation..."
                  className="border-[#CBA0F5] text-sm"
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#6A0DAD] to-[#8B2DC2] text-white hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Recent Reports */}
        <div className="lg:col-span-2">
          <Card className="p-6 border-[#E6E6FA] shadow-md">
            <h3 className="text-lg font-bold text-[#6A0DAD] mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Recent Reports ({reports.length})
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-[#CBA0F5] border-t-[#6A0DAD] rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent reports in your area</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {reports.map((report: any) => (
                  <Card key={report.id} className="p-4 border-l-4 border-[#6A0DAD] bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-[#6A0DAD]" />
                          <p className="font-semibold text-gray-800">{report.location_name}</p>
                          <Badge className={getSeverityColor(report.severity)}>
                            {report.severity?.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{report.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        {report.crowd_count && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {report.crowd_count} people
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(report.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUpvote(report.id)}
                        className="flex items-center gap-1 text-[#6A0DAD] hover:font-semibold transition-all"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {report.upvotes || 0}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
