import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
  expires_at: string | null;
  target_audience: string;
}

interface NotificationsSectionProps {
  role: 'students' | 'vendors';
}

export function NotificationsSection({ role }: NotificationsSectionProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, message, created_at, expires_at, target_audience')
        .eq('is_active', true)
        .in('target_audience', [role, 'both'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        const active = data.filter((a) => {
          if (!a.expires_at) return true;
          return new Date(a.expires_at) > new Date();
        });
        setAnnouncements(active);
      }
      setIsLoading(false);
    };

    fetchAnnouncements();
  }, [role]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" text="Loading notifications..." />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1">No notifications</h3>
          <p className="text-sm text-muted-foreground">You're all caught up! New announcements will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className="hover:shadow-md transition-shadow">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-semibold text-foreground">{announcement.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                  </Badge>
                  {announcement.target_audience === 'both' && (
                    <Badge variant="outline" className="text-xs">Everyone</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {announcement.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
