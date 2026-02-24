import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Megaphone, Plus, Edit2, Trash2, Calendar, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, isAfter } from 'date-fns';

interface Announcement {
  id: string;
  vendor_id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  updated_at: string;
  target_audience: string;
}

type TargetAudience = 'students' | 'vendors' | 'both';

const audienceLabels: Record<TargetAudience, string> = {
  students: 'Students',
  vendors: 'Vendors',
  both: 'Both',
};

const audienceBadgeVariant = (audience: string) => {
  switch (audience) {
    case 'students': return 'default' as const;
    case 'vendors': return 'secondary' as const;
    case 'both': return 'outline' as const;
    default: return 'outline' as const;
  }
};

export function AdminAnnouncementManager() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    expires_at: '',
    target_audience: 'students' as TargetAudience,
  });

  const fetchAnnouncements = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } else {
      setAnnouncements(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [user]);

  const resetForm = () => {
    setFormData({ title: '', message: '', expires_at: '', target_audience: 'students' });
    setEditingAnnouncement(null);
  };

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        message: announcement.message,
        expires_at: announcement.expires_at
          ? format(new Date(announcement.expires_at), "yyyy-MM-dd'T'HH:mm")
          : '',
        target_audience: (announcement.target_audience || 'students') as TargetAudience,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const announcementData = {
      title: formData.title.trim(),
      message: formData.message.trim(),
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      vendor_id: user.id,
      target_audience: formData.target_audience,
    };

    if (editingAnnouncement) {
      const { error } = await supabase
        .from('announcements')
        .update(announcementData)
        .eq('id', editingAnnouncement.id);
      if (error) {
        toast.error('Failed to update announcement');
      } else {
        toast.success('Announcement updated successfully');
        handleCloseDialog();
        fetchAnnouncements();
      }
    } else {
      const { error } = await supabase.from('announcements').insert(announcementData);
      if (error) {
        toast.error('Failed to create announcement');
      } else {
        toast.success('Announcement created successfully');
        handleCloseDialog();
        fetchAnnouncements();
      }
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: !announcement.is_active })
      .eq('id', announcement.id);
    if (error) {
      toast.error('Failed to update announcement status');
    } else {
      toast.success(`Announcement ${announcement.is_active ? 'deactivated' : 'activated'}`);
      fetchAnnouncements();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete announcement');
    } else {
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return !isAfter(new Date(expiresAt), new Date());
  };

  const activeCount = announcements.filter(a => a.is_active && !isExpired(a.expires_at)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Announcements
          </h2>
          <p className="text-muted-foreground mt-1">
            Broadcast messages to students and vendors
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Announcement title"
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Write your announcement message here..."
                  required
                  rows={4}
                  maxLength={1000}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <RadioGroup
                  value={formData.target_audience}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, target_audience: val as TargetAudience }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="students" id="audience-students" />
                    <Label htmlFor="audience-students" className="cursor-pointer">Students</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vendors" id="audience-vendors" />
                    <Label htmlFor="audience-vendors" className="cursor-pointer">Vendors</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="audience-both" />
                    <Label htmlFor="audience-both" className="cursor-pointer">Both</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                />
                <p className="text-xs text-muted-foreground">Leave empty for no expiration</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                <Button type="submit">{editingAnnouncement ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Announcements</p>
                <p className="text-2xl font-bold">{announcements.length}</p>
              </div>
              <Megaphone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive/Expired</p>
                <p className="text-2xl font-bold text-muted-foreground">{announcements.length - activeCount}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">No announcements yet</h3>
            <p className="text-muted-foreground mt-1">Create your first announcement</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const expired = isExpired(announcement.expires_at);
            const isCurrentlyActive = announcement.is_active && !expired;

            return (
              <Card key={announcement.id} className={!isCurrentlyActive ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        {announcement.title}
                        {isCurrentlyActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : expired ? (
                          <Badge variant="secondary">Expired</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                        <Badge variant={audienceBadgeVariant(announcement.target_audience)}>
                          <Users className="h-3 w-3 mr-1" />
                          {audienceLabels[announcement.target_audience as TargetAudience] || announcement.target_audience}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                        </span>
                        {announcement.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires: {format(new Date(announcement.expires_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={announcement.is_active}
                        onCheckedChange={() => handleToggleActive(announcement)}
                        disabled={expired}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(announcement)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(announcement.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{announcement.message}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
