import { useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlipTimePickerProps {
  label: string;
  hour: number; // 8-17 in 24h
  onChange: (hour: number) => void;
  min?: number;
  max?: number;
}

export function FlipTimePicker({ label, hour, onChange, min = 8, max = 17 }: FlipTimePickerProps) {
  const display12 = hour % 12 || 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayStr = String(display12).padStart(2, '0');

  const increment = useCallback(() => {
    if (hour < max) onChange(hour + 1);
  }, [hour, max, onChange]);

  const decrement = useCallback(() => {
    if (hour > min) onChange(hour - 1);
  }, [hour, min, onChange]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        {/* Hour display */}
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={increment}
            disabled={hour >= max}
            className="p-1 rounded-md hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className={cn(
            "relative w-16 h-16 rounded-xl flex items-center justify-center",
            "bg-card border-2 border-border shadow-md",
            "select-none"
          )}>
            {/* Flip line */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-border/50" />
            <span className="text-3xl font-bold tabular-nums text-foreground">{displayStr}</span>
          </div>
          <button
            type="button"
            onClick={decrement}
            disabled={hour <= min}
            className="p-1 rounded-md hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* AM/PM badge */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => { if (hour < 12 && hour + 12 <= max) onChange(hour + 12); }}
            className={cn(
              "px-2 py-0.5 rounded text-xs font-semibold transition-colors",
              ampm === 'PM' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            disabled={hour >= 12}
          >
            PM
          </button>
          <button
            type="button"
            onClick={() => { if (hour >= 12 && hour - 12 >= min) onChange(hour - 12); }}
            className={cn(
              "px-2 py-0.5 rounded text-xs font-semibold transition-colors",
              ampm === 'AM' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            disabled={hour < 12}
          >
            AM
          </button>
        </div>
      </div>
    </div>
  );
}
