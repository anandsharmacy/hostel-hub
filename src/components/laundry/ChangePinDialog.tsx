import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ChangePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePinDialog({ open, onOpenChange }: ChangePinDialogProps) {
  const { user } = useAuth();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePin = async () => {
    if (!user) return;
    if (newPin.length !== 4) {
      toast.error('New PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('New PINs do not match');
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from('laundry_settings')
      .select('revenue_pin')
      .eq('user_id', user.id)
      .single() as any;

    if (data?.revenue_pin !== currentPin) {
      toast.error('Current PIN is incorrect');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('laundry_settings')
      .update({ revenue_pin: newPin })
      .eq('user_id', user.id) as any;

    setLoading(false);
    if (error) {
      toast.error('Failed to update PIN');
    } else {
      toast.success('PIN updated successfully');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Revenue PIN</DialogTitle>
          <DialogDescription>Enter your current PIN and set a new 4-digit PIN.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current PIN</Label>
            <Input
              type="password"
              maxLength={4}
              value={currentPin}
              onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
            />
          </div>
          <div className="space-y-2">
            <Label>New PIN</Label>
            <Input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New PIN</Label>
            <Input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              onKeyDown={e => e.key === 'Enter' && handleChangePin()}
            />
          </div>
          <Button onClick={handleChangePin} disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Update PIN'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
