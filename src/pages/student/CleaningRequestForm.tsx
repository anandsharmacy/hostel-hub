import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';

const hostelBlocks = ['Block A', 'Block B', 'Block C', 'Block D'];
const timeSlots = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

export function CleaningRequestForm() {
  const { user } = useAuth();
  const { addCleaningRequest } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    studentName: user?.name || '',
    hostelBlock: user?.hostelBlock || '',
    roomNumber: user?.roomNumber || '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.hostelBlock || !formData.roomNumber || !formData.preferredDate || !formData.preferredTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    addCleaningRequest(formData);
    toast.success('Cleaning request submitted successfully!');
    
    setFormData({
      ...formData,
      preferredDate: '',
      preferredTime: '',
      notes: '',
    });
    
    setIsSubmitting(false);
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
            
            <div className="input-group md:col-span-2">
              <Label htmlFor="preferredTime">Preferred Time *</Label>
              <Select
                value={formData.preferredTime}
                onValueChange={(value) => setFormData({ ...formData, preferredTime: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
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
