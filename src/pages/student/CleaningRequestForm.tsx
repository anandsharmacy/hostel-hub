import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Send, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const hostelBlocks = ['Hostel B1', 'Hostel B2', 'Hostel G1', 'Hostel G2'];

// Generate time slots with 20-minute intervals from 8:00 AM to 5:00 PM
const generateTimeSlots = () => {
  const slots: { value: string; label: string; arrivalStart: string; arrivalEnd: string }[] = [];
  const startHour = 8; // 8:00 AM
  const endHour = 17; // 5:00 PM
  const intervalMinutes = 20;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      // Skip slots that would extend past 5 PM
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
      
      slots.push({
        value,
        label: `${arrivalStart} - ${arrivalEnd}`,
        arrivalStart,
        arrivalEnd,
      });
    }
  }
  
  return slots;
};

const allTimeSlots = generateTimeSlots();

interface BlockedSlot {
  blocked_date: string;
  blocked_time_slot: string;
}

export function CleaningRequestForm() {
  const { profile } = useAuth();
  const { addCleaningRequest } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  
  const [formData, setFormData] = useState({
    studentName: profile?.full_name || '',
    hostelBlock: profile?.hostel_block || '',
    roomNumber: profile?.room_number || '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  });

  // Fetch blocked slots
  useEffect(() => {
    const fetchBlockedSlots = async () => {
      const { data, error } = await supabase
        .from('blocked_cleaning_slots')
        .select('blocked_date, blocked_time_slot');
      
      if (!error && data) {
        setBlockedSlots(data);
      }
    };
    
    fetchBlockedSlots();
  }, []);

  // Filter available time slots based on selected date
  const availableTimeSlots = useMemo(() => {
    if (!formData.preferredDate) {
      return allTimeSlots;
    }
    
    const blockedForDate = blockedSlots
      .filter(slot => slot.blocked_date === formData.preferredDate)
      .map(slot => slot.blocked_time_slot);
    
    return allTimeSlots.filter(slot => !blockedForDate.includes(slot.value));
  }, [formData.preferredDate, blockedSlots]);

  // Reset time slot if it becomes unavailable when date changes
  useEffect(() => {
    if (formData.preferredTime && formData.preferredDate) {
      const isStillAvailable = availableTimeSlots.some(slot => slot.value === formData.preferredTime);
      if (!isStillAvailable) {
        setFormData(prev => ({ ...prev, preferredTime: '' }));
      }
    }
  }, [formData.preferredDate, availableTimeSlots, formData.preferredTime]);

  // Get the selected time slot details for display
  const selectedSlot = useMemo(() => {
    return allTimeSlots.find(slot => slot.value === formData.preferredTime);
  }, [formData.preferredTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.hostelBlock || !formData.roomNumber || !formData.preferredDate || !formData.preferredTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addCleaningRequest(formData);
      toast.success('Cleaning request submitted successfully!');
      
      setFormData({
        ...formData,
        preferredDate: '',
        preferredTime: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error submitting cleaning request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasBlockedSlotsForDate = formData.preferredDate && 
    blockedSlots.some(slot => slot.blocked_date === formData.preferredDate);

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Room Cleaning Request</CardTitle>
            <CardDescription>Schedule a room cleaning service</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            
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
            
            <div className="input-group">
              <Label htmlFor="preferredDate">Preferred Date *</Label>
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="input-group md:col-span-2">
              <Label htmlFor="preferredTime">Preferred Time Slot *</Label>
              <Select
                value={formData.preferredTime}
                onValueChange={(value) => setFormData({ ...formData, preferredTime: value })}
                disabled={!formData.preferredDate}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.preferredDate ? "Select time slot" : "Select a date first"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableTimeSlots.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No slots available for this date
                    </div>
                  ) : (
                    availableTimeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {slot.label}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {hasBlockedSlotsForDate && availableTimeSlots.length < allTimeSlots.length && (
                <p className="text-xs text-muted-foreground mt-1">
                  Some time slots are unavailable on this date
                </p>
              )}
            </div>
          </div>

          {/* Expected Arrival Time Display */}
          {selectedSlot && (
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Expected Arrival Time:</span>{' '}
                Our cleaning staff will arrive between{' '}
                <span className="font-semibold text-primary">{selectedSlot.arrivalStart}</span>{' '}
                and{' '}
                <span className="font-semibold text-primary">{selectedSlot.arrivalEnd}</span>{' '}
                on your selected date.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="input-group">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any specific instructions or areas to focus on..."
              rows={3}
            />
          </div>
          
          <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Request
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
