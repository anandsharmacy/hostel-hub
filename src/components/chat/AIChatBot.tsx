import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, House } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { VoiceInput } from './VoiceInput';
import { streamChat, type ChatMessage } from '@/lib/chatService';
import { cn } from '@/lib/utils';

const welcomeMessages: Record<string, string> = {
  student:
    "Hi! 👋 I can help you book cleaning, order from the store, file complaints, or request medicine. Try typing or use the mic!",
  admin:
    "Hello! I can help you review and manage service requests. Ask me anything about the dashboard.",
  vendor:
    "Hi! I can help you with order management, inventory, and announcements.",
  super_user:
    "Hello! I can assist with system oversight and user management.",
};

const insightCards: Record<string, Array<{ label: string; value: string }>> = {
  student: [
    { label: 'Upcoming Meeting', value: '10:00 AM' },
    { label: 'Daily Insights', value: 'Health & Productivity' },
    { label: 'Smart Home Control', value: 'Active' },
  ],
  admin: [
    { label: 'Pending Reviews', value: 'Dashboard Ready' },
    { label: 'Daily Insights', value: 'Operations Overview' },
    { label: 'System Health', value: 'Stable' },
  ],
  vendor: [
    { label: 'Store Updates', value: 'Orders in Queue' },
    { label: 'Daily Insights', value: 'Inventory Signals' },
    { label: 'Service Status', value: 'Active' },
  ],
  super_user: [
    { label: 'Governance Pulse', value: 'Platform Supervision' },
    { label: 'Daily Insights', value: 'Security & Access' },
    { label: 'Control Center', value: 'Active' },
  ],
};

export function AIChatBot() {
  const { role, session, profile, isLoading: authLoading } = useAuth();
  const { refetchData } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Wait for auth to finish loading before checking token
      let activeToken = session?.access_token;

      if (!activeToken) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: getSessionData } = await supabase.auth.getSession();
          activeToken = getSessionData.session?.access_token;

          if (!activeToken) {
            const { data: refreshed } = await supabase.auth.refreshSession();
            activeToken = refreshed.session?.access_token || undefined;
          }
        } catch (err) {
          console.error('Token fetch error:', err);
        }
      }

      if (!activeToken) {
        // Only show login error if auth has fully loaded (not a timing issue)
        if (!authLoading) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: '⚠️ Please log in to use the chatbot.' },
          ]);
        }
        return;
      }

      const userMsg: ChatMessage = { role: 'user', content: text.trim() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput('');
      setIsLoading(true);

      let assistantSoFar = '';

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      await streamChat({
        messages: newMessages,
        token: activeToken,
        onDelta: upsertAssistant,
        onDone: () => {
          setIsLoading(false);
          // Refetch data so new requests appear in My Requests
          refetchData();
        },
        onError: (error) => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `⚠️ ${error}` },
          ]);
          setIsLoading(false);
        },
      });
    },
    [messages, isLoading, authLoading, session, refetchData]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const resetConversation = () => {
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  const welcome = welcomeMessages[role || 'student'];
  const cards = insightCards[role || 'student'];
  const firstName = profile?.full_name?.trim().split(' ')[0] || 'there';

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="assistant-launcher fixed bottom-6 right-6 z-50"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="assistant-shell fixed inset-0 z-50 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[390px] sm:h-[620px] flex flex-col animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="assistant-header flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="assistant-mini-orb">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-sm text-foreground">AI Assistant</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full hover:bg-background/70"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-4 animate-liquid-rise pb-2">
                <div className="assistant-greeting">
                  <p className="text-2xl font-semibold leading-tight text-foreground">Good morning, {firstName}.</p>
                  <p className="text-muted-foreground mt-1">Ready for today?</p>
                </div>

                <div className="assistant-orb-wrap">
                  <div className="assistant-orb">
                    <div className="assistant-wave" />
                  </div>
                </div>

                <div className="space-y-3">
                  {cards.map((card) => (
                    <div key={card.label} className="assistant-insight-card">
                      <p className="text-sm text-muted-foreground">{card.label}:</p>
                      <p className={cn('text-[1.15rem] font-semibold leading-tight', card.value === 'Active' ? 'text-primary' : 'text-foreground')}>
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Welcome */}
            <div className="flex gap-2">
              <div className="assistant-avatar">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="assistant-message assistant-message-bot">{welcome}</div>
            </div>

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}
              >
                <div className="assistant-avatar">
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4 text-primary" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div
                  className={cn(
                    'assistant-message',
                    msg.role === 'user'
                      ? 'assistant-message-user'
                      : 'assistant-message-bot'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2">
                <div className="assistant-avatar">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="assistant-message assistant-message-bot">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2">
            <form onSubmit={handleSubmit} className="assistant-dock">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={resetConversation}
                className="h-10 w-10 shrink-0 rounded-full text-primary hover:bg-primary/15"
                title="Reset conversation"
              >
                <House className="h-5 w-5" />
              </Button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="assistant-input"
              />

              {!input.trim() ? (
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  disabled={isLoading}
                  className="assistant-mic-btn"
                />
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="assistant-send-btn"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
