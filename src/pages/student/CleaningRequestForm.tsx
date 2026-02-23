import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Send, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const hostelBlocks = ['Hostel B1', 'Hostel B2', 'Hostel G1', 'Hostel G2'];

const formatHour = (hour: number): string => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:00 ${ampm}`;
};

export function CleaningRequestForm() {
  const { profile } = useAuth();
  const { addCleaningRequest } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityRange, setAvailabilityRange] = useState<number[]>([10, 14]);

  const [formData, setFormData] = useState({
    studentName: profile?.full_name || '',
    hostelBlock: profile?.hostel_block || '',
    roomNumber: profile?.room_number || '',
    preferredDate: '',
    notes: '',
  });

  const availabilityStart = formatHour(availabilityRange[0]);
  const availabilityEnd = formatHour(availabilityRange[1]);

  const expectedArrival = useMemo(() => {
    const start = availabilityRange[0];
    const end = Math.min(start + 2, availabilityRange[1]);
    return { start: formatHour(start), end: formatHour(end) };
  }, [availabilityRange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hostelBlock || !formData.roomNumber || !formData.preferredDate) {
      toast.error('Please fill in all required fields');
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
      setAvailabilityRange([10, 14]);
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

          {/* Availability Slider */}
          <div className="space-y-4">
            <Label>Room Availability Window *</Label>
            <p className="text-sm text-muted-foreground">
              Select the hours you'll be available in your room (minimum 2 hours)
            </p>
            <div className="px-2 pt-2 pb-1">
              <Slider
                value={availabilityRange}
                onValueChange={setAvailabilityRange}
                min={8}
                max={17}
                step={1}
                minStepsBetweenThumbs={2}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>8 AM</span>
              <span>12 PM</span>
              <span>5 PM</span>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm font-medium">
                <Clock className="w-4 h-4 text-primary" />
                Available: {availabilityStart} – {availabilityEnd}
              </span>
            </div>
          </div>

          {/* Expected Arrival Time */}
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
