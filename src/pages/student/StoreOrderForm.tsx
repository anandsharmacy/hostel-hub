import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Plus, Minus, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';

const hostelBlocks = ['Block A', 'Block B', 'Block C', 'Block D'];

const storeCategories = {
  Stationery: [
    { name: 'Notebook (200 pages)', price: 60 },
    { name: 'Pen Set (Pack of 5)', price: 50 },
    { name: 'File Folder', price: 30 },
    { name: 'Highlighters (Pack of 4)', price: 80 },
    { name: 'Sticky Notes', price: 40 },
    { name: 'Stapler', price: 120 },
  ],
  Fruits: [
    { name: 'Apples (1 kg)', price: 180 },
    { name: 'Bananas (1 dozen)', price: 60 },
    { name: 'Oranges (1 kg)', price: 120 },
    { name: 'Grapes (500g)', price: 100 },
    { name: 'Pomegranate (2 pcs)', price: 150 },
    { name: 'Mixed Fruit Bowl', price: 200 },
  ],
  'Gym Supplements': [
    { name: 'Protein Bar (Pack of 6)', price: 450 },
    { name: 'Energy Drink (500ml)', price: 80 },
    { name: 'Peanut Butter (500g)', price: 320 },
    { name: 'Protein Shake Mix', price: 1200 },
    { name: 'BCAA Powder', price: 900 },
    { name: 'Multivitamin (30 tablets)', price: 350 },
  ],
};

type Category = keyof typeof storeCategories;

interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

export function StoreOrderForm() {
  const { user } = useAuth();
  const { addStoreOrder } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Stationery');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [formData, setFormData] = useState({
    studentName: user?.name || '',
    hostelBlock: user?.hostelBlock || '',
    roomNumber: user?.roomNumber || '',
  });

  const addToCart = (item: { name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
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
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    addStoreOrder({
      ...formData,
      category: selectedCategory,
      items: cart.map(({ name, quantity }) => ({ name, quantity })),
    });
    
    toast.success('Order placed successfully!');
    setCart([]);
    setIsSubmitting(false);
  };

  return (
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
                <CardDescription>Order stationery, fruits, and supplements</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(storeCategories) as Category[]).map((category) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {storeCategories[selectedCategory].map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-muted-foreground text-sm">₹{item.price}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToCart(item)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
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
                <Label htmlFor="hostelBlock">Hostel Block *</Label>
                <Select
                  value={formData.hostelBlock}
                  onValueChange={(value) => setFormData({ ...formData, hostelBlock: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select block" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostelBlocks.map((block) => (
                      <SelectItem key={block} value={block}>
                        {block}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
  );
}
