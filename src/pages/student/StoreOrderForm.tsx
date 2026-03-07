import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Plus, Minus, ShoppingCart, X, Receipt, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { normalizeHostelDisplay } from '@/lib/hostelUtils';



const storeCategories = ['Stationery', 'Fruits', 'Gym Supplements', 'Medicine'] as const;
type Category = typeof storeCategories[number];

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  is_available: boolean;
  low_stock_threshold: number;
  hostel_section: string;
}

const getHostelSection = (hostelBlock: string): string => {
  if (hostelBlock.includes('B1') || hostelBlock.includes('B2')) return 'boys';
  if (hostelBlock.includes('G1') || hostelBlock.includes('G2')) return 'girls';
  return 'boys';
};

interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

export function StoreOrderForm() {
  const { profile } = useAuth();
  const { addStoreOrder, storeOrders } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Stationery');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastReceiptNumber, setLastReceiptNumber] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  
  const [formData, setFormData] = useState({
    studentName: profile?.full_name || '',
    hostelBlock: profile?.hostel_block || '',
    roomNumber: profile?.room_number || '',
  });

  const hostelSection = getHostelSection(formData.hostelBlock);

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoadingInventory(true);
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .in('category', ['Stationery', 'Fruits', 'Gym Supplements', 'Medicine'])
        .eq('is_available', true)
        .eq('hostel_section', hostelSection)
        .order('name');
      
      if (error) {
        console.error('Error fetching inventory:', error);
      } else {
        setInventoryItems(data || []);
      }
      setIsLoadingInventory(false);
    };
    
    fetchInventory();
  }, [hostelSection]);

  const getItemsByCategory = (category: Category) => {
    return inventoryItems.filter(item => item.category === category);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', color: 'destructive' as const, available: false };
    if (item.quantity <= item.low_stock_threshold) return { label: `${item.quantity} left`, color: 'secondary' as const, available: true };
    return { label: 'In Stock', color: 'default' as const, available: true };
  };

  const addToCart = (item: InventoryItem) => {
    const stock = getStockStatus(item);
    if (!stock.available) {
      toast.error('This item is out of stock');
      return;
    }
    
    const cartItem = cart.find(i => i.name === item.name);
    const currentQtyInCart = cartItem?.quantity || 0;
    
    if (currentQtyInCart >= item.quantity) {
      toast.error(`Only ${item.quantity} available in stock`);
      return;
    }
    
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { name: item.name, price: Number(item.price), quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (name: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.name === name
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (name: string) => {
    setCart((prev) => prev.filter((item) => item.name !== name));
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.hostelBlock || !formData.roomNumber) {
      toast.error('Please fill in hostel block and room number');
      return;
    }

    if (cart.length === 0) {
      toast.error('Please add items to your cart');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const previousOrderCount = storeOrders.length;
      await addStoreOrder({
        ...formData,
        hostelBlock: normalizeHostelDisplay(formData.hostelBlock),
        category: selectedCategory,
        items: cart.map(({ name, quantity }) => ({ name, quantity })),
      });
      
      // Get the latest order's receipt number (refetch happens in addStoreOrder)
      // We need to wait a moment for the state to update, so we'll check in a timeout
      setTimeout(() => {
        // Find the newest order by checking if we have more orders now
        const latestOrders = storeOrders;
        if (latestOrders.length > 0) {
          const latestOrder = latestOrders[0]; // Orders are sorted by created_at desc
          if (latestOrder.receiptNumber) {
            setLastReceiptNumber(latestOrder.receiptNumber);
            setShowReceiptDialog(true);
          }
        }
      }, 500);
      
      toast.success('Order placed successfully!');
      setCart([]);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Receipt Confirmation Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" />
              Order Placed Successfully!
            </DialogTitle>
            <DialogDescription>
              Your order has been submitted and is being processed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Receipt className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Your Receipt Number</p>
              <p className="text-2xl font-mono font-bold text-primary">{lastReceiptNumber}</p>
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Please save this receipt number for tracking your order. You can also find it in "My Requests".
            </p>
          </div>
          <Button onClick={() => setShowReceiptDialog(false)} className="w-full">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-success" />
              </div>
              <div>
                <CardTitle>Store Orders</CardTitle>
                <CardDescription>
                  {formData.hostelBlock 
                    ? `Showing items for ${hostelSection === 'boys' ? 'Boys (B1 & B2)' : 'Girls (G1 & G2)'} section`
                    : 'Select your hostel block to see available items'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {storeCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Items Grid */}
            {isLoadingInventory ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : getItemsByCategory(selectedCategory).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No items available in this category</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getItemsByCategory(selectedCategory).map((item) => {
                  const stock = getStockStatus(item);
                  const cartItem = cart.find(i => i.name === item.name);
                  const cartQty = cartItem?.quantity || 0;
                  
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        stock.available 
                          ? 'bg-muted/50 hover:bg-muted' 
                          : 'bg-muted/30 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">₹{Number(item.price).toFixed(0)}</span>
                          <Badge variant={stock.color} className="text-xs">
                            {stock.available && item.quantity <= item.low_stock_threshold && (
                              <AlertTriangle className="w-3 h-3 mr-1" />
                            )}
                            {stock.label}
                          </Badge>
                        </div>
                        {cartQty > 0 && (
                          <p className="text-xs text-primary font-medium">In cart: {cartQty}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToCart(item)}
                        disabled={!stock.available || cartQty >= item.quantity}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart */}
      <div className="lg:col-span-1">
        <Card className="card-elevated sticky top-4">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Your Cart</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">


              
              <div className="input-group">
                <Label htmlFor="roomNumber">Room Number *</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g., 304"
                />
              </div>

              <div className="border-t pt-4">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Your cart is empty
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.name, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.name, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeFromCart(item.name)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{getTotalPrice()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Placing Order...
                  </span>
                ) : (
                  'Place Order'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
