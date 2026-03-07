import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, LogOut, User } from 'lucide-react';

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
  if (/^hostel [bg]\d$/i.test(raw.trim())) return [raw.trim()];
  const match = val.match(/^([bg])(\d)$/);
  if (match) return [`Hostel ${match[1].toUpperCase()}${match[2]}`];
  const blockMatch = val.match(/^block\s+([bg])(\d)$/);
  if (blockMatch) return [`Hostel ${blockMatch[1].toUpperCase()}${blockMatch[2]}`];
  if (val === 'b' || val === 'block b') return ['Hostel B1', 'Hostel B2'];
  if (val === 'g' || val === 'block g') return ['Hostel G1', 'Hostel G2'];
  return [];
}

/** Determine the pair of hostels to show (B1+B2 or G1+G2) */
function getHostelPair(blocks: string[]): string[] {
  if (blocks.some(b => b.includes('B'))) return ['Hostel B1', 'Hostel B2'];
  if (blocks.some(b => b.includes('G'))) return ['Hostel G1', 'Hostel G2'];
  return blocks;
}

function ChairSVG({ occupied, facing }: { occupied: boolean; facing: 'down' | 'up' }) {
  // Simple salon chair illustration
  const flip = facing === 'up';
  return (
    <svg viewBox="0 0 80 90" className="w-16 h-18 mx-auto" style={{ transform: flip ? 'scaleY(-1)' : undefined }}>
      {/* Head rest / back */}
      <ellipse cx="40" cy="20" rx="28" ry="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground" />
      {/* Arm rests */}
      <rect x="6" y="14" width="8" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
      <rect x="66" y="14" width="8" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
      {/* Seat */}
      <path d="M18 36 Q18 50 24 52 L56 52 Q62 50 62 36" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground" />
      {/* Base */}
      <rect x="25" y="54" width="30" height="6" rx="3" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
      {/* Person head if occupied */}
      {occupied && (
        <>
          <circle cx="40" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
          {/* Ears */}
          <ellipse cx="31" cy="12" rx="3" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
          <ellipse cx="49" cy="12" rx="3" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
        </>
      )}
    </svg>
  );
}

export function SalonQueueView() {
  const { user, profile } = useAuth();
  const [chairs, setChairs] = useState<SalonChair[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const hostelBlocks = normalizeHostelBlock(profile?.hostel_block);
  const hostelPair = getHostelPair(hostelBlocks);

  const fetchData = async () => {
    if (hostelPair.length === 0) { setLoading(false); return; }

    const [chairsRes, queueRes] = await Promise.all([
      supabase.from('salon_chairs').select('*').in('hostel_block', hostelPair).order('chair_number'),
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
  }, [hostelPair.join(',')]);

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

  if (hostelPair.length === 0) {
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
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Salon Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {/* Mirror bar */}
          <div className="bg-foreground rounded-md h-6 flex items-center justify-center mb-6">
            <span className="text-xs font-semibold tracking-widest uppercase text-background">Mirror</span>
          </div>

          {/* Hostel rows */}
          <div className="space-y-8">
            {hostelPair.map((hostel, idx) => {
              const hostelChairs = chairs.filter(c => c.hostel_block === hostel);
              // Pad to 3 chairs for layout consistency
              const displayChairs = hostelChairs.length > 0 ? hostelChairs : Array.from({ length: 3 }, (_, i) => ({
                id: `empty-${hostel}-${i}`,
                hostel_block: hostel,
                chair_number: i + 1,
                barber_id: null,
                barber_name: null,
                is_active: false,
              } as SalonChair));

              return (
                <div key={hostel} className="flex items-start gap-4">
                  {/* Hostel label */}
                  <div className="flex-shrink-0 w-24 pt-6">
                    <div className="border border-border rounded px-2 py-1 text-center">
                      <span className="text-xs font-bold tracking-wide">
                        {hostel.replace('Hostel ', 'HOSTEL:')}
                      </span>
                    </div>
                  </div>

                  {/* Chairs row */}
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    {displayChairs.map(chair => {
                      const chairQueue = queue.filter(q => q.chair_id === chair.id && q.status === 'waiting');
                      const inService = queue.find(q => q.chair_id === chair.id && q.status === 'in_service');
                      const isOccupied = !!inService || chair.is_active;
                      const isMyQueue = myQueueEntry?.chair_id === chair.id;
                      const myPosition = isMyQueue ? myQueueEntry?.position : null;

                      return (
                        <div key={chair.id} className="flex flex-col items-center space-y-2">
                          {/* Chair illustration */}
                          <ChairSVG occupied={!!inService} facing="down" />

                          {/* Chair number */}
                          <div className="border border-border rounded px-4 py-1 text-center min-w-[60px]">
                            <span className="font-semibold text-sm">{chair.chair_number}.</span>
                          </div>

                          {/* Barber name */}
                          <div className="text-xs text-muted-foreground truncate max-w-full text-center">
                            {chair.is_active ? chair.barber_name : 'Vacant'}
                          </div>

                          {/* Queue info & actions */}
                          {chair.is_active && (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span>{chairQueue.length} waiting</span>
                              </div>

                              {isMyQueue && (
                                <div className="space-y-1 text-center">
                                  <Badge variant="default" className="text-xs">#{myPosition}</Badge>
                                  <Button size="sm" variant="destructive" className="w-full text-xs h-7" onClick={leaveQueue}>
                                    <LogOut className="w-3 h-3 mr-1" /> Leave
                                  </Button>
                                </div>
                              )}

                              {!isMyQueue && !myQueueEntry && (
                                <Button size="sm" className="text-xs h-7" onClick={() => joinQueue(chair.id)}>
                                  Join Queue
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
