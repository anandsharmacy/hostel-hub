import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlipTimePicker } from '@/components/student/FlipTimePicker';
import { Sparkles, Send, Clock, Info, AlertTriangle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const hostelBlocks = ['Hostel B1', 'Hostel B2', 'Hostel G1', 'Hostel G2'];

const formatHour = (hour: number): string => {
  const wholeHour = Math.floor(hour);
  const minutes = hour % 1 === 0.5 ? '30' : '00';
  const ampm = wholeHour >= 12 ? 'PM' : 'AM';
  const h12 = wholeHour % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

const parseHourFromTimeString = (time: string): number => {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hour = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return hour + (minutes >= 30 ? 0.5 : 0);
};

export function CleaningRequestForm() {
  const { profile } = useAuth();
  const { addCleaningRequest } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(14);
  const [queueCount, setQueueCount] = useState(0);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  const [formData, setFormData] = useState({
    studentName: profile?.full_name || '',
    hostelBlock: profile?.hostel_block || '',
    roomNumber: profile?.room_number || '',
    preferredDate: '',
    notes: '',
  });

  const availabilityStart = formatHour(startHour);
  const availabilityEnd = formatHour(endHour);

  // Fetch overlapping bookings count
  const fetchQueueCount = useCallback(async () => {
    if (!formData.preferredDate) {
      setQueueCount(0);
      return;
    }

    setIsLoadingQueue(true);
    try {
      const { data, error } = await supabase
        .from('cleaning_requests')
        .select('availability_start, availability_end')
        .eq('preferred_date', formData.preferredDate)
        .in('status', ['pending', 'in-progress'])
        .not('availability_start', 'is', null)
        .not('availability_end', 'is', null);

      if (error) {
        console.error('Error fetching queue:', error);
        setQueueCount(0);
        return;
      }

      const studentStart = startHour;
      const studentEnd = endHour;

      const overlapping = (data || []).filter((row) => {
        const rowStart = parseHourFromTimeString(row.availability_start!);
        const rowEnd = parseHourFromTimeString(row.availability_end!);
        // Overlap: starts before student ends AND ends after student starts
        return rowStart < studentEnd && rowEnd > studentStart;
      });

      setQueueCount(overlapping.length);
    } catch (err) {
      console.error('Error:', err);
      setQueueCount(0);
    } finally {
      setIsLoadingQueue(false);
    }
  }, [formData.preferredDate, startHour, endHour]);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQueueCount();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchQueueCount]);

  // Calculate expected arrival based on queue position
  const expectedArrival = useMemo(() => {
    const start = startHour;
    const end = endHour;
    const arrivalStart = start + queueCount * 0.5;
    const arrivalEnd = arrivalStart + 0.5;

    if (arrivalEnd > end) {
      return { start: '', end: '', overflow: true };
    }

    return {
      start: formatHour(arrivalStart),
      end: formatHour(arrivalEnd),
      overflow: false,
    };
  }, [startHour, endHour, queueCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hostelBlock || !formData.roomNumber || !formData.preferredDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (expectedArrival.overflow) {
      toast.error('This time slot is full. Please choose a wider window or different date.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addCleaningRequest({
        studentName: formData.studentName,
        hostelBlock: formData.hostelBlock,
        roomNumber: formData.roomNumber,
        preferredDate: formData.preferredDate,
        preferredTime: `${availabilityStart} - ${availabilityEnd}`,
        availabilityStart,
        availabilityEnd,
        expectedArrivalStart: expectedArrival.start,
        expectedArrivalEnd: expectedArrival.end,
        notes: formData.notes,
      });
      toast.success('Cleaning request submitted successfully!');

      setFormData({
        ...formData,
        preferredDate: '',
        notes: '',
      });
      setStartHour(10);
      setEndHour(14);
    } catch (error) {
      console.error('Error submitting cleaning request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          </div>

          <div className="space-y-4">
            <Label>Room Availability Window *</Label>
            <p className="text-sm text-muted-foreground">
              Select the start and end hours you'll be available (minimum 2 hours apart)
            </p>
            <div className="flex flex-wrap items-end justify-center gap-8 py-4">
              <FlipTimePicker
                label="Start"
                hour={startHour}
                onChange={(h) => {
                  setStartHour(h);
                  if (endHour - h < 2) setEndHour(Math.min(h + 2, 17));
                }}
                min={8}
                max={15}
              />
              <span className="text-xl font-bold text-muted-foreground pb-6">to</span>
              <FlipTimePicker
                label="End"
                hour={endHour}
                onChange={(h) => {
                  setEndHour(h);
                  if (h - startHour < 2) setStartHour(Math.max(h - 2, 8));
                }}
                min={10}
                max={17}
              />
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm font-medium">
                <Clock className="w-4 h-4 text-primary" />
                Available: {availabilityStart} – {availabilityEnd}
              </span>
            </div>
          </div>

          {/* Queue Info */}
          {formData.preferredDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              {isLoadingQueue ? (
                <span>Checking queue...</span>
              ) : (
                <span>
                  {queueCount === 0
                    ? "No bookings ahead of you — you're first in line!"
                    : `${queueCount} booking${queueCount > 1 ? 's' : ''} ahead of you on this date`}
                </span>
              )}
            </div>
          )}

          {/* Expected Arrival Time */}
          {expectedArrival.overflow ? (
            <Alert className="bg-destructive/5 border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Time slot full!</span>{' '}
                There are too many bookings for your selected window. Please choose a wider availability range or a different date.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Expected Arrival Time:</span>{' '}
                Our cleaning staff may arrive anytime between{' '}
                <span className="font-semibold text-primary">{expectedArrival.start}</span>{' '}
                and{' '}
                <span className="font-semibold text-primary">{expectedArrival.end}</span>{' '}
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

          <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || expectedArrival.overflow}>
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
