import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
  expires_at: string | null;
}

export function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, message, created_at, expires_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Filter expired announcements client-side as well
        const activeAnnouncements = data.filter((a) => {
          if (!a.expires_at) return true;
          return new Date(a.expires_at) > new Date();
        });
        setAnnouncements(activeAnnouncements);
      }
      setIsLoading(false);
    };

    fetchAnnouncements();
  }, []);

  if (isLoading || announcements.length === 0 || !isVisible) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? announcements.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === announcements.length - 1 ? 0 : prev + 1));
  };

  return (
    <Card className="bg-primary/5 border-primary/20 mb-6">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">{currentAnnouncement.title}</h4>
              <Badge variant="secondary" className="text-xs">
                {format(new Date(currentAnnouncement.created_at), 'MMM d')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {currentAnnouncement.message}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {announcements.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                  {currentIndex + 1}/{announcements.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
