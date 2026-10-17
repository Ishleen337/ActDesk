import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';
import { 
  Search, ChevronLeft, ChevronRight, MessageSquare, Eye, X
} from 'lucide-react';

export default function OrdersExplorerTab() {
  const { openChat } = useChat();
  const { addToast } = useToast();
  
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12); // 12 items per page
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 🚨 Pass 'page' directly as expected by the backend
      const params = { page, limit };
      
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status_filter = statusFilter;

      const res = await api.getOrders(params);
      
      setOrders(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      addToast(err.message || 'Failed to load mock orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 when searching
    fetchOrders();
  };

  const handleViewOrder = async (orderId) => {
    setOrderDetailLoading(true);
    try {
      const data = await api.getOrder(orderId);
      setSelectedOrder(data);
    } catch (err) {
      addToast('Failed to load order details', 'error');
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Mock Store Orders Explorer
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {total.toLocaleString()} Seeded Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System of record (FR-1) acting as the realistic Indian D2C commerce backend.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-60 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-300"
          >
            <option value="">All</option>
            <option value="delivered">Delivered</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="processing">Processing</option>
            <option value="created">Created</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium">Loading orders...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {order.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                    order.status === 'processing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {order.customer_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {order.customer_phone}
                </p>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Items: {order.items_count || 1}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{order.total_inr?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleViewOrder(order.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => openChat(order.id, order.customer_phone)}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        <span>
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total orders)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  {selectedOrder.id}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Order Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  Customer: {selectedOrder.customer_name}
                </p>
                <p className="text-slate-500 font-mono mb-2">
                  Phone: {selectedOrder.customer_phone}
                </p>
                {selectedOrder.address && (
                  <p className="text-slate-600 dark:text-slate-300">
                    📍 {selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                  </p>
                )}
              </div>

              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Purchased Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">₹{item.price_inr}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.shipment && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200">
                  <p className="font-bold mb-1">🚚 Logistics & Shipment</p>
                  <p>Courier: <strong>{selectedOrder.shipment.courier}</strong> (Tracking: {selectedOrder.shipment.tracking_number})</p>
                  <p>Current Hub: {selectedOrder.shipment.current_location}</p>
                  <p>Estimated Delivery: {selectedOrder.shipment.estimated_delivery}</p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openChat(selectedOrder.id, selectedOrder.customer_phone);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-sm"
                >
                  Open in Support Chat Widget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}