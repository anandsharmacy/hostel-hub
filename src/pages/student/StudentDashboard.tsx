import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Wrench, ShoppingBag, ClipboardList, Pill, Bell, Scissors, Lightbulb } from 'lucide-react';
import { CleaningRequestForm } from './CleaningRequestForm';
import { ApplianceComplaintForm } from './ApplianceComplaintForm';
import { StoreOrderForm } from './StoreOrderForm';
import { MedicineRequestForm } from './MedicineRequestForm';
import { MyRequests } from './MyRequests';
import { AnnouncementsBanner } from '@/components/student/AnnouncementsBanner';
import { NotificationsSection } from '@/components/shared/NotificationsSection';
import { SalonQueueView } from '@/components/student/SalonQueueView';
import { RoomControlsPanel } from '@/components/student/RoomControlsPanel';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('cleaning');

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Student Dashboard</h1>
          <p className="page-subtitle">Manage your hostel services and requests</p>
        </div>

        <AnnouncementsBanner />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-8 h-auto gap-2 bg-transparent p-0 border-0 shadow-none backdrop-blur-0">
            <TabsTrigger
              value="cleaning"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_14px_28px_-22px_hsl(var(--nmims-maroon)/0.7)] flex items-center gap-2 py-3 px-4 rounded-2xl border border-white/60 bg-background/62 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Room Cleaning</span>
              <span className="sm:hidden">Cleaning</span>
            </TabsTrigger>
            <TabsTrigger
              value="appliance"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_14px_28px_-22px_hsl(var(--nmims-maroon)/0.7)] flex items-center gap-2 py-3 px-4 rounded-2xl border border-white/60 bg-background/62 backdrop-blur-md"
            >
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Appliance Issue</span>
              <span className="sm:hidden">Appliance</span>
            </TabsTrigger>
            <TabsTrigger
              value="store"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_14px_28px_-22px_hsl(var(--nmims-maroon)/0.7)] flex items-center gap-2 py-3 px-4 rounded-2xl border border-white/60 bg-background/62 backdrop-blur-md"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Store Orders</span>
              <span className="sm:hidden">Store</span>
            </TabsTrigger>
            <TabsTrigger
              value="medicine"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_14px_28px_-22px_hsl(var(--nmims-maroon)/0.7)] flex items-center gap-2 py-3 px-4 rounded-2xl border border-white/60 bg-background/62 backdrop-blur-md"
            >
              <Pill className="w-4 h-4" />
              <span className="hidden sm:inline">Medicine</span>
              <span className="sm:hidden">Medicine</span>
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_14px_28px_-22px_hsl(var(--nmims-maroon)/0.7)] flex items-center gap-2 py-3 px-4 rounded-2xl border border-white/60 bg-background/62 backdrop-blur-md"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">My Requests</span>
              <span className="sm:hidden">Requests</span>
            </TabsTrigger>
            <TabsTrigger
              value="room-controls"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_14px_28px_-22px_hsl(var(--nmims-maroon)/0.7)] flex items-center gap-2 py-3 px-4 rounded-2xl border border-white/60 bg-background/62 backdrop-blur-md"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Room Controls</span>
              <span className="sm:hidden">Controls</span>
            </TabsTrigger>
            <TabsTrigger
              value="salon"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_14px_28px_-22px_hsl(var(--nmims-maroon)/0.7)] flex items-center gap-2 py-3 px-4 rounded-2xl border border-white/60 bg-background/62 backdrop-blur-md"
            >
              <Scissors className="w-4 h-4" />
              <span className="hidden sm:inline">Salon</span>
              <span className="sm:hidden">Salon</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_14px_28px_-22px_hsl(var(--nmims-maroon)/0.7)] flex items-center gap-2 py-3 px-4 rounded-2xl border border-white/60 bg-background/62 backdrop-blur-md"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cleaning" className="animate-slide-up">
            <CleaningRequestForm />
          </TabsContent>

          <TabsContent value="appliance" className="animate-slide-up">
            <ApplianceComplaintForm />
          </TabsContent>

          <TabsContent value="store" className="animate-slide-up">
            <StoreOrderForm />
          </TabsContent>

          <TabsContent value="medicine" className="animate-slide-up">
            <MedicineRequestForm />
          </TabsContent>

          <TabsContent value="requests" className="animate-slide-up">
            <MyRequests />
          </TabsContent>

          <TabsContent value="room-controls" className="animate-slide-up">
            <RoomControlsPanel />
          </TabsContent>

          <TabsContent value="salon" className="animate-slide-up">
            <SalonQueueView />
          </TabsContent>

          <TabsContent value="notifications" className="animate-slide-up">
            <NotificationsSection role="students" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
