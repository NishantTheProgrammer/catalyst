"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  text: string;
  isBot: boolean;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hi! I'm your Catelyst AI assistant. Ask me anything about your project's Jira tickets, defects, or risks!", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), text: input, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== "1") // Skip the hardcoded greeting
        .map(m => ({
          role: m.isBot ? "assistant" : "user",
          content: m.text
        }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg.text, history })
      });
      
      if (!res.ok) throw new Error("Server error");
      if (!res.body) throw new Error("No response body");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, text: "", isBot: true }]);

      let done = false;
      let firstChunk = true;
      let streamedText = "";
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
          setMessages(prev => prev.map(m => 
            m.id === botMsgId ? { ...m, text: streamedText } : m
          ));
        }
      }
      
      if (!streamedText) {
          setMessages(prev => prev.map(m => 
            m.id === botMsgId ? { ...m, text: "No response received from the AI model. (This may be a safety filter, rate limit, or invalid model name)." } : m
          ));
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = { id: (Date.now() + 1).toString(), text: "An error occurred while reaching the AI server.", isBot: true };
      setMessages(prev => [...prev, errorMsg]);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-110 z-50 animate-bounce-slow"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] max-h-[80vh] bg-background/50 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-primary/10 border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Catelyst AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.isBot ? "bg-secondary text-secondary-foreground rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none"}`}>
                  {msg.isBot ? (
                    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-sm">
                      <ReactMarkdown
                        components={{
                          a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} />
                        }}
                      >{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm bg-secondary text-secondary-foreground rounded-tl-none flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
                  <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
                  <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background/40">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about project risks..."
                className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
