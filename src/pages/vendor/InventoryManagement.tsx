import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, AlertTriangle, CheckCircle, Plus, Minus, Search, 
  RefreshCw, History, TrendingUp, TrendingDown, Edit2, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  low_stock_threshold: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface RestockHistory {
  id: string;
  item_id: string;
  previous_quantity: number;
  new_quantity: number;
  restocked_by: string;
  notes: string | null;
  created_at: string;
}

const categories = ['Stationery', 'Fruits', 'Gym Supplements', 'Medicine'];

export function InventoryManagement() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [restockHistory, setRestockHistory] = useState<RestockHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(0);
  const [restockNotes, setRestockNotes] = useState('');
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Stationery',
    quantity: 0,
    price: 0,
    low_stock_threshold: 5,
  });

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
      return;
    }
    setItems(data || []);
  };

  const fetchRestockHistory = async (itemId?: string) => {
    let query = supabase
      .from('restock_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (itemId) {
      query = query.eq('item_id', itemId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching restock history:', error);
      return;
    }
    setRestockHistory(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchItems();
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleRestock = async () => {
    if (!selectedItem || !user || restockAmount <= 0) {
      toast.error('Please enter a valid restock amount');
      return;
    }

    const newQuantity = selectedItem.quantity + restockAmount;
    
    try {
      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', selectedItem.id);
      
      if (updateError) throw updateError;

      // Add to restock history
      const { error: historyError } = await supabase
        .from('restock_history')
        .insert({
          item_id: selectedItem.id,
          previous_quantity: selectedItem.quantity,
          new_quantity: newQuantity,
          restocked_by: user.id,
          notes: restockNotes || null,
        });
      
      if (historyError) throw historyError;

      toast.success(`Restocked ${selectedItem.name} (+${restockAmount})`);
      setShowRestockDialog(false);
      setRestockAmount(0);
      setRestockNotes('');
      setSelectedItem(null);
      await fetchItems();
    } catch (error) {
      console.error('Error restocking:', error);
      toast.error('Failed to restock item');
    }
  };

  const handleUpdateQuantity = async (item: InventoryItem, delta: number) => {
    const newQuantity = Math.max(0, item.quantity + delta);
    
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', item.id);
      
      if (error) throw error;
      
      // Add to history if reducing stock
      if (delta < 0 && user) {
        await supabase.from('restock_history').insert({
          item_id: item.id,
          previous_quantity: item.quantity,
          new_quantity: newQuantity,
          restocked_by: user.id,
          notes: 'Manual adjustment',
        });
      }

      await fetchItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const handleToggleAvailability = async (item: InventoryItem) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);
      
      if (error) throw error;
      
      toast.success(`${item.name} marked as ${!item.is_available ? 'available' : 'unavailable'}`);
      await fetchItems();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || newItem.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_items')
        .insert({
          name: newItem.name,
          category: newItem.category,
          quantity: newItem.quantity,
          price: newItem.price,
          low_stock_threshold: newItem.low_stock_threshold,
        });
      
      if (error) throw error;
      
      toast.success('Item added to inventory');
      setShowAddDialog(false);
      setNewItem({
        name: '',
        category: 'Stationery',
        quantity: 0,
        price: 0,
        low_stock_threshold: 5,
      });
      await fetchItems();
    } catch (error: any) {
      console.error('Error adding item:', error);
      if (error.code === '23505') {
        toast.error('An item with this name already exists in this category');
      } else {
        toast.error('Failed to add item');
      }
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;
      
      toast.success('Item deleted');
      await fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const openHistoryDialog = async (item: InventoryItem) => {
    setSelectedItem(item);
    await fetchRestockHistory(item.id);
    setShowHistoryDialog(true);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = !searchQuery.trim() || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const totalItems = items.length;
  const lowStockItems = items.filter(i => i.quantity <= i.low_stock_threshold && i.quantity > 0);
  const outOfStockItems = items.filter(i => i.quantity === 0);
  const availableItems = items.filter(i => i.is_available && i.quantity > 0);

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const, icon: AlertTriangle };
    if (item.quantity <= item.low_stock_threshold) return { label: 'Low Stock', variant: 'secondary' as const, icon: TrendingDown };
    return { label: 'In Stock', variant: 'default' as const, icon: CheckCircle };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading inventory..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
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
                <p className="text-2xl font-bold">{availableItems.length}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outOfStockItems.length}</p>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <Badge key={item.id} variant="secondary" className="cursor-pointer" onClick={() => {
                  setSelectedItem(item);
                  setShowRestockDialog(true);
                }}>
                  {item.name} ({item.quantity} left)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory List */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Manage stock levels and availability</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
              <Button size="sm" variant="outline" onClick={() => fetchItems()}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No items found</p>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const status = getStockStatus(item);
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      !item.is_available ? 'opacity-60 bg-muted/30' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{item.name}</span>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          <Badge variant={status.variant} className="text-xs flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                          {!item.is_available && (
                            <Badge variant="secondary" className="text-xs">Disabled</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>₹{item.price.toFixed(2)}</span>
                          <span>•</span>
                          <span>Qty: <strong className={item.quantity <= item.low_stock_threshold ? 'text-warning' : ''}>{item.quantity}</strong></span>
                          <span>•</span>
                          <span>Low threshold: {item.low_stock_threshold}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Quick quantity adjustment */}
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleUpdateQuantity(item, -1)}
                            disabled={item.quantity === 0}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleUpdateQuantity(item, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowRestockDialog(true);
                          }}
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Restock
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openHistoryDialog(item)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.is_available}
                            onCheckedChange={() => handleToggleAvailability(item)}
                          />
                        </div>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={showRestockDialog} onOpenChange={setShowRestockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock Item</DialogTitle>
            <DialogDescription>
              Add stock for {selectedItem?.name}. Current quantity: {selectedItem?.quantity}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="input-group">
              <Label>Quantity to Add</Label>
              <Input
                type="number"
                min="1"
                value={restockAmount || ''}
                onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter quantity"
              />
            </div>
            <div className="input-group">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={restockNotes}
                onChange={(e) => setRestockNotes(e.target.value)}
                placeholder="e.g., Supplier delivery, weekly restock"
                rows={2}
              />
            </div>
            {selectedItem && restockAmount > 0 && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                New quantity will be: <strong>{selectedItem.quantity + restockAmount}</strong>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestockDialog(false)}>Cancel</Button>
            <Button onClick={handleRestock} disabled={restockAmount <= 0}>
              <TrendingUp className="w-4 h-4 mr-1" />
              Restock (+{restockAmount || 0})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>Add a new item to your inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="input-group">
              <Label>Item Name *</Label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g., Protein Bar (Pack of 6)"
              />
            </div>
            <div className="input-group">
              <Label>Category *</Label>
              <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price || ''}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="input-group">
                <Label>Initial Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.quantity || ''}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="input-group">
              <Label>Low Stock Threshold</Label>
              <Input
                type="number"
                min="1"
                value={newItem.low_stock_threshold || ''}
                onChange={(e) => setNewItem({ ...newItem, low_stock_threshold: parseInt(e.target.value) || 5 })}
                placeholder="5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Restock History</DialogTitle>
            <DialogDescription>
              History for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {restockHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No history yet</p>
            ) : (
              <div className="space-y-3">
                {restockHistory.map((entry) => (
                  <div key={entry.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {entry.previous_quantity} → {entry.new_quantity}
                        <span className={`ml-2 ${entry.new_quantity > entry.previous_quantity ? 'text-success' : 'text-warning'}`}>
                          ({entry.new_quantity > entry.previous_quantity ? '+' : ''}{entry.new_quantity - entry.previous_quantity})
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-muted-foreground mt-1">{entry.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
