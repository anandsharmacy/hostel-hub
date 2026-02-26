import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, PackageCheck, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface LaundryOrder {
  id: string;
  student_name: string;
  sap_id: string;
  hostel_block: string;
  contact_number: string;
  cleaning_type: string;
  status: string;
  total_amount: number;
  checked_in_at: string;
  checked_out_at: string | null;
}

const CLEANING_LABELS: Record<string, string> = {
  wash_only: 'Wash Only',
  iron_only: 'Iron Only',
  wash_and_iron: 'Wash & Iron',
  dry_clean: 'Dry Clean',
};

export function LaundryCheckOutForm() {
  const [searchType, setSearchType] = useState<'sap_id' | 'name' | 'date'>('sap_id');
  const [searchValue, setSearchValue] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      let query = supabase
        .from('laundry_orders')
        .select('*')
        .eq('status', 'checked_in') as any;

      if (searchType === 'sap_id' && searchValue.trim()) {
        query = query.ilike('sap_id', `%${searchValue.trim()}%`);
      } else if (searchType === 'name' && searchValue.trim()) {
        query = query.ilike('student_name', `%${searchValue.trim()}%`);
      } else if (searchType === 'date' && dateFrom && dateTo) {
        query = query.gte('checked_in_at', dateFrom).lte('checked_in_at', dateTo + 'T23:59:59');
      } else {
        toast.error('Please enter search criteria');
        setIsSearching(false);
        return;
      }

      const { data, error } = await query.order('checked_in_at', { ascending: false });
      if (error) throw error;
      setOrders((data || []) as LaundryOrder[]);
      if (!data?.length) toast.info('No checked-in orders found');
    } catch (error: any) {
      toast.error(error.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckOut = async (orderId: string) => {
    setCheckingOut(orderId);
    try {
      const { error } = await supabase
        .from('laundry_orders')
        .update({ status: 'checked_out', checked_out_at: new Date().toISOString() } as any)
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Order checked out!');
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (error: any) {
      toast.error(error.message || 'Check-out failed');
    } finally {
      setCheckingOut(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="w-5 h-5" />
          Clothes Check-Out
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search controls */}
        <div className="flex flex-wrap gap-2">
          {(['sap_id', 'name', 'date'] as const).map(type => (
            <Button
              key={type}
              variant={searchType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType(type)}
            >
              {type === 'sap_id' ? 'SAP ID' : type === 'name' ? 'Name' : 'Date Range'}
            </Button>
          ))}
        </div>

        <div className="flex gap-3 items-end">
          {searchType !== 'date' ? (
            <div className="flex-1 space-y-2">
              <Label>{searchType === 'sap_id' ? 'SAP ID' : 'Student Name'}</Label>
              <Input
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder={`Search by ${searchType === 'sap_id' ? 'SAP ID' : 'name'}...`}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2">
                <Label>From</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="flex-1 space-y-2">
                <Label>To</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </>
          )}
          <Button onClick={handleSearch} disabled={isSearching} className="gap-1">
            <Search className="w-4 h-4" />
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Results */}
        {orders.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{orders.length} order(s) found</h3>
            {orders.map(order => (
              <div key={order.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{order.student_name}</span>
                    <Badge variant="secondary">{order.sap_id}</Badge>
                  </div>
                  <Badge>{CLEANING_LABELS[order.cleaning_type] || order.cleaning_type}</Badge>
                </div>
                <div className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
                  <span>Block: {order.hostel_block}</span>
                  <span>Contact: {order.contact_number}</span>
                  <span>Amount: ₹{order.total_amount}</span>
                  <span>Checked in: {format(new Date(order.checked_in_at), 'dd MMM yyyy, hh:mm a')}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleCheckOut(order.id)}
                  disabled={checkingOut === order.id}
                  className="mt-2"
                >
                  {checkingOut === order.id ? 'Checking Out...' : 'Check Out'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
