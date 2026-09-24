import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  BookOpen,
  RotateCcw,
  Zap,
  Check,
  Copy,
  ChevronRight,
  Shield,
  MessageSquare,
  Compass,
  FileQuestion,
  Lightbulb,
  ExternalLink,
  Flame,
  Minus,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

const QUICK_PROMPTS = [
  {
    category: 'Website Guide',
    icon: Compass,
    label: 'How does the Mistake Vault work?',
    prompt: 'How does the Mistake Vault (نقاط الضعف) work and how can I practice questions until they are mastered?',
  },
  {
    category: 'Website Guide',
    icon: HelpCircle,
    label: 'Leaderboard & First-Attempt Rule',
    prompt: 'Explain the First-Attempt Rule on the Leaderboards and how student privacy is protected.',
  },
  {
    category: 'Clinical Query',
    icon: BookOpen,
    label: 'ENT: Carhart Notch vs Presbycusis',
    prompt: 'Explain Carhart notch in otosclerosis versus presbycusis on pure tone audiometry, with high-yield exam points.',
  },
  {
    category: 'Clinical Query',
    icon: Lightbulb,
    label: 'Pathology: Nephrotic vs Nephritic',
    prompt: 'Provide a high-yield comparison between Nephrotic and Nephritic syndromes with classic histological findings.',
  },
  {
    category: 'Clinical Query',
    icon: Flame,
    label: 'Community Med: Odds Ratio vs Relative Risk',
    prompt: 'Explain the difference between Odds Ratio (case-control) and Relative Risk (cohort study) with high-yield clinical examples for exams.',
  },
];

export const GeminiChatbot: React.FC<{
  isEmbedded?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
}> = ({ isEmbedded = false, onClose, onMinimize }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Salam Doctor ${user?.display_name || ''}! 👋 \n\nI am your **AWASI AI ASSISTANT**, powered by Gemini with high-throughput token capacity for Batch 99.\n\nI can help you:\n1. 🧭 **Master the Website**: Learn how to use Mocks, Flag Questions, practice your Mistake Vault, and navigate Subject Leaderboards.\n2. 🩺 **4th-Year Medical Inquiries**: Clarify clinical dilemmas, diagnostic criteria, MCQ explanations, and differential diagnoses across all curriculum disciplines (including Community Medicine, Pathology, Psychiatry, Radiology, and more).\n\nHow can I support your study session today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.1-flash-lite',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      // Prepare history payload
      const historyPayload = messages.slice(-10).map((m) => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        content: m.content,
      }));

      const res = await api.sendGeminiChatMessage({
        message: query,
        history: historyPayload,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Note**: ${
          err.message || 'Unable to connect to Gemini at this moment. Please check your network and try again.'
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Conversation reset. Feel free to ask any medical query or platform question!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'gemini-3.1-flash-lite',
        },
      ]);
    }
  };

  // Simple formatting helper for markdown-like text (bold, lists, code)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-xs md:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-bold text-slate-900 mt-2">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-base font-black text-slate-900 mt-3 mb-1">
                {line.replace('## ', '')}
              </h3>
            );
          }
          // Bullet point
          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            const content = line.replace(/^[•\-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-blue-600 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
              </div>
            );
          }
          // Numbered lists (1. , 2. )
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={idx} className="pl-1">
                <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
              </div>
            );
          }
          // Empty lines
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-200/80 text-blue-900 font-mono text-[11px]">$1</code>');
  };

  return (
    <div
      className={`flex flex-col bg-white overflow-hidden ${
        isEmbedded
          ? 'h-full w-full'
          : 'rounded-2xl border border-slate-200 shadow-xl max-w-4xl mx-auto h-[82vh]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-4 py-3.5 text-white flex items-center justify-between border-b border-blue-900/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black text-white leading-tight tracking-wide">
                AWASI AI ASSISTANT
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Batch 99 Tutor
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearChat}
            title="Clear Chat History"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {(onMinimize || onClose) && (
            <button
              onClick={onMinimize || onClose}
              title="Minimize Chat"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              title="Close Chat"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 transition-all shadow-xs relative group ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                {!isUser ? renderFormattedText(msg.content) : (
                  <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                )}

                {/* Footer metadata & copy action */}
                <div
                  className={`flex items-center justify-between gap-3 mt-2.5 pt-2 border-t text-[10px] ${
                    isUser
                      ? 'border-blue-500/50 text-blue-100'
                      : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{msg.timestamp}</span>
                    {!isUser && msg.modelUsed && (
                      <span>&bull; {msg.modelUsed}</span>
                    )}
                  </div>

                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="opacity-80 hover:opacity-100 inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-opacity"
                      title="Copy to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>Al-Awasi AI is reasoning &amp; reviewing clinical context...</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Starter Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2.5 bg-slate-100/70 border-t border-slate-200 overflow-x-auto">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Quick Starters:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {QUICK_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 text-xs font-medium whitespace-nowrap shadow-2xs transition-all"
                >
                  <Icon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about website features, 4th-year medical topics, clinical reasoning, or exam prep... (Enter to send)"
              className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs flex items-center justify-center"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
