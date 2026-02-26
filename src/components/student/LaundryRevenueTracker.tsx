import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, IndianRupee, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

const CLEANING_LABELS: Record<string, string> = {
  wash_only: 'Wash Only',
  iron_only: 'Iron Only',
  wash_and_iron: 'Wash & Iron',
  dry_clean: 'Dry Clean',
};

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  byType: { name: string; value: number }[];
}

export function LaundryRevenueTracker() {
  const { user } = useAuth();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPin();
  }, [user]);

  const checkPin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('laundry_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle() as any;
    setHasPin(!!data);
    setLoading(false);
  };

  const handleSetPin = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    setIsSettingPin(true);
    try {
      const { error } = await supabase
        .from('laundry_settings')
        .insert({ user_id: user!.id, revenue_pin: pin } as any);
      if (error) throw error;
      setHasPin(true);
      toast.success('Revenue PIN set successfully!');
      setPin('');
      setConfirmPin('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to set PIN');
    } finally {
      setIsSettingPin(false);
    }
  };

  const handleUnlock = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('laundry_settings')
      .select('revenue_pin')
      .eq('user_id', user.id)
      .single() as any;

    if (data?.revenue_pin === pin) {
      setIsUnlocked(true);
      setPin('');
      fetchRevenue();
    } else {
      toast.error('Incorrect PIN');
    }
  };

  const fetchRevenue = async () => {
    const { data: orders } = await supabase
      .from('laundry_orders')
      .select('total_amount, cleaning_type')
      .eq('status', 'checked_out') as any;

    if (!orders) {
      setRevenue({ totalRevenue: 0, totalOrders: 0, byType: [] });
      return;
    }

    const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.total_amount), 0);
    const byTypeMap: Record<string, number> = {};
    orders.forEach((o: any) => {
      byTypeMap[o.cleaning_type] = (byTypeMap[o.cleaning_type] || 0) + Number(o.total_amount);
    });

    setRevenue({
      totalRevenue,
      totalOrders: orders.length,
      byType: Object.entries(byTypeMap).map(([key, value]) => ({
        name: CLEANING_LABELS[key] || key,
        value,
      })),
    });
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  // Set PIN for first time
  if (!hasPin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Set Revenue PIN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-sm">
          <p className="text-sm text-muted-foreground">Set a 4-digit PIN to protect your revenue data.</p>
          <div className="space-y-2">
            <Label>PIN (4 digits)</Label>
            <Input type="password" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" />
          </div>
          <div className="space-y-2">
            <Label>Confirm PIN</Label>
            <Input type="password" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" />
          </div>
          <Button onClick={handleSetPin} disabled={isSettingPin}>
            {isSettingPin ? 'Setting...' : 'Set PIN'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Enter PIN to unlock
  if (!isUnlocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Revenue Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-sm">
          <p className="text-sm text-muted-foreground">Enter your 4-digit PIN to view revenue.</p>
          <Input
            type="password"
            maxLength={4}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
          />
          <Button onClick={handleUnlock}>Unlock</Button>
        </CardContent>
      </Card>
    );
  }

  // Revenue dashboard
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IndianRupee className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{revenue?.totalRevenue || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{revenue?.totalOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {revenue && revenue.byType.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue by Cleaning Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenue.byType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value}`} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={revenue.byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {revenue.byType.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
