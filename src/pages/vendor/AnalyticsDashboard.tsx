import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

interface StoreOrder {
  id: string;
  items: { name: string; quantity: number }[];
  status: string;
  created_at: string;
  category: string;
}

interface SalesData {
  date: string;
  orders: number;
  revenue: number;
}

interface PopularItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface CategoryData {
  category: string;
  orders: number;
  revenue: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))'];

export function AnalyticsDashboard() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [inventoryRes, ordersRes] = await Promise.all([
        supabase.from('inventory_items').select('*'),
        supabase.from('store_orders').select('*').order('created_at', { ascending: false }),
      ]);

      if (inventoryRes.data) setInventoryItems(inventoryRes.data);
      if (ordersRes.data) {
        const mappedOrders: StoreOrder[] = ordersRes.data.map((order) => ({
          id: order.id,
          items: (order.items as unknown as { name: string; quantity: number }[]) || [],
          status: order.status,
          created_at: order.created_at,
          category: order.category,
        }));
        setStoreOrders(mappedOrders);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate date range
  const dateRange = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return {
      start: startOfDay(subDays(new Date(), days)),
      end: endOfDay(new Date()),
    };
  }, [timeRange]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return storeOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [storeOrders, dateRange]);

  // Calculate revenue for an order
  const calculateOrderRevenue = (order: StoreOrder): number => {
    return order.items.reduce((total, item) => {
      const inventoryItem = inventoryItems.find((inv) => inv.name === item.name);
      return total + (inventoryItem?.price || 0) * item.quantity;
    }, 0);
  };

  // Sales trend data
  const salesTrendData = useMemo((): SalesData[] => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const intervals = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

    return intervals.map((date) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayOrders = filteredOrders.filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const revenue = dayOrders.reduce((sum, order) => sum + calculateOrderRevenue(order), 0);

      return {
        date: format(date, days <= 7 ? 'EEE' : 'MMM dd'),
        orders: dayOrders.length,
        revenue,
      };
    });
  }, [filteredOrders, dateRange, inventoryItems, timeRange]);

  // Popular items
  const popularItems = useMemo((): PopularItem[] => {
    const itemMap = new Map<string, { quantity: number; revenue: number }>();

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = itemMap.get(item.name) || { quantity: 0, revenue: 0 };
        const inventoryItem = inventoryItems.find((inv) => inv.name === item.name);
        const price = inventoryItem?.price || 0;

        itemMap.set(item.name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + price * item.quantity,
        });
      });
    });

    return Array.from(itemMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredOrders, inventoryItems]);

  // Category breakdown
  const categoryData = useMemo((): CategoryData[] => {
    const categoryMap = new Map<string, { orders: number; revenue: number }>();

    filteredOrders.forEach((order) => {
      const existing = categoryMap.get(order.category) || { orders: 0, revenue: 0 };
      categoryMap.set(order.category, {
        orders: existing.orders + 1,
        revenue: existing.revenue + calculateOrderRevenue(order),
      });
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));
  }, [filteredOrders, inventoryItems]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + calculateOrderRevenue(order), 0);
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter((o) => o.status === 'completed').length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate comparison with previous period
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const prevStart = subDays(dateRange.start, days);
    const prevEnd = subDays(dateRange.end, days);

    const prevOrders = storeOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= prevStart && orderDate <= prevEnd;
    });

    const prevRevenue = prevOrders.reduce((sum, order) => sum + calculateOrderRevenue(order), 0);
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersChange = prevOrders.length > 0 ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      avgOrderValue,
      revenueChange,
      ordersChange,
    };
  }, [filteredOrders, storeOrders, dateRange, timeRange, inventoryItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Sales Analytics</h2>
          <p className="text-sm text-muted-foreground">Track revenue, orders, and popular items</p>
        </div>
        <Select value={timeRange} onValueChange={(v: '7d' | '30d' | '90d') => setTimeRange(v)}>
          <SelectTrigger className="w-40">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{summaryStats.totalRevenue.toLocaleString()}</p>
                <div className={`flex items-center text-xs mt-1 ${summaryStats.revenueChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {summaryStats.revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {Math.abs(summaryStats.revenueChange).toFixed(1)}% from last period
                </div>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{summaryStats.totalOrders}</p>
                <div className={`flex items-center text-xs mt-1 ${summaryStats.ordersChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {summaryStats.ordersChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {Math.abs(summaryStats.ordersChange).toFixed(1)}% from last period
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">₹{summaryStats.avgOrderValue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Per order</p>
              </div>
              <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{summaryStats.completedOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summaryStats.totalOrders > 0 ? ((summaryStats.completedOrders / summaryStats.totalOrders) * 100).toFixed(0) : 0}% completion rate
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ revenue: { label: 'Revenue', color: 'hsl(var(--primary))' } }} className="h-[300px]">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${v}`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => `₹${value}`} />} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGradient)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Orders Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
            <CardDescription>Daily order count over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ orders: { label: 'Orders', color: 'hsl(var(--success))' } }} className="h-[300px]">
              <BarChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
            <CardDescription>Most ordered items in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {popularItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No orders in this period</p>
            ) : (
              <div className="space-y-3">
                {popularItems.slice(0, 8).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} units sold</p>
                    </div>
                    <p className="font-semibold text-success">₹{item.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Revenue distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No orders in this period</p>
            ) : (
              <ChartContainer config={{}} className="h-[280px]">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `₹${value}`} />} />
                  <Legend />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
