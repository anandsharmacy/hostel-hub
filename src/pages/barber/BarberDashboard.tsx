import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Armchair, User, Users, CheckCircle, Play } from 'lucide-react';

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
  joined_at: string;
}

const HOSTELS = ['Hostel B1', 'Hostel B2', 'Hostel G1', 'Hostel G2'];

export default function BarberDashboard() {
  const { user, profile } = useAuth();
  const [chairs, setChairs] = useState<SalonChair[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const myChair = chairs.find(c => c.barber_id === user?.id && c.is_active);

  const fetchData = async () => {
    const [chairsRes, queueRes] = await Promise.all([
      supabase.from('salon_chairs').select('*').order('hostel_block').order('chair_number'),
      supabase.from('salon_queue').select('*').in('status', ['waiting', 'in_service']).order('position'),
    ]);
    if (chairsRes.data) setChairs(chairsRes.data as SalonChair[]);
    if (queueRes.data) setQueue(queueRes.data as QueueEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('barber-salon')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salon_chairs' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salon_queue' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const assignToChair = async (chairId: string) => {
    if (myChair) {
      toast.error('You are already assigned to a chair. Release it first.');
      return;
    }
    const { error } = await supabase
      .from('salon_chairs')
      .update({ barber_id: user?.id, barber_name: profile?.full_name || 'Barber', is_active: true })
      .eq('id', chairId);
    if (error) toast.error('Failed to assign chair');
    else toast.success('Assigned to chair!');
  };

  const releaseChair = async () => {
    if (!myChair) return;
    const { error } = await supabase
      .from('salon_chairs')
      .update({ barber_id: null, barber_name: null, is_active: false })
      .eq('id', myChair.id);
    if (error) toast.error('Failed to release chair');
    else toast.success('Chair released');
  };

  const markInService = async (entryId: string) => {
    const { error } = await supabase
      .from('salon_queue')
      .update({ status: 'in_service' })
      .eq('id', entryId);
    if (error) toast.error('Failed to update');
  };

  const markCompleted = async (entryId: string) => {
    const { error } = await supabase
      .from('salon_queue')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', entryId);
    if (error) toast.error('Failed to update');
    else toast.success('Service completed!');
  };

  const myQueue = myChair ? queue.filter(q => q.chair_id === myChair.id) : [];

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Barber Dashboard</h1>
          <p className="page-subtitle">Manage your salon chair and queue</p>
        </div>

        {myChair && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Active Chair</CardTitle>
                <Button variant="destructive" size="sm" onClick={releaseChair}>Release Chair</Button>
              </div>
              <p className="text-sm text-muted-foreground">{myChair.hostel_block} — Chair {myChair.chair_number}</p>
            </CardHeader>
            <CardContent>
              <h3 className="font-medium mb-3">Queue ({myQueue.length})</h3>
              {myQueue.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students in queue</p>
              ) : (
                <div className="space-y-2">
                  {myQueue.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">#{entry.position}</span>
                        <User className="w-4 h-4" />
                        <span className="font-medium">{entry.student_name}</span>
                        <Badge variant={entry.status === 'in_service' ? 'default' : 'secondary'}>
                          {entry.status === 'in_service' ? 'In Service' : 'Waiting'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {entry.status === 'waiting' && (
                          <Button size="sm" variant="outline" onClick={() => markInService(entry.id)}>
                            <Play className="w-3 h-3 mr-1" /> Start
                          </Button>
                        )}
                        {entry.status === 'in_service' && (
                          <Button size="sm" onClick={() => markCompleted(entry.id)}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Done
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {HOSTELS.map(hostel => {
            const hostelChairs = chairs.filter(c => c.hostel_block === hostel);
            return (
              <Card key={hostel}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Armchair className="w-5 h-5" />
                    {hostel} Salon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {hostelChairs.map(chair => {
                      const chairQueue = queue.filter(q => q.chair_id === chair.id);
                      const isMyChair = chair.barber_id === user?.id;
                      return (
                        <div
                          key={chair.id}
                          className={`p-3 rounded-lg border text-center space-y-2 ${
                            isMyChair ? 'border-primary bg-primary/5' : chair.is_active ? 'bg-muted/50' : ''
                          }`}
                        >
                          <div className="text-xs text-muted-foreground">Chair {chair.chair_number}</div>
                          <Armchair className={`w-8 h-8 mx-auto ${chair.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="text-sm font-medium truncate">
                            {chair.barber_name || 'Vacant'}
                          </div>
                          {chair.is_active && (
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" /> {chairQueue.length}
                            </div>
                          )}
                          {!chair.is_active && !myChair && (
                            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => assignToChair(chair.id)}>
                              Sit Here
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
