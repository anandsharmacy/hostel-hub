import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, ArrowUpFromLine, IndianRupee } from 'lucide-react';
import { LaundryCheckInForm } from '@/pages/student/LaundryCheckInForm';
import { LaundryCheckOutForm } from '@/pages/student/LaundryCheckOutForm';
import { LaundryRevenueTracker } from '@/components/student/LaundryRevenueTracker';

export default function LaundryDashboard() {
  const [activeTab, setActiveTab] = useState('checkin');

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Laundry Management</h1>
          <p className="page-subtitle">Manage clothes check-in, check-out, and revenue</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 h-auto gap-2 bg-transparent p-0 max-w-lg">
            <TabsTrigger
              value="checkin"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Check-In
            </TabsTrigger>
            <TabsTrigger
              value="checkout"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              Check-Out
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4 rounded-lg border border-border bg-card"
            >
              <IndianRupee className="w-4 h-4" />
              Revenue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="animate-slide-up">
            <LaundryCheckInForm />
          </TabsContent>

          <TabsContent value="checkout" className="animate-slide-up">
            <LaundryCheckOutForm />
          </TabsContent>

          <TabsContent value="revenue" className="animate-slide-up">
            <LaundryRevenueTracker />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
