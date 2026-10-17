import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [verified, setVerified] = useState(false);
  const [mockOtp, setMockOtp] = useState('123456');
  const [messages, setMessages] = useState([]);
  const [orderContext, setOrderContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const openChat = (prefillOrderId = '', prefillPhone = '') => {
    setIsOpen(true);
    if (prefillOrderId) setOrderId(prefillOrderId);
    if (prefillPhone) setPhone(prefillPhone);
  };

  const closeChat = () => setIsOpen(false);

  const startSession = async (custPhone, custOrderId) => {
    setLoading(true);
    try {
      const res = await api.startChatSession(custPhone, custOrderId);
      setSessionId(res.session_id);
      setPhone(custPhone);
      setOrderId(custOrderId);
      setVerified(res.verified);
      setMockOtp(res.mock_otp);
      setMessages([
        {
          id: 'welcome-init',
          sender: 'agent',
          text: `Namaste! 🙏 Welcome to ActDesk Support for Order ${custOrderId}. For verification, please enter the OTP sent to ${custPhone}.`,
          timestamp: new Date().toISOString(),
          policy_status: 'unverified'
        }
      ]);
      addToast(`Mock OTP sent: ${res.mock_otp}`, 'info');
      return res;
    } catch (err) {
      addToast(err.message || 'Failed to start support session', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otpCode) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await api.verifyOtp(sessionId, otpCode);
      setVerified(true);
      // Fetch initial order details
      try {
        const orderData = await api.getOrder(orderId);
        setOrderContext(orderData);
      } catch (e) {}

      setMessages(prev => [
        ...prev,
        {
          id: 'auth-success',
          sender: 'system',
          text: `✅ Identity Verified! You are authenticated for Order ${orderId}. You can track your package, request a refund, change address, or reschedule delivery.`,
          timestamp: new Date().toISOString(),
          policy_status: 'verified'
        }
      ]);
      addToast('Verification successful!', 'success');
      return res;
    } catch (err) {
      addToast(err.message || 'Invalid OTP', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text) => {
    if (!sessionId || !text.trim()) return;
    const userMsgId = 'msg-' + Date.now();
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.sendMessage(sessionId, text);
      if (res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      }
      if (res.order_context) {
        setOrderContext(res.order_context);
      }

      if (res.policy_decision === 'auto') {
        addToast('Action executed automatically!', 'success');
      } else if (res.policy_decision === 'needs_approval') {
        addToast('Request routed to human manager for approval', 'warning');
      } else if (res.policy_decision === 'refused') {
        addToast('Action prevented by store policy rules', 'error');
      }

      return res;
    } catch (err) {
      addToast(err.message || 'Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (rating, comment = '') => {
    if (!sessionId) return;
    try {
      await api.submitFeedback(sessionId, rating, comment);
      addToast('Thank you for rating your experience!', 'success');
    } catch (err) {
      addToast('Could not record feedback', 'error');
    }
  };

  const resetChat = () => {
    setSessionId(null);
    setVerified(false);
    setMessages([]);
    setOrderContext(null);
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        sessionId,
        phone,
        setPhone,
        orderId,
        setOrderId,
        verified,
        mockOtp,
        messages,
        orderContext,
        loading,
        startSession,
        verifyOtp,
        sendMessage,
        submitFeedback,
        resetChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
