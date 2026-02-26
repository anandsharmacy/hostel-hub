import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';

const CLOTH_TYPES = [
  'Shirt', 'T-Shirt', 'Pants', 'Jeans', 'Jacket', 'Blazer', 'Coat',
  'Shorts', 'Kurta', 'Saree', 'Bedsheet', 'Towel', 'Other'
];

const CLEANING_TYPES = [
  { value: 'wash_only', label: 'Wash Only (₹7/cloth)' },
  { value: 'iron_only', label: 'Iron Only (₹7/cloth)' },
  { value: 'wash_and_iron', label: 'Wash & Iron (₹15/cloth)' },
  { value: 'dry_clean', label: 'Dry Clean (₹50/cloth, ₹100 for Blazer/Coat)' },
];

const SPECIAL_ITEMS = ['Blazer', 'Coat'];

interface ClothItem {
  cloth_type: string;
  quantity: number;
}

function getUnitPrice(cleaningType: string, clothType: string): number {
  if (cleaningType === 'dry_clean') {
    return SPECIAL_ITEMS.includes(clothType) ? 100 : 50;
  }
  if (cleaningType === 'wash_and_iron') return 15;
  return 7;
}

export function LaundryCheckInForm() {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [sapId, setSapId] = useState('');
  const [hostelBlock, setHostelBlock] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [cleaningType, setCleaningType] = useState('wash_only');
  const [items, setItems] = useState<ClothItem[]>([{ cloth_type: '', quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => setItems([...items, { cloth_type: '', quantity: 1 }]);

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ClothItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const totalAmount = items.reduce((sum, item) => {
    if (!item.cloth_type) return sum;
    return sum + getUnitPrice(cleaningType, item.cloth_type) * item.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validItems = items.filter(i => i.cloth_type && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one clothing item');
      return;
    }
    if (!studentName.trim()) {
      toast.error('Please enter student name');
      return;
    }
    if (!sapId.trim()) {
      toast.error('Please enter SAP ID');
      return;
    }
    if (!hostelBlock.trim()) {
      toast.error('Please enter hostel block');
      return;
    }
    if (!contactNumber.trim()) {
      toast.error('Please enter contact number');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('laundry_vendor_orders' as any)
        .insert({
          user_id: user.id,
          student_name: studentName,
          sap_id: sapId,
          hostel_block: hostelBlock,
          contact_number: contactNumber,
          cleaning_type: cleaningType,
          total_amount: totalAmount,
          status: 'checked_in',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = validItems.map(item => ({
        order_id: (order as any).id,
        cloth_type: item.cloth_type,
        quantity: item.quantity,
        unit_price: getUnitPrice(cleaningType, item.cloth_type),
        is_special: SPECIAL_ITEMS.includes(item.cloth_type),
      }));

      const { error: itemsError } = await supabase
        .from('laundry_vendor_order_items' as any)
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Laundry checked in successfully!');
      setItems([{ cloth_type: '', quantity: 1 }]);
      setStudentName('');
      setSapId('');
      setHostelBlock('');
      setContactNumber('');
      setCleaningType('wash_only');
    } catch (error: any) {
      toast.error(error.message || 'Failed to check in laundry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Clothes Check-In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Student Name</Label>
              <Input
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Enter student name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>SAP ID</Label>
              <Input
                value={sapId}
                onChange={e => setSapId(e.target.value)}
                placeholder="Enter SAP ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Hostel Block</Label>
              <Input
                value={hostelBlock}
                onChange={e => setHostelBlock(e.target.value)}
                placeholder="Enter hostel block"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                placeholder="Enter contact number"
                maxLength={15}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cleaning Type</Label>
            <Select value={cleaningType} onValueChange={setCleaningType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLEANING_TYPES.map(ct => (
                  <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Clothing Items</Label>
            {items.map((item, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={item.cloth_type} onValueChange={v => updateItem(index, 'cloth_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cloth type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLOTH_TYPES.map(ct => (
                        <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="w-20 text-sm font-medium text-right pb-2">
                  {item.cloth_type ? `₹${getUnitPrice(cleaningType, item.cloth_type) * item.quantity}` : '—'}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-lg font-semibold">
              Total: <span className="text-primary">₹{totalAmount}</span>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Checking In...' : 'Check In Clothes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
