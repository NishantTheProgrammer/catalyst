'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, User, CornerDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  text: string;
  isBot: boolean;
};

const SUGGESTED_PROMPTS = [
  'Which tickets have high defect risk?',
  'Summarize active sprint bottlenecks',
  'What are the most frequent root causes?',
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm **Catalyst AI**, your LangGraph multi-agent copilot. Ask me anything about Jira tickets, quality scores, sprint risks, or defect trends!",
      isBot: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), text: textToSend, isBot: false };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== '1')
        .map((m) => ({
          role: m.isBot ? 'assistant' : 'user',
          content: m.text,
        }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.text, history }),
      });

      if (!res.ok) throw new Error('Server error');
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      const botMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: botMsgId, text: '', isBot: true }]);

      let done = false;
      let firstChunk = true;
      let streamedText = '';
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (firstChunk) {
          setLoading(false);
          firstChunk = false;
        }
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          streamedText += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, text: streamedText } : m))
          );
        }
      }

      if (!streamedText) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: 'No response received from the model. Please verify your LLM settings in Settings.',
                }
              : m
          )
        );
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'An error occurred while communicating with the AI backend. Please verify your backend server is running.',
        isBot: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white z-50 cursor-pointer border border-white/20"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.5)',
            }}
            aria-label="Open AI Copilot"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-5 right-5 w-[calc(100vw-2.5rem)] sm:w-[420px] h-[560px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-white/10 text-white"
            style={{
              background: 'rgba(15, 15, 30, 0.98)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px -10px rgba(99, 102, 241, 0.3)',
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shadow-inner"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    Catalyst Copilot
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">LangGraph Multi-Agent RAG</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-black/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[88%] text-xs sm:text-sm leading-relaxed ${
                      msg.isBot
                        ? 'p-3.5 rounded-2xl rounded-tl-none bg-white/[0.04] border border-white/10 text-slate-200 shadow-sm'
                        : 'px-4 py-2.5 rounded-2xl rounded-tr-none bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    {msg.isBot ? (
                      <div className="prose prose-invert max-w-none text-xs sm:text-sm">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a className="text-indigo-400 hover:underline" target="_blank" {...props} />
                            ),
                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                            li: ({ node, ...props }) => <li className="text-slate-300" {...props} />,
                            code: ({ node, children, ...props }: any) => (
                              <code className="bg-black/40 text-indigo-300 px-1 py-0.5 rounded text-[11px] font-mono" {...props}>
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
                    <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts (when only initial message is present) */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01] flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-full text-left transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3.5 border-t border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask copilot about tickets, risks, defects..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-md shadow-indigo-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
