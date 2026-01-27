import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Generate time slots with 20-minute intervals from 8:00 AM to 5:00 PM
const generateTimeSlots = () => {
  const slots: { value: string; label: string }[] = [];
  const startHour = 8;
  const endHour = 17;
  const intervalMinutes = 20;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      if (hour === endHour - 1 && minute + intervalMinutes > 60) continue;
      
      const slotStart = new Date();
      slotStart.setHours(hour, minute, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + intervalMinutes);
      
      const formatTime = (date: Date) => {
        const h = date.getHours();
        const m = date.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
      };
      
      const arrivalStart = formatTime(slotStart);
      const arrivalEnd = formatTime(slotEnd);
      const value = `${arrivalStart} - ${arrivalEnd}`;
      
      slots.push({ value, label: value });
    }
  }
  
  return slots;
};

const timeSlots = generateTimeSlots();

const reasonPresets = [
  'Holiday',
  'Maintenance',
  'Staff Unavailable',
  'Special Event',
  'Other',
];

interface BlockedSlot {
  id: string;
  blocked_date: string;
  blocked_time_slot: string;
  reason: string | null;
  created_at: string;
}

export function BlockedSlotsManager() {
  const { user } = useAuth();
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    timeSlot: '',
    reason: '',
  });

  const fetchBlockedSlots = async () => {
    const { data, error } = await supabase
      .from('blocked_cleaning_slots')
      .select('*')
      .order('blocked_date', { ascending: true })
      .order('blocked_time_slot', { ascending: true });
    
    if (error) {
      console.error('Error fetching blocked slots:', error);
      toast.error('Failed to load blocked slots');
    } else {
      setBlockedSlots(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBlockedSlots();
  }, []);

  const handleAddBlockedSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.timeSlot) {
      toast.error('Please select a date and time slot');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('blocked_cleaning_slots')
      .insert({
        blocked_date: formData.date,
        blocked_time_slot: formData.timeSlot,
        reason: formData.reason || null,
        created_by: user.id,
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('This time slot is already blocked for this date');
      } else {
        console.error('Error adding blocked slot:', error);
        toast.error('Failed to block time slot');
      }
    } else {
      toast.success('Time slot blocked successfully');
      setFormData({ date: '', timeSlot: '', reason: '' });
      fetchBlockedSlots();
    }

    setIsSubmitting(false);
  };

  const handleRemoveBlockedSlot = async (id: string) => {
    const { error } = await supabase
      .from('blocked_cleaning_slots')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing blocked slot:', error);
      toast.error('Failed to remove blocked slot');
    } else {
      toast.success('Time slot unblocked');
      fetchBlockedSlots();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString + 'T00:00:00'), 'EEE, MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Group blocked slots by date
  const groupedSlots = blockedSlots.reduce((acc, slot) => {
    const date = slot.blocked_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, BlockedSlot[]>);

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <CardTitle>Manage Blocked Slots</CardTitle>
            <CardDescription>Block time slots for holidays, maintenance, or other reasons</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Blocked Slot Form */}
        <form onSubmit={handleAddBlockedSlot} className="p-4 border border-border rounded-lg bg-muted/30 space-y-4">
          <h4 className="font-medium text-sm">Block a Time Slot</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="blockDate">Date *</Label>
              <Input
                id="blockDate"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="blockTimeSlot">Time Slot *</Label>
              <Select
                value={formData.timeSlot}
                onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select slot" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {slot.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="blockReason">Reason</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasonPresets.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Blocking...' : 'Block Slot'}
              </Button>
            </div>
          </div>
        </form>

        {/* Blocked Slots List */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Currently Blocked Slots</h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : Object.keys(groupedSlots).length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No blocked slots. All time slots are available.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedSlots).map(([date, slots]) => (
                <div key={date} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-medium">{formatDate(date)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {slots.length} slot{slots.length > 1 ? 's' : ''} blocked
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded-md text-sm"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{slot.blocked_time_slot}</span>
                        {slot.reason && (
                          <Badge variant="outline" className="text-xs ml-1">
                            {slot.reason}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1 hover:bg-destructive/20"
                          onClick={() => handleRemoveBlockedSlot(slot.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
