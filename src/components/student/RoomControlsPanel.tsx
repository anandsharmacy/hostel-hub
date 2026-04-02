import { useCallback, useEffect, useMemo, useState } from 'react';
import { Wifi, WifiOff, Lightbulb, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getRoomControls, provisionRoomControls, toggleRoomDevice, type RoomDevice, type RoomGateway } from '@/lib/roomControlService';
import { RoomControlCard } from './RoomControlCard';
import { toast } from 'sonner';

function isGatewayConnected(gateway: RoomGateway | null) {
  if (!gateway?.last_seen) return false;
  return Date.now() - new Date(gateway.last_seen).getTime() < 5 * 60 * 1000;
}

function formatHeartbeat(lastSeen: string | null) {
  if (!lastSeen) return 'No heartbeat yet';

  const deltaMinutes = Math.max(0, Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000));
  if (deltaMinutes < 1) return 'Updated just now';
  if (deltaMinutes === 1) return 'Updated 1 min ago';
  return `Updated ${deltaMinutes} mins ago`;
}

export function RoomControlsPanel() {
  const { session, profile, isLoading: authLoading } = useAuth();
  const [gateway, setGateway] = useState<RoomGateway | null>(null);
  const [devices, setDevices] = useState<RoomDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeviceId, setPendingDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hostelBlock = profile?.hostel_block?.trim() ?? null;
  const roomNumber = profile?.room_number?.trim() ?? null;
  const canLoad = Boolean(session?.access_token && hostelBlock && roomNumber);

  const loadControls = useCallback(async () => {
    if (!hostelBlock || !roomNumber) return;

    setLoading(true);
    setError(null);
    try {
      let payload = await getRoomControls(hostelBlock, roomNumber);

      if (import.meta.env.DEV) {
        console.debug('[RoomControlsPanel] initial payload', payload);
      }

      // Auto-provision if no gateway exists yet
      if (!payload.gateway) {
        await provisionRoomControls();
        payload = await getRoomControls(hostelBlock, roomNumber);

        if (import.meta.env.DEV) {
          console.debug('[RoomControlsPanel] payload after provisioning', payload);
        }
      }

      setGateway(payload.gateway);
      setDevices(payload.devices);

      if (import.meta.env.DEV) {
        console.debug('[RoomControlsPanel] state update', {
          gateway: payload.gateway?.id,
          deviceCount: payload.devices.length,
          devices: payload.devices.map((device) => ({
            name: device.name,
            slug: device.slug,
            sinric_device_id: device.sinric_device_id,
            power_state: device.power_state,
          })),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load room controls';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [hostelBlock, roomNumber]);

  useEffect(() => {
    if (authLoading) return;
    if (!canLoad) {
      setLoading(false);
      return;
    }

    loadControls();
  }, [authLoading, canLoad, loadControls]);

  useEffect(() => {
    if (!canLoad) return;

    const channel = supabase
      .channel('student-room-controls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_gateways' }, () => loadControls())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_devices' }, () => loadControls())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canLoad, loadControls]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    console.debug('[RoomControlsPanel] render state', {
      gatewayId: gateway?.id,
      gatewaySeen: gateway?.last_seen,
      deviceCount: devices.length,
      devices: devices.map((device) => ({
        name: device.name,
        slug: device.slug,
        sinric_device_id: device.sinric_device_id,
        power_state: device.power_state,
      })),
    });
  }, [gateway, devices]);

  const handleToggle = useCallback(async (device: RoomDevice, nextState: boolean) => {
    if (!session?.access_token) return;

    const previousDevices = devices;
    setPendingDeviceId(device.id);
    setDevices((current) => current.map((item) => (item.id === device.id ? { ...item, power_state: nextState } : item)));

    try {
      await toggleRoomDevice({ token: session.access_token, roomDeviceId: device.id, powerState: nextState });
      toast.success(`${device.name} turned ${nextState ? 'on' : 'off'}`);
    } catch (error) {
      setDevices(previousDevices);
      toast.error(error instanceof Error ? error.message : 'Failed to change the device state');
    } finally {
      setPendingDeviceId(null);
    }
  }, [devices, session?.access_token]);

  const connectionOnline = useMemo(() => isGatewayConnected(gateway), [gateway]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-14">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.hostel_block || !profile?.room_number) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Room Controls need both hostel block and room number on your profile before devices can be provisioned.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-14">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadControls}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Room Controls</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Live controls for {hostelBlock} room {roomNumber}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadControls}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/30 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${connectionOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
              <div className="flex items-center gap-2 text-sm text-foreground">
                {connectionOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-slate-500" />}
                <span className="font-medium">{gateway?.name || 'Gateway NodeMCU-1'}:</span>
                <span className={connectionOnline ? 'text-green-700' : 'text-slate-600'}>
                  {connectionOnline ? 'Connected' : gateway?.connection_state || 'Offline'}
                </span>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{formatHeartbeat(gateway?.last_seen || null)}</span>
          </div>
        </CardContent>
      </Card>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No room control devices have been provisioned yet for this room.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {devices.map((device) => (
            <RoomControlCard
              key={device.id}
              device={device}
              pending={pendingDeviceId === device.id}
              onToggle={(nextState) => handleToggle(device, nextState)}
            />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 text-primary" />
          <p>
            Physical switch changes on the NodeMCU sync back to this panel automatically via the Sinric event bridge. Devices showing "Not configured" need their Sinric device ID set by an administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
