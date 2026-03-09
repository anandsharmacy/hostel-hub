import { Lightbulb, LampDesk, Fan, PlugZap, Radio } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { RoomDevice } from '@/lib/roomControlService';

const iconMap = {
  light: Lightbulb,
  lamp: LampDesk,
  fan: Fan,
  outlet: PlugZap,
} as const;

function getDeviceIcon(type: string) {
  return iconMap[type as keyof typeof iconMap] || Lightbulb;
}

interface RoomControlCardProps {
  device: RoomDevice;
  pending: boolean;
  onToggle: (nextState: boolean) => void;
}

export function RoomControlCard({ device, pending, onToggle }: RoomControlCardProps) {
  const Icon = getDeviceIcon(device.appliance_type);
  const isConfigured = Boolean(device.sinric_device_id);

  return (
    <Card className={`border-border/80 shadow-sm transition-shadow hover:shadow-md ${!isConfigured ? 'opacity-60' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{device.name}</h3>
              <p className="text-sm text-muted-foreground">NodeMCU-Relay</p>
            </div>
          </div>
          {isConfigured ? (
            <Badge
              variant={device.power_state ? 'default' : 'secondary'}
              className={device.power_state ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-rose-100 text-rose-700 hover:bg-rose-100'}
            >
              {device.power_state ? 'ON' : 'OFF'}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-300 text-amber-600">
              Not configured
            </Badge>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-6">
          <div className="space-y-1 text-sm">
            <p className="text-foreground">Relay {device.relay_label}: {device.power_rating_watts}W</p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Radio className="h-4 w-4 text-green-600" />
              Manual switch: {device.switch_pin}
            </p>
          </div>
          <Switch checked={device.power_state} disabled={pending || !isConfigured} onCheckedChange={onToggle} />
        </div>
      </CardContent>
    </Card>
  );
}
