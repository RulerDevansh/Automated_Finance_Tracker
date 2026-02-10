import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../utils/api.js';

const suggestions = [
  'Add expense 1200 food yesterday',
  'Set grocery budget 5000 this month',
  'Add income 25000 salary 1st',
  'Create category Fitness expense'
];

const bubbleStyles = 'bg-white shadow-2xl border border-slate-200 rounded-xl';

export const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I can add transactions or set budgets. Tell me amount, category, and date.' }
  ]);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const nudgeTimeoutRef = useRef(null);

  const helper = useMemo(() => suggestions[Math.floor(Math.random() * suggestions.length)], []);

  const resetChat = () => {
    setMessages([{ role: 'assistant', content: 'Hi! I can add transactions or set budgets. Tell me amount, category, and date.' }]);
    setInput('');
    setLoading(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!open) {
        setNudgeVisible(true);
        if (nudgeTimeoutRef.current) clearTimeout(nudgeTimeoutRef.current);
        nudgeTimeoutRef.current = setTimeout(() => setNudgeVisible(false), 5000);
      }
    }, 20000);

    return () => {
      clearInterval(interval);
      if (nudgeTimeoutRef.current) clearTimeout(nudgeTimeoutRef.current);
    };
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = [...messages, userMsg];
      const { data } = await api.post('/ai/chat', { message: userMsg.content, history });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Done.' }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Could not reach the assistant. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className={`${bubbleStyles} w-80 h-96 flex flex-col p-3 mb-3 transition duration-150` }>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">Finance Copilot</p>
              <p className="text-xs text-slate-500">Gemini powered</p>
            </div>
            <button
              className="text-slate-500 hover:text-slate-700"
              onClick={() => {
                resetChat();
                setOpen(false);
              }}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-sm leading-snug ${msg.role === 'assistant' ? 'text-slate-800' : 'text-sky-700 text-right'}`}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <div className="mt-2">
            <textarea
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              placeholder={helper}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <div className="flex justify-end mt-1">
              <button
                className="bg-sky-600 text-white px-3 py-1 rounded-md text-sm hover:bg-sky-700 disabled:opacity-50"
                onClick={sendMessage}
                disabled={loading}
              >
                {loading ? 'Thinking…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex flex-col items-end">
        {nudgeVisible && !open && (
          <div className="mb-2 px-3 py-2 text-xs text-white bg-slate-900 rounded-lg shadow-lg animate-pulse">
            Need help? Ask your assistant.
          </div>
        )}
        <button
          className="bg-slate-900 text-white w-12 h-12 flex items-center justify-center rounded-xl shadow-xl border border-slate-800 hover:bg-slate-800 transition transform hover:-translate-y-0.5"
          onClick={() => {
            setOpen((v) => {
              if (v) {
                // Closing: clear chat history
                resetChat();
              }
              return !v;
            });
          }}
          aria-label="Toggle chat"
        >
          💬
        </button>
      </div>
    </div>
  );
};
