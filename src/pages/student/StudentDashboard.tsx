import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Wrench, ShoppingBag, ClipboardList } from 'lucide-react';
import { CleaningRequestForm } from './CleaningRequestForm';
import { ApplianceComplaintForm } from './ApplianceComplaintForm';
import { StoreOrderForm } from './StoreOrderForm';
import { MyRequests } from './MyRequests';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('cleaning');

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Student Dashboard</h1>
          <p className="page-subtitle">Manage your hostel services and requests</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="cleaning"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Room Cleaning</span>
              <span className="sm:hidden">Cleaning</span>
            </TabsTrigger>
            <TabsTrigger
              value="appliance"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Appliance Issue</span>
              <span className="sm:hidden">Appliance</span>
            </TabsTrigger>
            <TabsTrigger
              value="store"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Store Orders</span>
              <span className="sm:hidden">Store</span>
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">My Requests</span>
              <span className="sm:hidden">Requests</span>
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

          <TabsContent value="requests" className="animate-slide-up">
            <MyRequests />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
