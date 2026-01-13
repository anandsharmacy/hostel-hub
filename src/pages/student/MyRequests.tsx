import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Sparkles, Wrench, ShoppingBag, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export function MyRequests() {
  const { user } = useAuth();
  const { cleaningRequests, applianceComplaints, storeOrders } = useData();

  // Filter requests by current user (in a real app, this would be done server-side)
  const myCleaningRequests = cleaningRequests.filter(
    (r) => r.studentName === user?.name || r.roomNumber === user?.roomNumber
  );
  const myApplianceComplaints = applianceComplaints.filter(
    (c) => c.studentName === user?.name || c.roomNumber === user?.roomNumber
  );
  const myStoreOrders = storeOrders.filter(
    (o) => o.studentName === user?.name || o.roomNumber === user?.roomNumber
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cleaning Requests */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Cleaning Requests</CardTitle>
              <CardDescription>{myCleaningRequests.length} request(s)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {myCleaningRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No cleaning requests yet</p>
          ) : (
            <div className="space-y-3">
              {myCleaningRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{request.hostelBlock}, Room {request.roomNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{request.preferredDate} at {request.preferredTime}</span>
                    </div>
                    {request.notes && (
                      <p className="text-sm text-muted-foreground">{request.notes}</p>
                    )}
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appliance Complaints */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle>Appliance Complaints</CardTitle>
              <CardDescription>{myApplianceComplaints.length} complaint(s)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {myApplianceComplaints.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No appliance complaints yet</p>
          ) : (
            <div className="space-y-3">
              {myApplianceComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{complaint.appliance}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{complaint.hostelBlock}, Room {complaint.roomNumber}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{complaint.description}</p>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store Orders */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-success" />
            </div>
            <div>
              <CardTitle>Store Orders</CardTitle>
              <CardDescription>{myStoreOrders.length} order(s)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {myStoreOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No store orders yet</p>
          ) : (
            <div className="space-y-3">
              {myStoreOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{order.category}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{order.hostelBlock}, Room {order.roomNumber}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.items.map((item) => `${item.name} (×${item.quantity})`).join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ordered: {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
