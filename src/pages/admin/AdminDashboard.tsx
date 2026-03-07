import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useData, RequestStatus } from '@/contexts/DataContext';
import { Sparkles, Wrench, Calendar, MapPin, Clock, CheckCircle, Settings, Users, Megaphone, ImageIcon, ExternalLink, Filter } from 'lucide-react';
import { normalizeHostelDisplay } from '@/lib/hostelUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { BlockedSlotsManager } from '@/components/admin/BlockedSlotsManager';
import { AdminAnnouncementManager } from '@/components/admin/AdminAnnouncementManager';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('cleaning');
  const [hostelFilter, setHostelFilter] = useState<string>('all');
  const {
    cleaningRequests,
    applianceComplaints,
    updateCleaningRequestStatus,
    updateApplianceComplaintStatus,
    isLoading,
  } = useData();

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
    } catch {
      return dateString;
    }
  };

  const handleCleaningStatusUpdate = async (id: string, status: RequestStatus) => {
    try {
      await updateCleaningRequestStatus(id, status);
      toast.success(`Request marked as ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleApplianceStatusUpdate = async (id: string, status: RequestStatus) => {
    try {
      await updateApplianceComplaintStatus(id, status);
      toast.success(`Complaint marked as ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const pendingCleaning = cleaningRequests.filter((r) => r.status === 'pending').length;
  const pendingAppliance = applianceComplaints.filter((c) => c.status === 'pending').length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Administration Dashboard</h1>
          <p className="page-subtitle">Manage cleaning and maintenance requests</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{cleaningRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Total Cleaning</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCleaning}</p>
                  <p className="text-xs text-muted-foreground">Pending Cleaning</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{applianceComplaints.length}</p>
                  <p className="text-xs text-muted-foreground">Total Complaints</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingAppliance}</p>
                  <p className="text-xs text-muted-foreground">Pending Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="cleaning"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Cleaning Requests</span>
              <span className="sm:hidden">Cleaning</span>
            </TabsTrigger>
            <TabsTrigger
              value="appliance"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Appliance Issues</span>
              <span className="sm:hidden">Appliance</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Slot Settings</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Announcements</span>
              <span className="sm:hidden">Announce</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cleaning" className="animate-slide-up">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Room Cleaning Requests</CardTitle>
                    <CardDescription>Manage and update cleaning request status</CardDescription>
                  </div>
                  <Select value={hostelFilter} onValueChange={setHostelFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by hostel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Hostels</SelectItem>
                      <SelectItem value="Hostel B1">Hostel B1</SelectItem>
                      <SelectItem value="Hostel B2">Hostel B2</SelectItem>
                      <SelectItem value="Hostel G1">Hostel G1</SelectItem>
                      <SelectItem value="Hostel G2">Hostel G2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const filtered = hostelFilter === 'all'
                    ? cleaningRequests
                    : cleaningRequests.filter(r => normalizeHostelDisplay(r.hostelBlock) === hostelFilter);
                  return filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    {hostelFilter === 'all' ? 'No cleaning requests' : `No cleaning requests for ${hostelFilter}`}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filtered.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{request.studentName}</span>
                              <StatusBadge status={request.status} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{normalizeHostelDisplay(request.hostelBlock)}, Room {request.roomNumber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{request.preferredDate}</span>
                              </div>
                            </div>
                            {request.expectedArrivalStart && request.expectedArrivalEnd ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-md w-fit">
                                  <Clock className="w-4 h-4" />
                                  <span className="font-medium">Expected Arrival: {request.expectedArrivalStart} – {request.expectedArrivalEnd}</span>
                                </div>
                                {(() => {
                                  const queuePos = cleaningRequests.filter(
                                    (r) =>
                                      r.id !== request.id &&
                                      r.preferredDate === request.preferredDate &&
                                      (r.status === 'pending' || r.status === 'in-progress') &&
                                      r.createdAt < request.createdAt
                                  ).length;
                                  return queuePos > 0 ? (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                      <Users className="w-3 h-3" />
                                      <span>Queue #{queuePos + 1}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                      <Users className="w-3 h-3" />
                                      <span>Queue #1</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-md w-fit">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">Time Slot: {request.preferredTime}</span>
                              </div>
                            )}
                            {request.availabilityStart && request.availabilityEnd && (
                              <p className="text-xs text-muted-foreground">
                                Student available: {request.availabilityStart} – {request.availabilityEnd}
                              </p>
                            )}
                            {request.notes && (
                              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                {request.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Submitted: {formatDate(request.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {request.status !== 'in-progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCleaningStatusUpdate(request.id, 'in-progress')}
                              >
                                Mark In Progress
                              </Button>
                            )}
                            {request.status !== 'completed' && (
                              <Button
                                size="sm"
                                onClick={() => handleCleaningStatusUpdate(request.id, 'completed')}
                              >
                                Mark Completed
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appliance" className="animate-slide-up">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Appliance Complaints</CardTitle>
                <CardDescription>Manage and update appliance issue status</CardDescription>
              </CardHeader>
              <CardContent>
                {applianceComplaints.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No appliance complaints</p>
                ) : (
                  <div className="space-y-4">
                    {applianceComplaints.map((complaint) => (
                      <div
                        key={complaint.id}
                        className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{complaint.appliance}</span>
                              <StatusBadge status={complaint.status} />
                            </div>
                            <p className="font-medium text-sm">{complaint.studentName}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{normalizeHostelDisplay(complaint.hostelBlock)}, Room {complaint.roomNumber}</span>
                            </div>
                            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                              {complaint.description}
                            </p>
                            {complaint.imageUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-fit"
                                onClick={async () => {
                                  try {
                                    if (complaint.imageUrl!.startsWith('http')) {
                                      window.open(complaint.imageUrl!, '_blank');
                                      return;
                                    }
                                    const { data, error } = await supabase.storage
                                      .from('appliance-images')
                                      .createSignedUrl(complaint.imageUrl!, 300);
                                    if (error) throw error;
                                    window.open(data.signedUrl, '_blank');
                                  } catch {
                                    toast.error('Unable to open image');
                                  }
                                }}
                              >
                                <ImageIcon className="w-4 h-4" />
                                View Image
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Submitted: {formatDate(complaint.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {complaint.status !== 'in-progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApplianceStatusUpdate(complaint.id, 'in-progress')}
                              >
                                Mark In Progress
                              </Button>
                            )}
                            {complaint.status !== 'completed' && (
                              <Button
                                size="sm"
                                onClick={() => handleApplianceStatusUpdate(complaint.id, 'completed')}
                              >
                                Mark Completed
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="animate-slide-up">
            <BlockedSlotsManager />
          </TabsContent>

          <TabsContent value="announcements" className="animate-slide-up">
            <AdminAnnouncementManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
