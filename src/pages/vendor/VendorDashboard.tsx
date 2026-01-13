import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { useData, RequestStatus } from '@/contexts/DataContext';
import { ShoppingBag, Package, Clock, CheckCircle, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function VendorDashboard() {
  const { storeOrders, updateStoreOrderStatus, isLoading } = useData();

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
    } catch {
      return dateString;
    }
  };

  const handleStatusUpdate = async (id: string, status: RequestStatus) => {
    try {
      await updateStoreOrderStatus(id, status);
      toast.success(`Order marked as ${status === 'completed' ? 'delivered' : status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const pendingOrders = storeOrders.filter((o) => o.status === 'pending').length;
  const inProgressOrders = storeOrders.filter((o) => o.status === 'in-progress').length;
  const completedOrders = storeOrders.filter((o) => o.status === 'completed').length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                  <p className="text-2xl font-bold">{pendingOrders}</p>
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
                  <p className="text-2xl font-bold">{inProgressOrders}</p>
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
                  <p className="text-2xl font-bold">{completedOrders}</p>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Student Orders</CardTitle>
            <CardDescription>Manage and deliver student orders</CardDescription>
          </CardHeader>
          <CardContent>
            {storeOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {storeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
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

                        {/* Order Items */}
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
                            onClick={() => handleStatusUpdate(order.id, 'in-progress')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status !== 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'completed')}
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
      </div>
    </DashboardLayout>
  );
}
