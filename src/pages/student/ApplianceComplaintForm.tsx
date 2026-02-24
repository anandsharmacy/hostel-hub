import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Send, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';


const appliances = [
  { value: 'Fan', label: 'Fan' },
  { value: 'Light', label: 'Light / Tube Light' },
  { value: 'AC', label: 'Air Conditioner' },
  { value: 'Geyser', label: 'Geyser / Water Heater' },
  { value: 'Plug Point', label: 'Plug Point / Socket' },
  { value: 'Other', label: 'Other' },
];

export function ApplianceComplaintForm() {
  const { profile } = useAuth();
  const { addApplianceComplaint } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    studentName: profile?.full_name || '',
    hostelBlock: profile?.hostel_block || '',
    roomNumber: profile?.room_number || '',
    appliance: '',
    description: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!imageFile) return null;
    const ext = imageFile.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('appliance-images').upload(path, imageFile);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('appliance-images').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.hostelBlock || !formData.roomNumber || !formData.appliance || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const imageUrl = await uploadImage(profile?.user_id || '');
      await addApplianceComplaint({ ...formData, imageUrl });
      toast.success('Complaint submitted successfully!');
      
      setFormData({
        ...formData,
        appliance: '',
        description: '',
      });
      removeImage();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-warning" />
          </div>
          <div>
            <CardTitle>Appliance Not Working</CardTitle>
            <CardDescription>Report a faulty appliance in your room</CardDescription>
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
              <Label htmlFor="roomNumber">Room Number *</Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g., 304"
              />
            </div>
            
            <div className="input-group">
              <Label htmlFor="appliance">Appliance *</Label>
              <Select
                value={formData.appliance}
                onValueChange={(value) => setFormData({ ...formData, appliance: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select appliance" />
                </SelectTrigger>
                <SelectContent>
                  {appliances.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="input-group">
            <Label htmlFor="description">Issue Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue in detail..."
              rows={4}
            />
          </div>

          <div className="input-group">
            <Label>Upload Image (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-fit">
                <img src={imagePreview} alt="Preview" className="w-40 h-40 object-cover rounded-lg border border-border" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={removeImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <ImagePlus className="w-4 h-4" />
                Add Photo
              </Button>
            )}
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
                Submit Complaint
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
