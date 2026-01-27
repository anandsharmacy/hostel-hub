import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData, RequestStatus } from '@/contexts/DataContext';
import { ShoppingBag, Package, Clock, CheckCircle, MapPin, Receipt, Search, X, Pill, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function VendorDashboard() {
  const { storeOrders, medicineRequests, updateStoreOrderStatus, updateMedicineRequestStatus, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('store');

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
    } catch {
      return dateString;
    }
  };

  const handleStoreStatusUpdate = async (id: string, status: RequestStatus) => {
    try {
      await updateStoreOrderStatus(id, status);
      toast.success(`Order marked as ${status === 'completed' ? 'delivered' : status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleMedicineStatusUpdate = async (id: string, status: RequestStatus) => {
    try {
      await updateMedicineRequestStatus(id, status);
      toast.success(`Request marked as ${status === 'completed' ? 'delivered' : status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Store orders stats
  const pendingStoreOrders = storeOrders.filter((o) => o.status === 'pending').length;
  const inProgressStoreOrders = storeOrders.filter((o) => o.status === 'in-progress').length;
  const completedStoreOrders = storeOrders.filter((o) => o.status === 'completed').length;

  // Medicine requests stats
  const pendingMedicineRequests = medicineRequests.filter((r) => r.status === 'pending').length;
  const inProgressMedicineRequests = medicineRequests.filter((r) => r.status === 'in-progress').length;
  const completedMedicineRequests = medicineRequests.filter((r) => r.status === 'completed').length;

  // Filter orders by search
  const filteredStoreOrders = storeOrders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      order.receiptNumber?.toLowerCase().includes(query) ||
      order.studentName.toLowerCase().includes(query) ||
      order.roomNumber.toLowerCase().includes(query)
    );
  });

  const filteredMedicineRequests = medicineRequests.filter((request) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      request.receiptNumber?.toLowerCase().includes(query) ||
      request.studentName.toLowerCase().includes(query) ||
      request.roomNumber.toLowerCase().includes(query) ||
      request.medicineName?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading orders..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Store Vendor Dashboard</h1>
          <p className="page-subtitle">Manage student orders and deliveries</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Store Orders
              {pendingStoreOrders > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-warning text-warning-foreground text-xs rounded-full">
                  {pendingStoreOrders}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="medicine" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Medicine
              {pendingMedicineRequests > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-warning text-warning-foreground text-xs rounded-full">
                  {pendingMedicineRequests}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Store Orders Tab */}
          <TabsContent value="store" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="card-elevated">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{storeOrders.length}</p>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
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
                      <p className="text-2xl font-bold">{pendingStoreOrders}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-elevated">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{inProgressStoreOrders}</p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
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
                      <p className="text-2xl font-bold">{completedStoreOrders}</p>
                      <p className="text-xs text-muted-foreground">Delivered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders List */}
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Student Orders</CardTitle>
                    <CardDescription>Manage and deliver student orders</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by receipt #, name, room..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredStoreOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    {searchQuery ? `No orders found matching "${searchQuery}"` : 'No orders yet'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredStoreOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {order.receiptNumber && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-mono font-semibold flex items-center gap-1">
                                  <Receipt className="w-3 h-3" />
                                  {order.receiptNumber}
                                </span>
                              )}
                              <span className="font-semibold">{order.studentName}</span>
                              <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium">
                                {order.category}
                              </span>
                              <StatusBadge status={order.status} />
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{order.hostelBlock}, Room {order.roomNumber}</span>
                            </div>

                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Order Items:</p>
                              <div className="space-y-1">
                                {order.items.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span className="font-medium">×{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              Ordered: {formatDate(order.createdAt)}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStoreStatusUpdate(order.id, 'in-progress')}
                              >
                                Start Preparing
                              </Button>
                            )}
                            {order.status !== 'completed' && (
                              <Button
                                size="sm"
                                onClick={() => handleStoreStatusUpdate(order.id, 'completed')}
                              >
                                Mark Delivered
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

          {/* Medicine Requests Tab */}
          <TabsContent value="medicine" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="card-elevated">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
                      <Pill className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{medicineRequests.length}</p>
                      <p className="text-xs text-muted-foreground">Total Requests</p>
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
                      <p className="text-2xl font-bold">{pendingMedicineRequests}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-elevated">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{inProgressMedicineRequests}</p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
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
                      <p className="text-2xl font-bold">{completedMedicineRequests}</p>
                      <p className="text-xs text-muted-foreground">Delivered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Medicine Requests List */}
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Medicine Requests</CardTitle>
                    <CardDescription>View prescriptions and manage medicine deliveries</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by receipt #, name, medicine..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredMedicineRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    {searchQuery ? `No requests found matching "${searchQuery}"` : 'No medicine requests yet'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredMedicineRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {request.receiptNumber && (
                                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded text-xs font-mono font-semibold flex items-center gap-1">
                                  <Receipt className="w-3 h-3" />
                                  {request.receiptNumber}
                                </span>
                              )}
                              <span className="font-semibold">{request.studentName}</span>
                              <StatusBadge status={request.status} />
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{request.hostelBlock}, Room {request.roomNumber}</span>
                            </div>

                            {/* Medicine Details */}
                            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                              {request.medicineName && (
                                <div className="flex items-center gap-2">
                                  <Pill className="w-4 h-4 text-rose-500" />
                                  <span className="font-medium">{request.medicineName}</span>
                                </div>
                              )}
                              {request.prescriptionUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => window.open(request.prescriptionUrl!, '_blank')}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Prescription
                                  <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                              )}
                              {request.notes && (
                                <p className="text-sm text-muted-foreground">{request.notes}</p>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground">
                              Requested: {formatDate(request.createdAt)}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {request.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMedicineStatusUpdate(request.id, 'in-progress')}
                              >
                                Start Processing
                              </Button>
                            )}
                            {request.status !== 'completed' && (
                              <Button
                                size="sm"
                                onClick={() => handleMedicineStatusUpdate(request.id, 'completed')}
                              >
                                Mark Delivered
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
