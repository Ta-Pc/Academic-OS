/**
 * AIChatAdvisor
 *
 * A floating AI chat panel that gives students on-demand academic advice.
 * It assembles a rich context snapshot from the user's live module, assessment,
 * and term data and sends it together with the user's question to an LLM.
 *
 * Usage (add to Dashboard.tsx):
 *
 *   <AIChatAdvisor
 *     modules={formData.modules}
 *     allAssessments={formData.importedAssessments}
 *     allTerms={formData.degree.terms}
 *     studentName={formData.academicInfo.name}
 *   />
 *
 * To connect a real LLM, replace the `callAI` function stub below with your
 * preferred provider (e.g. Google Gemini via @google/generative-ai).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Module, Assessment, AcademicTerm } from '../../types';
import { buildAcademicContext, DANGEROUS_MODULES_PROMPT } from '../services/aiContextBuilder';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface SuggestionPill {
  label: string;
  prompt: string;
  icon: string;
  /** When true, this pill is disabled when the user has no active module data. */
  requiresData?: boolean;
}

interface Props {
  modules: Module[];
  allAssessments: Assessment[];
  allTerms: AcademicTerm[];
  studentName?: string;
}

// ---------------------------------------------------------------------------
// Suggestion pills
// ---------------------------------------------------------------------------

const SUGGESTION_PILLS: SuggestionPill[] = [
  {
    label: '⚠️ Identify Dangerous Modules',
    prompt: DANGEROUS_MODULES_PROMPT,
    icon: '⚠️',
    requiresData: true,
  },
  {
    label: '📅 Build a study plan',
    prompt:
      'Based on my upcoming assessments and current grades, help me build a realistic week-by-week study plan for the rest of the semester. Prioritise modules where I am at risk.',
    icon: '📅',
    requiresData: true,
  },
  {
    label: '📊 Summarise my progress',
    prompt:
      'Give me a concise summary of my academic progress so far this semester. Highlight what is going well and what needs immediate attention.',
    icon: '📊',
    requiresData: true,
  },
  {
    label: '🎯 What should I focus on today?',
    prompt:
      'Looking at my overdue and upcoming assessments as well as my current grades, what is the single most important thing I should work on today and why?',
    icon: '🎯',
    requiresData: true,
  },
];

// ---------------------------------------------------------------------------
// LLM stub – replace with your actual provider integration
// ---------------------------------------------------------------------------

/**
 * Sends a message + context to the configured LLM and returns the response.
 *
 * INTEGRATION GUIDE
 * -----------------
 * Replace this function body with a real API call, for example using the
 * Google Generative AI SDK:
 *
 *   import { GoogleGenerativeAI } from '@google/generative-ai';
 *   const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
 *   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
 *   const result = await model.generateContent(systemPrompt + '\n\nUser: ' + userMessage);
 *   return result.response.text();
 */
async function callAI(systemContext: string, userMessage: string): Promise<string> {
  // --- STUB: Replace with a real LLM call ---
  // This placeholder returns a helpful message so the UI is fully functional
  // without an API key.
  console.info('[AIChatAdvisor] callAI invoked. System context length:', systemContext.length);
  console.info('[AIChatAdvisor] User message:', userMessage);

  return (
    "I'm your Academic OS AI Advisor. To activate live AI responses, connect a language model " +
    "by replacing the `callAI` function in `AIChatAdvisor.tsx` with your preferred provider " +
    "(e.g. Google Gemini, OpenAI, or any compatible API).\n\n" +
    "Your academic context has been assembled and would be sent alongside your message. " +
    "The context includes your module grades, study hours, assessment weights and types, " +
    "and semester/term information — giving the AI everything it needs to give you personalised advice."
  );
}

// ---------------------------------------------------------------------------
// Helper: format timestamp
// ---------------------------------------------------------------------------

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const AIChatAdvisor: React.FC<Props> = ({ modules, allAssessments, allTerms, studentName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll to the latest message whenever the list updates.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus the input whenever the panel opens.
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Close panel on Escape key.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => setIsOpen(prev => !prev);

  /**
   * Fills the textarea with the pill's prompt text and focuses the input so
   * the user can review/edit before sending.
   */
  const handlePillClick = useCallback((pill: SuggestionPill) => {
    setInputValue(pill.prompt);
    setTimeout(() => {
      inputRef.current?.focus();
      // Move caret to the end of the pre-filled text.
      const el = inputRef.current;
      if (el) {
        el.selectionStart = el.value.length;
        el.selectionEnd = el.value.length;
      }
    }, 50);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build the context from current live data every time the user sends.
      const context = buildAcademicContext(modules, allAssessments, allTerms, studentName);
      const systemPrompt =
        `You are an expert academic advisor embedded in Academic OS. ` +
        `You have full access to the student's current academic data shown below. ` +
        `Always be specific, data-driven, and action-oriented in your responses. ` +
        `Reference actual module names, grades, and assessment details when relevant.\n\n` +
        `=== STUDENT ACADEMIC SNAPSHOT ===\n${context}\n=== END OF SNAPSHOT ===`;

      const responseText = await callAI(systemPrompt, trimmed);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('[AIChatAdvisor] Error calling AI:', error);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, modules, allAssessments, allTerms, studentName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift for new line).
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeModules = modules.filter(m => m.status === 'In Progress');
  const hasData = activeModules.length > 0;

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Floating action button                                              */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={handleToggle}
        aria-label={isOpen ? 'Close AI Advisor' : 'Open AI Advisor'}
        aria-expanded={isOpen}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center
          text-white text-2xl
          transition-all duration-200
          focus:outline-none focus:ring-4 focus:ring-violet-400
          ${isOpen
            ? 'bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500'
            : 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600'
          }
        `}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* ------------------------------------------------------------------ */}
      {/* Chat panel                                                          */}
      {/* ------------------------------------------------------------------ */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="AI Academic Advisor"
          className="
            fixed bottom-24 right-6 z-40
            w-full max-w-sm sm:max-w-md
            bg-white dark:bg-slate-800
            rounded-2xl shadow-2xl
            border border-slate-200 dark:border-slate-700
            flex flex-col
            overflow-hidden
            animate-slide-up
          "
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-violet-600 dark:bg-violet-700 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">🤖</span>
              <div>
                <p className="font-bold text-sm leading-tight">AI Academic Advisor</p>
                <p className="text-xs text-violet-200 leading-tight">
                  {hasData
                    ? `${activeModules.length} module${activeModules.length !== 1 ? 's' : ''} in context`
                    : 'No module data — add modules first'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Advisor panel"
              className="p-1 rounded-full hover:bg-violet-500 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Message list                                                     */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-2xl mb-2">👋</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  Hi{studentName ? `, ${studentName}` : ''}! How can I help you today?
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ask me anything about your academics or use a suggestion below.
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words
                    ${msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                    }
                  `}
                >
                  {msg.content}
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-violet-200 text-right' : 'text-slate-400'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start" role="status" aria-live="polite">
                <span className="sr-only">AI is thinking…</span>
                <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm" aria-hidden="true">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Suggestion pills                                                 */}
          {/* ---------------------------------------------------------------- */}
          {messages.length === 0 && (
            <div className="px-4 pb-2 flex-shrink-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                Quick questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_PILLS.map(pill => {
                  const isDisabled = !!pill.requiresData && !hasData;
                  const isDangerPill = pill.label.startsWith('⚠️');
                  return (
                    <button
                      key={pill.label}
                      onClick={() => handlePillClick(pill)}
                      disabled={isDisabled}
                      title={pill.prompt}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium
                        border transition-colors text-left
                        focus:outline-none focus:ring-2 focus:ring-violet-400
                        ${isDangerPill
                          ? `bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700
                             text-red-700 dark:text-red-300
                             hover:bg-red-100 dark:hover:bg-red-900/50
                             disabled:opacity-40 disabled:cursor-not-allowed`
                          : `bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600
                             text-slate-700 dark:text-slate-300
                             hover:bg-slate-100 dark:hover:bg-slate-600
                             disabled:opacity-40 disabled:cursor-not-allowed`
                        }
                      `}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Input area                                                       */}
          {/* ---------------------------------------------------------------- */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your studies…"
                rows={1}
                className="
                  flex-1 resize-none rounded-xl px-3 py-2 text-sm
                  bg-slate-100 dark:bg-slate-700
                  text-slate-900 dark:text-slate-100
                  placeholder-slate-400 dark:placeholder-slate-500
                  border border-transparent
                  focus:outline-none focus:ring-2 focus:ring-violet-400
                  max-h-32
                "
                style={{ overflowY: 'auto' }}
                aria-label="Chat message input"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                aria-label="Send message"
                className="
                  flex-shrink-0 w-9 h-9 rounded-full
                  bg-violet-600 hover:bg-violet-700
                  disabled:bg-slate-300 dark:disabled:bg-slate-600
                  text-white
                  flex items-center justify-center
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-violet-400
                "
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatAdvisor;
