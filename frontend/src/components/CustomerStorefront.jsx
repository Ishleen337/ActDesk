import React from 'react';
import { useChat } from '../context/ChatContext';
import { 
  Package, RotateCcw, Clock, Sparkles, ShieldCheck, ArrowRight, ExternalLink, MessageSquare
} from 'lucide-react';

const DEMO_TEST_ORDERS = [
  {
    id: "ORD-10001", customer: "Aarav Sharma", phone: "+919876501000", item: "Ceramic Dripper Artisan Coffee Kit", status: "delivered", amount: "₹1,299.00", suggestedQuery: "Mera product toot gaya hai, ₹500 refund chahiye", tag: "Tests Auto-Refund Rule (<= ₹500)"
  },
  {
    id: "ORD-10002", customer: "Priya Patel", phone: "+919876501001", item: "Organic Cold-Pressed Almond Oil (200ml)", status: "processing", amount: "₹499.00", suggestedQuery: "Order cancel kar do galti se order place ho gaya", tag: "Tests Pre-Dispatch Cancellation"
  },
  {
    id: "ORD-10003", customer: "Rohan Iyer", phone: "+919876501002", item: "Handmade Himalayan Saffron Radiance Elixir", status: "shipped", amount: "₹899.00", suggestedQuery: "Delivery kal shaam 6 se 9 baje reschedule kardo", tag: "Tests Delivery Rescheduling"
  },
  {
    id: "ORD-10004", customer: "Sneha Nair", phone: "+919876501003", item: "Ergonomic Memory Foam Lumbar Support", status: "created", amount: "₹1,599.00", suggestedQuery: "Delivery address update kardo Flat 402 Mumbai", tag: "Tests Address Update with 1-Click Undo"
  }
];

export default function CustomerStorefront({ onNavigateToDashboard }) {
  const { openChat } = useChat();

  return (
    <div className="space-y-10 pb-16 animate-fade-in">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/60 backdrop-blur-md border border-emerald-100 dark:border-slate-800 p-8 sm:p-12 shadow-xl shadow-emerald-500/5 transition-colors duration-300">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Autonomous Customer Care Powered by ActDesk</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
            Direct-to-Consumer Support That <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Actually Acts</span>.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            No endless deflective FAQs or waiting hours for a human. ActDesk resolves tracking inquiries, 
            issues instant refunds, reschedules delivery slots, and changes addresses under your store’s 
            controlled <strong>Autonomy Dial</strong> rules.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <button
              onClick={() => openChat("ORD-10001", "+919876501000")}
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 group"
            >
              <MessageSquare className="w-4 h-4 transition group-hover:scale-110" />
              <span>Launch Live Support Chat</span>
            </button>

            <button
              onClick={onNavigateToDashboard}
              className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm transition flex items-center gap-2 shadow-sm"
            >
              <span>Explore Autonomy Dial Dashboard</span>
              <ArrowRight className="w-4 h-4 text-emerald-500" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Live Tracking</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">60s Redis Cache-aside</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Idempotent Refunds</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Zero duplicate charges</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Slot Rescheduling</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Automated courier update</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-100 dark:border-fuchsia-900 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Policy Safeguards</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">No prompt injection bypass</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration Panel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Try Interactive Scenarios with Seeded Orders
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select an order scenario below to open the chat widget prefilled with customer credentials.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hidden sm:block">
            500+ Indian D2C Orders Seeded
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_TEST_ORDERS.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {order.id}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {order.customer}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                    order.status === 'processing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Item: <span className="font-medium text-slate-800 dark:text-slate-200">{order.item}</span> ({order.amount})
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-4">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Try Query (English or Hinglish):
                  </p>
                  <p className="text-xs italic text-emerald-600 dark:text-emerald-400 font-medium">
                    "{order.suggestedQuery}"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {order.tag}
                </span>

                <button
                  onClick={() => openChat(order.id, order.phone)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>Chat About Order</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How Autonomy Works Diagram — Premium Redesign */}
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Architecture: Server-Side Policy Outside The LLM
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Unlike standard chatbots that execute functions directly, ActDesk isolates execution through a strict 3-tier safety perimeter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Box 1 */}
          <div className="relative group bg-white dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-400 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-t-2xl" />
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              1. Intent Parsing
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Customer verifies via OTP. The model parses Hinglish and English queries and proposes a JSON tool call.
            </p>
          </div>

          {/* Box 2 (Highlighted) */}
          <div className="relative group bg-white dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border-2 border-emerald-400 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-t-2xl" />
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              2. Autonomy Dial
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Independent server-side policy evaluator checks amount thresholds (₹500), refund frequency, and order status.
            </p>
          </div>

          {/* Box 3 */}
          <div className="relative group bg-white dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-400 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-t-2xl" />
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-4">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              3. Execution or Queue
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Safe actions execute with Idempotency-Keys. High-risk or over-limit requests route to staff approval queue.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}