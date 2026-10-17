import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useChat } from '../context/ChatContext';
import { 
  Bot, X, Send, ShieldCheck, RefreshCw, Sparkles, 
  Package, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp
} from 'lucide-react';

export default function ChatWidget() {
  const {
    isOpen, closeChat, openChat, phone, setPhone, orderId, setOrderId,
    verified, mockOtp, messages, orderContext, loading,
    startSession, verifyOtp, sendMessage, submitFeedback, resetChat, sessionId
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [step, setStep] = useState('credentials');
  const [isOrderCardExpanded, setIsOrderCardExpanded] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(messages?.length || 0);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Trigger confetti when a new message with 'auto' policy + tool is added
  useEffect(() => {
    if (messages && messages.length > prevMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.policy_status === 'auto' && lastMsg?.tool_executed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#14b8a6', '#34d399', '#6ee7b7']
        });
      }
      prevMessageCountRef.current = messages.length;
    }
  }, [messages]);

  useEffect(() => {
    if (verified) setStep('chat');
    else if (sessionId) setStep('otp');
    else setStep('credentials');
  }, [verified, sessionId]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!phone || !orderId) return;
    try {
      await startSession(phone, orderId);
      setStep('otp');
      setEnteredOtp(mockOtp || '123456');
    } catch (err) {}
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!enteredOtp) return;
    try {
      await verifyOtp(enteredOtp);
      setStep('chat');
    } catch (err) {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;
    const msg = inputMessage;
    setInputMessage('');
    await sendMessage(msg);
  };

  const handleQuickSuggestion = (text) => sendMessage(text);
  const handleAutofillDemo = () => { setPhone('+919876501000'); setOrderId('ORD-10001'); };

  if (!isOpen) {
    return (
      <button
        onClick={() => openChat()}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-emerald-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 group ring-4 ring-emerald-500/20"
        aria-label="Open support chat"
      >
        <Bot className="w-6 h-6 animate-pulse-subtle" />
        <span className="text-xs font-bold hidden sm:inline-block pr-1">Customer Demo</span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full sm:w-[440px] max-h-[640px] h-[92vh] flex flex-col bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm leading-none">Customer Support Sandbox</h3>
              {verified && <ShieldCheck className="w-4 h-4 text-emerald-400" title="Identity Verified" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {orderId ? `Order: ${orderId}` : 'Indian D2C Customer Support'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {sessionId && (
            <button onClick={resetChat} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button onClick={closeChat} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Credentials Step */}
      {step === 'credentials' && (
        <div className="flex-1 p-6 flex flex-col justify-center bg-slate-50 overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Verify Customer & Order</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Per store policy, account data and state actions require mobile OTP verification.
            </p>
          </div>

          <form onSubmit={handleStartSession} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Mobile Number</label>
              <input
                type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876501000"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order Number</label>
              <input
                type="text" required value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                placeholder="ORD-10001"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono text-slate-900"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Send Verification OTP'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <button type="button" onClick={handleAutofillDemo} className="text-xs text-emerald-600 font-semibold hover:underline">
              ⚡ Click to Autofill Demo Verified Order (ORD-10001)
            </button>
          </div>
        </div>
      )}

      {/* OTP Step */}
      {step === 'otp' && (
        <div className="flex-1 p-6 flex flex-col justify-center bg-slate-50 overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Enter 6-Digit Verification OTP</h4>
            <p className="text-xs text-slate-500 mt-1">Sent to <span className="font-semibold text-slate-700">{phone}</span></p>
            <div className="mt-2 inline-block px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-mono font-bold">
              Demo OTP: {mockOtp || '123456'}
            </div>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text" required maxLength={6} value={enteredOtp} onChange={(e) => setEnteredOtp(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-widest font-mono text-xl py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP & Start Session'}
            </button>
            <button type="button" onClick={() => setStep('credentials')} className="w-full text-xs text-slate-500 hover:text-slate-800 font-medium">
              Change Phone or Order ID
            </button>
          </form>
        </div>
      )}

      {/* Chat Step */}
      {step === 'chat' && (
        <>
          {orderContext && (
            <div className="bg-slate-100 border-b border-slate-200 text-xs">
              <button onClick={() => setIsOrderCardExpanded(!isOrderCardExpanded)} className="w-full px-3.5 py-2 flex items-center justify-between text-left font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Status: <strong className="uppercase text-slate-900">{orderContext.status}</strong> • Total: ₹{orderContext.total_inr}</span>
                </div>
                {isOrderCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {isOrderCardExpanded && (
                <div className="px-3.5 pb-3 pt-1 space-y-1.5 border-t border-slate-200 text-[11px] text-slate-600 animate-fade-in">
                  {orderContext.shipment && <p>Courier: <strong>{orderContext.shipment.courier}</strong> (Trk: {orderContext.shipment.tracking_number})</p>}
                  {orderContext.delivery_slot && <p>Slot: <strong>{orderContext.delivery_slot.slot_date}</strong> ({orderContext.delivery_slot.time_window})</p>}
                  {orderContext.address && <p>Address: {orderContext.address.street}, {orderContext.address.city} - {orderContext.address.pincode}</p>}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              const isSystem = m.sender === 'system';
              if (isSystem) return (
                <div key={m.id} className="text-center my-2">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-medium bg-slate-200 text-slate-700 border border-slate-300">{m.text}</span>
                </div>
              );
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    isUser ? 'bg-emerald-600 text-white rounded-br-xs' : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                  }`}>
                    {m.text}
                    {!isUser && m.policy_status && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          m.policy_status === 'auto' || m.policy_status === 'auto_executed' ? 'text-emerald-600' :
                          m.policy_status === 'needs_approval' || m.policy_status === 'queued_for_approval' ? 'text-amber-600' :
                          m.policy_status === 'refused' ? 'text-rose-600' : 'text-slate-400'
                        }`}>
                          {m.policy_status === 'auto' ? '✓ Auto Policy Executed' :
                           m.policy_status === 'needs_approval' ? '⏳ Routed to Approval Queue' :
                           m.policy_status === 'refused' ? '✕ Store Policy Exception' : 'Policy Engine Checked'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-white p-2.5 rounded-xl border border-slate-200 w-fit animate-pulse">
                <Bot className="w-4 h-4 text-emerald-500 animate-spin" />
                <span>Evaluating intent & policy rules...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button onClick={() => handleQuickSuggestion('Where is my order?')} className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition">📍 Track Order</button>
            <button onClick={() => handleQuickSuggestion('Mujhe refund chahiye please product damaged mila')} className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition">💸 Refund ₹500</button>
            <button onClick={() => handleQuickSuggestion('Delivery kal shaam ko reschedule kardo')} className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition">📅 Reschedule</button>
          </div>

          <div className="px-3 py-1 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Was this helpful?</span>
            <div className="flex items-center gap-2">
              <button onClick={() => { submitFeedback('up'); setFeedbackGiven('up'); }} disabled={feedbackGiven !== null} className={`p-1 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 transition ${feedbackGiven === 'up' ? 'text-emerald-500 font-bold' : ''}`}>
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { submitFeedback('down'); setFeedbackGiven('down'); }} disabled={feedbackGiven !== null} className={`p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition ${feedbackGiven === 'down' ? 'text-rose-500 font-bold' : ''}`}>
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask in English or Hinglish..."
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
            <button type="submit" disabled={loading || !inputMessage.trim()} className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}