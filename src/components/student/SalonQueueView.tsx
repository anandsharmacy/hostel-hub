import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Armchair, Users, LogOut } from 'lucide-react';

interface SalonChair {
  id: string;
  hostel_block: string;
  chair_number: number;
  barber_id: string | null;
  barber_name: string | null;
  is_active: boolean;
}

interface QueueEntry {
  id: string;
  chair_id: string;
  student_id: string;
  student_name: string;
  position: number;
  status: string;
}

function normalizeHostelBlock(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const val = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  // Already in correct format
  if (/^hostel [bg]\d$/i.test(raw.trim())) return [raw.trim()];
  // "B1", "B2", "G1", "G2"
  const match = val.match(/^([bg])(\d)$/);
  if (match) return [`Hostel ${match[1].toUpperCase()}${match[2]}`];
  // "Block B1", "Block G2", etc.
  const blockMatch = val.match(/^block\s+([bg])(\d)$/);
  if (blockMatch) return [`Hostel ${blockMatch[1].toUpperCase()}${blockMatch[2]}`];
  // Ambiguous: "B", "Block B" → show both B1 and B2
  if (val === 'b' || val === 'block b') return ['Hostel B1', 'Hostel B2'];
  if (val === 'g' || val === 'block g') return ['Hostel G1', 'Hostel G2'];
  return [];
}

export function SalonQueueView() {
  const { user, profile } = useAuth();
  const [chairs, setChairs] = useState<SalonChair[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const hostelBlocks = normalizeHostelBlock(profile?.hostel_block);

  const fetchData = async () => {
    if (hostelBlocks.length === 0) { setLoading(false); return; }

    const [chairsRes, queueRes] = await Promise.all([
      supabase.from('salon_chairs').select('*').in('hostel_block', hostelBlocks).order('chair_number'),
      supabase.from('salon_queue').select('*').in('status', ['waiting', 'in_service']).order('position'),
    ]);
    if (chairsRes.data) setChairs(chairsRes.data as SalonChair[]);
    if (queueRes.data) setQueue(queueRes.data as QueueEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('student-salon')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salon_chairs' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salon_queue' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hostelBlocks.join(',')]);

  const myQueueEntry = queue.find(q => q.student_id === user?.id && q.status === 'waiting');

  const joinQueue = async (chairId: string) => {
    if (myQueueEntry) {
      toast.error('You are already in a queue. Leave your current queue first.');
      return;
    }
    const chairQueue = queue.filter(q => q.chair_id === chairId && q.status === 'waiting');
    const nextPosition = chairQueue.length > 0 ? Math.max(...chairQueue.map(q => q.position)) + 1 : 1;

    const { error } = await supabase.from('salon_queue').insert({
      chair_id: chairId,
      student_id: user?.id,
      student_name: profile?.full_name || 'Student',
      position: nextPosition,
      status: 'waiting',
    });
    if (error) toast.error('Failed to join queue');
    else toast.success('Joined the queue!');
  };

  const leaveQueue = async () => {
    if (!myQueueEntry) return;
    const { error } = await supabase.from('salon_queue').delete().eq('id', myQueueEntry.id);
    if (error) toast.error('Failed to leave queue');
    else toast.success('Left the queue');
  };

  if (hostelBlocks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {profile?.hostel_block
            ? `Could not match "${profile.hostel_block}" to a salon. Please update your hostel block (e.g. "Hostel B1").`
            : 'Your hostel block is not set. Please update your profile.'}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{hostelBlocks.join(' & ')} Salon</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mirror visual */}
          <div className="bg-gradient-to-b from-muted/80 to-muted/30 rounded-t-xl p-3 text-center border border-b-0">
            <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Mirror</span>
          </div>

          {/* Chairs */}
          <div className="grid grid-cols-3 border rounded-b-xl overflow-hidden">
            {chairs.map(chair => {
              const chairQueue = queue.filter(q => q.chair_id === chair.id && q.status === 'waiting');
              const inService = queue.find(q => q.chair_id === chair.id && q.status === 'in_service');
              const isMyQueue = myQueueEntry?.chair_id === chair.id;
              const myPosition = isMyQueue ? myQueueEntry?.position : null;

              return (
                <div key={chair.id} className="p-4 text-center space-y-3 border-r last:border-r-0">
                  <Armchair className={`w-10 h-10 mx-auto ${chair.is_active ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Chair {chair.chair_number}</div>
                    <div className="font-semibold text-sm truncate">
                      {chair.is_active ? chair.barber_name : 'Vacant'}
                    </div>
                  </div>

                  {chair.is_active && (
                    <>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{chairQueue.length} waiting</span>
                      </div>

                      {isMyQueue && (
                        <div className="space-y-2">
                          <Badge variant="default">Position #{myPosition}</Badge>
                          <Button size="sm" variant="destructive" className="w-full text-xs" onClick={leaveQueue}>
                            <LogOut className="w-3 h-3 mr-1" /> Leave Queue
                          </Button>
                        </div>
                      )}

                      {!isMyQueue && !myQueueEntry && (
                        <Button size="sm" className="w-full text-xs" onClick={() => joinQueue(chair.id)}>
                          Join Queue
                        </Button>
                      )}
                    </>
                  )}

                  {!chair.is_active && (
                    <span className="text-xs text-muted-foreground">Not available</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {myQueueEntry && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 text-center">
            <p className="font-medium">You are in queue — Position #{myQueueEntry.position}</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait for your turn</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
