import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Pill, Upload, FileText, X, Receipt, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { normalizeHostelDisplay } from '@/lib/hostelUtils';



export function MedicineRequestForm() {
  const { user, profile } = useAuth();
  const { addMedicineRequest, medicineRequests } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastReceiptNumber, setLastReceiptNumber] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    studentName: profile?.full_name || '',
    hostelBlock: profile?.hostel_block || '',
    roomNumber: profile?.room_number || '',
    medicineName: '',
    notes: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file only');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file only');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPrescription = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;
    
    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, selectedFile);
      
      if (uploadError) throw uploadError;
      
      // Store just the file path (not a public URL) since bucket is private
      return fileName;
    } catch (error) {
      console.error('Error uploading prescription:', error);
      toast.error('Failed to upload prescription');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.hostelBlock || !formData.roomNumber) {
      toast.error('Please fill in hostel block and room number');
      return;
    }

    if (!formData.medicineName && !selectedFile) {
      toast.error('Please enter medicine name or upload a prescription');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let prescriptionUrl: string | null = null;
      
      if (selectedFile) {
        prescriptionUrl = await uploadPrescription();
      }
      
      const previousCount = medicineRequests.length;
      await addMedicineRequest({
        studentName: formData.studentName,
        hostelBlock: normalizeHostelDisplay(formData.hostelBlock),
        roomNumber: formData.roomNumber,
        medicineName: formData.medicineName || null,
        prescriptionUrl,
        notes: formData.notes || null,
      });
      
      // Show receipt dialog
      setTimeout(() => {
        if (medicineRequests.length > 0) {
          const latestRequest = medicineRequests[0];
          if (latestRequest.receiptNumber) {
            setLastReceiptNumber(latestRequest.receiptNumber);
            setShowReceiptDialog(true);
          }
        }
      }, 500);
      
      toast.success('Medicine request submitted successfully!');
      setFormData(prev => ({ ...prev, medicineName: '', notes: '' }));
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error submitting medicine request:', error);
      toast.error('Failed to submit request. Please try again.');
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
              Request Submitted Successfully!
            </DialogTitle>
            <DialogDescription>
              Your medicine request has been submitted and is being processed.
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
              Please save this receipt number for tracking your request. You can also find it in "My Requests".
            </p>
          </div>
          <Button onClick={() => setShowReceiptDialog(false)} className="w-full">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>

      <Card className="card-elevated max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
              <Pill className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <CardTitle>Medicine Request</CardTitle>
              <CardDescription>Request medicines with prescription upload or manual entry</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


              
              <div className="input-group">
                <Label htmlFor="roomNumber">Room Number *</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g., 304"
                />
              </div>
            </div>

            {/* Prescription Upload */}
            <div className="input-group">
              <Label>Upload Prescription (PDF)</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  selectedFile 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">Drag & drop your prescription PDF here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse (max 5MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <span className="relative bg-card px-3 text-xs text-muted-foreground uppercase">
                Or enter manually
              </span>
            </div>

            {/* Manual Medicine Entry */}
            <div className="input-group">
              <Label htmlFor="medicineName">Medicine Name</Label>
              <Input
                id="medicineName"
                value={formData.medicineName}
                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                placeholder="e.g., Paracetamol 500mg, Crocin, etc."
              />
            </div>

            <div className="input-group">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions or dosage information..."
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting || isUploading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isUploading ? 'Uploading...' : 'Submitting...'}
                </span>
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
