const API_BASE = '/api/v1';

export const getAuthToken = () => localStorage.getItem('actdesk_access_token');
export const setAuthToken = (token) => localStorage.setItem('actdesk_access_token', token);
export const getRefreshToken = () => localStorage.getItem('actdesk_refresh_token');
export const setRefreshToken = (token) => localStorage.setItem('actdesk_refresh_token', token);
export const removeTokens = () => {
  localStorage.removeItem('actdesk_access_token');
  localStorage.removeItem('actdesk_refresh_token');
  localStorage.removeItem('actdesk_user');
};

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const rToken = getRefreshToken();
    if (rToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rToken })
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAuthToken(data.access_token);
          setRefreshToken(data.refresh_token);
          headers['Authorization'] = `Bearer ${data.access_token}`;
          return fetch(url, { ...options, headers }).then(r => r.json());
        }
      } catch (err) {
        removeTokens();
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    const error = new Error(errorData.detail || 'Request failed');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  getMe: () => request('/auth/me'),

  // Orders
  getOrders: (params = {}) => {
    const { page = 1, limit = 12, search, status_filter } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    if (status_filter) queryParams.append('status_filter', status_filter);
    return request(`/orders?${queryParams.toString()}`);
  },
  getOrder: (id) => request(`/orders/${id}`),
  cancelOrder: (id, reason) => request(`/orders/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  issueRefund: (id, amount_paise, reason, idempotencyKey) => request(`/orders/${id}/refunds`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ amount_paise, reason })
  }),
  rescheduleDelivery: (id, slot_date, time_window) => request(`/orders/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ slot_date, time_window })
  }),
  updateAddress: (id, addressData) => request(`/orders/${id}/address`, {
    method: 'PATCH',
    body: JSON.stringify(addressData)
  }),

  // Chat
  startChatSession: (phone, order_id) => request('/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ phone, order_id })
  }),
  verifyOtp: (sessionId, otp) => request(`/chat/sessions/${sessionId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ otp })
  }),
  sendMessage: (sessionId, message) => request(`/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message })
  }),
  submitFeedback: (sessionId, rating, comment) => request(`/chat/sessions/${sessionId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment })
  }),
  getConversations: (page = 1) => request(`/chat/conversations?page=${page}`),

  // Autonomy Rules
  getRules: () => request('/autonomy-rules'),
  updateRule: (tool, mode, conditions) => request(`/autonomy-rules/${tool}`, {
    method: 'PATCH',
    body: JSON.stringify({ mode, conditions })
  }),

  // Approvals
  getApprovals: (status = 'pending', page = 1) => request(`/approvals?status=${status}&page=${page}`),
  decideApproval: (id, decision, notes, edited_args) => request(`/approvals/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, notes, edited_args })
  }),

  // Actions & Undo
  getActions: (page = 1) => request(`/actions?page=${page}`),
  undoAction: (id) => request(`/actions/${id}/undo`, {
    method: 'POST'
  }),

  // Analytics
  getAnalytics: (from, to) => {
    let q = '';
    if (from && to) q = `?from=${from}&to=${to}`;
    return request(`/analytics${q}`);
  },

  // Red Team
  testRedTeam: (prompt, target_order_id) => request('/redteam/test', {
    method: 'POST',
    body: JSON.stringify({ prompt, target_order_id })
  }),
  // FIXED: No method specified, which means it defaults to GET (matching backend @router.get)
  runRedTeamBenchmark: () => request('/redteam/suite')
};