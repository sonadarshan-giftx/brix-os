import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, Bot, User, Zap, Code, FileText,
  BarChart3, ChevronRight, Wand2, Lightbulb,
} from 'lucide-react';
import { trpc } from '@/providers/trpc';

interface CopilotMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const suggestedActions = [
  { icon: <Code size={14} />, label: 'Review my code', prompt: 'Can you review the latest PR for potential issues?' },
  { icon: <BarChart3 size={14} />, label: 'Sprint report', prompt: 'Generate a summary of Sprint 14 progress' },
  { icon: <FileText size={14} />, label: 'Write docs', prompt: 'Help me write API documentation for the auth endpoints' },
  { icon: <Zap size={14} />, label: 'Optimize', prompt: 'Suggest performance optimizations for the dashboard' },
];

const quickResponses: Record<string, string> = {
  'sprint': 'Sprint 14 Status:\n\n✅ Velocity: 42 story points (+12% vs avg)\n✅ Completion: 38/42 tickets (90%)\n⚠️ 2 tickets at risk (API latency, design tokens)\n👥 Team capacity: 94% utilized\n\nRecommendation: Focus on the 2 at-risk tickets. Echo can handle the API fix autonomously.',
  'code': 'I have reviewed the latest PR (#347). Here is my analysis:\n\n✅ Clean architecture, good separation of concerns\n✅ Test coverage: 94% (excellent)\n⚠️ One potential N+1 query in the user loader\n⚠️ Missing input validation on the batch endpoint\n\nOverall: LGTM with minor fixes. I can apply the fixes if you approve.',
  'docs': 'Here is a draft for the Auth API docs:\n\n**POST /api/v1/auth/login**\n- Body: { email, password, mfaToken? }\n- Returns: { token, refreshToken, expiresIn }\n- Errors: 401 (invalid credentials), 429 (rate limited)\n\n**POST /api/v1/auth/refresh**\n- Body: { refreshToken }\n- Returns: { token, expiresIn }\n\nWant me to expand any section?',
  'optimize': 'Dashboard Performance Analysis:\n\n1. **Bundle size**: 1.45MB → target <1MB (code split Charts)\n2. **LCP**: 2.1s → lazy load below-fold content\n3. **Re-renders**: Mission tab re-renders 3x per switch → memoize KPI cards\n4. **API calls**: 14 parallel on load → batch into 3 groups\n\nExpected improvement: 40% faster load time.',
};

export function AiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    { id: 'welcome', role: 'ai', content: 'Hello! I am your AI Copilot. I can help with code reviews, sprint reports, documentation, and more. What would you like to work on?', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const generate = trpc.ai.generateResponse.useMutation();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: CopilotMessage = { id: `u-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Try AI endpoint first, fall back to static responses
    try {
      const result = await generate.mutateAsync({ prompt: text.trim() });
      if (result && result.response) {
        const aiMsg: CopilotMessage = { id: `a-${Date.now()}`, role: 'ai', content: result.response, timestamp: new Date() };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }
    } catch {
      // Fallback to static responses
    }

    // Static fallback
    setTimeout(() => {
      const lower = text.toLowerCase();
      let response = 'I understand. Let me analyze that for you. Based on the current context of BrixOS, I can see we have 9 team members (5 AI agents), 3 active projects, and Sprint 14 is at 90% completion. What specific aspect would you like me to focus on?';

      if (lower.includes('sprint') || lower.includes('report') || lower.includes('progress')) response = quickResponses['sprint'];
      else if (lower.includes('code') || lower.includes('review') || lower.includes('pr')) response = quickResponses['code'];
      else if (lower.includes('doc') || lower.includes('write') || lower.includes('documentation')) response = quickResponses['docs'];
      else if (lower.includes('optim') || lower.includes('performance') || lower.includes('speed')) response = quickResponses['optimize'];

      const aiMsg: CopilotMessage = { id: `a-${Date.now()}`, role: 'ai', content: response, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
            style={{ backgroundColor: '#D97757' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="AI Copilot"
          >
            <Sparkles size={24} color="white" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">1</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{ width: 400, height: 540, backgroundColor: '#ffffff' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: '#e1e1e1', backgroundColor: '#fafafa' }}>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: '#D97757' }}>
                  <Sparkles size={16} color="white" />
                </div>
                <div>
                  <span className="text-sm font-bold" style={{ color: '#252422' }}>AI Copilot</span>
                  <span className="ml-2 rounded px-1 py-0.5 text-[8px] font-bold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>ONLINE</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded p-1 hover:bg-gray-200"><X size={16} style={{ color: '#767676' }} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`mb-3 flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${msg.role === 'ai' ? '' : ''}`} style={{ backgroundColor: msg.role === 'ai' ? '#D97757' : '#e0e7ff' }}>
                    {msg.role === 'ai' ? <Bot size={14} color="white" /> : <User size={14} style={{ color: '#D97757' }} />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${msg.role === 'ai' ? '' : ''}`} style={{
                    backgroundColor: msg.role === 'ai' ? '#f8f8fb' : '#D97757',
                    color: msg.role === 'ai' ? '#333' : '#ffffff',
                    border: msg.role === 'ai' ? '1px solid #e1e1e1' : 'none',
                    borderLeft: msg.role === 'ai' ? '3px solid #D97757' : 'none',
                  }}>
                    {msg.content.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="mb-3 flex gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: '#D97757' }}>
                    <Bot size={14} color="white" />
                  </div>
                  <div className="flex items-center gap-1 rounded-xl px-3 py-2" style={{ backgroundColor: '#f8f8fb', border: '1px solid #e1e1e1', borderLeft: '3px solid #D97757' }}>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ backgroundColor: '#D97757', animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ backgroundColor: '#D97757', animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ backgroundColor: '#D97757', animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />

              {/* Suggested actions */}
              {messages.length <= 2 && !isTyping && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {suggestedActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.prompt)}
                      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-medium transition-colors hover:bg-gray-50"
                      style={{ borderColor: '#e1e1e1', color: '#D97757' }}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t px-3 py-2.5" style={{ borderColor: '#e1e1e1' }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(input); }}
                  placeholder="Ask me anything..."
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: '#f5f5f5', border: '1px solid #e1e1e1' }}
                />
                <button onClick={() => handleSend(input)} className="rounded-lg p-2 text-white hover:opacity-90" style={{ backgroundColor: '#D97757' }}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
