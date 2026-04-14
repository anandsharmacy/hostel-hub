import { useState, useCallback } from 'react';
import { Mic, MicOff, X, Loader2, PhoneOff } from 'lucide-react';
import { 
  LiveKitRoom, 
  AudioConference, 
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { startVoiceSession, StartSessionResponse } from '@/lib/voiceAssistantService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<StartSessionResponse | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleStartSession = async () => {
    try {
      setIsConnecting(true);
      const data = await startVoiceSession();
      setSession(data);
      setIsOpen(true);
    } catch (error: any) {
      console.error("Failed to start voice session:", error);
      toast({
        title: "Voice Assistant Error",
        description: error.message || "Make sure the voice backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = useCallback(() => {
    setSession(null);
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Floating launcher */}
      {!isOpen && (
        <button
          onClick={handleStartSession}
          disabled={isConnecting}
          className={cn(
            "fixed bottom-6 right-24 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 disabled:opacity-70",
            isConnecting && "animate-pulse"
          )}
          aria-label="Start Voice Assistant"
        >
          {isConnecting ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </button>
      )}

      {/* Voice Session Interface */}
      {isOpen && session && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[320px]">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-2xl animate-in fade-in zoom-in duration-300">
            <LiveKitRoom
              video={false}
              audio={true}
              token={session.token}
              serverUrl={session.url}
              onDisconnected={handleDisconnect}
              className="flex flex-col p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Voice Assistant Live</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDisconnect()}
                  className="rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative mb-6">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                    <Mic className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Listening and ready to help with your hostel needs.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full rounded-xl gap-2"
                  onClick={() => handleDisconnect()}
                >
                  <PhoneOff className="h-4 w-4" />
                  End Session
                </Button>
              </div>

              {/* LiveKit Audio Components */}
              <AudioConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          </div>
        </div>
      )}
    </>
  );
}
