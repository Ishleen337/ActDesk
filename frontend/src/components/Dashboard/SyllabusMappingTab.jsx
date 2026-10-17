import React from 'react';
import { 
  BookOpen, 
  Database, 
  ShieldCheck, 
  Zap, 
  Code2, 
  Layers, 
  Cpu, 
  Smartphone,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

const SYLLABUS_SECTIONS = [
  {
    lectures: "Lectures 1-2",
    title: "RESTful API Design & Architecture",
    icon: Code2,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    topics: "REST architectural principles, URI naming (/api/v1/...), HTTP verbs (GET, POST, PATCH), idempotency keys, HTTP status codes, OpenAPI/Swagger documentation.",
    implementation: "Implemented across routers (/orders, /chat, /autonomy-rules, /approvals, /actions). Interactive Swagger UI available at /docs and ReDoc at /redoc. Mutations enforce Idempotency-Key headers."
  },
  {
    lectures: "Lectures 3-4",
    title: "Database Design (SQL & NoSQL Document / Key-Value)",
    icon: Database,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    topics: "Relational SQL modeling, 1NF-3NF normalization, foreign keys, NoSQL document stores (MongoDB equivalent JSON traces), key-value stores (Redis TTL caching).",
    implementation: "Relational schema for customers, orders, shipments, delivery slots, rules, and pending actions via SQLAlchemy ORM. Document structure for conversation transcripts and feedback. 500+ seeded Indian D2C orders."
  },
  {
    lectures: "Lectures 5-6",
    title: "Authentication, Authorization & RBAC",
    icon: ShieldCheck,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/60",
    topics: "JSON Web Tokens (JWT) structure, access & refresh tokens, password hashing with bcrypt, Role-Based Access Control (RBAC), securing APIs against threats.",
    implementation: "Dual token auth (12h access, 7d refresh), bcrypt rounds=12. Strict RBAC: Store Admin (rule authoring), Support Agent (approvals & undo), and Customer (OTP-verified chat scope)."
  },
  {
    lectures: "Lectures 7-8",
    title: "Scalability, Caching Strategies & Rate Limiting",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    topics: "Cache-aside and write-through patterns, Redis TTL design, rate limiting and throttling, Prometheus service metrics.",
    implementation: "In-memory/Redis TTL cache: 60s for order status queries, 30m for session state, 24h for refund idempotency. Sliding-window rate limiter per session and customer. /metrics endpoint for Prometheus."
  },
  {
    lectures: "Lectures 9-10",
    title: "FastAPI Hands-on & Automated Test Suite",
    icon: Cpu,
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/60",
    topics: "Modular project structure, Pydantic request validation, dependency injection (get_db, require_role), automated testing with pytest.",
    implementation: "FastAPI modular backend in /app with routers, models, schemas, and services. Automated pytest test suite covering policy engine boundaries, idempotency, undo, and red-team attacks."
  },
  {
    lectures: "Lectures 11-12",
    title: "Modern Web Frameworks (React & Vite)",
    icon: Layers,
    color: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-950/60",
    topics: "Component-based architecture, JSX, virtual DOM, props and composition, hooks (useState, useEffect, useCallback, useMemo), Vite scaffolding.",
    implementation: "Built on React 19 + Vite 8. Clean component breakdown with Navbar, ToastContainer, CustomerStorefront, ChatWidget, and modular dashboard tabs."
  },
  {
    lectures: "Lectures 13-14",
    title: "State Management & Asynchronous Data Fetching",
    icon: BookOpen,
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/60",
    topics: "Context API for global state, asynchronous side effects, background polling, loading and optimistic UI states.",
    implementation: "Dedicated React Contexts (AuthContext, ThemeContext, ToastContext, ChatContext). Real-time KPI polling, optimistic UI updates, and celebration confetti side-effects."
  },
  {
    lectures: "Lectures 15-16",
    title: "Responsive Design & WCAG 2.1 Accessibility",
    icon: Smartphone,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/60",
    topics: "Mobile-first responsive breakpoints, CSS Grid & Flexbox, semantic HTML, ARIA roles, WCAG 2.1 contrast guidelines, dark/light theme.",
    implementation: "Tailwind CSS with responsive mobile drawer/modal views, CSS Grid cards, high contrast dark/light mode toggle, keyboard navigable controls, aria-live toast notifications."
  }
];

export default function SyllabusMappingTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-800/40 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Alignment Matrix</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">
          Project-Based Evaluation-1 (Lectures 1–16)
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          ActDesk fulfills every module in the provided course syllabus, connecting enterprise backend engineering 
          (FastAPI, SQLAlchemy, Redis, Idempotency, RBAC) with modern frontend development (React 19, Vite, WCAG 2.1).
        </p>
      </div>

      {/* Grid of Syllabus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYLLABUS_SECTIONS.map((sec, i) => {
          const Icon = sec.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {sec.lectures}
                  </span>
                  <div className={`p-2 rounded-xl ${sec.bg}`}>
                    <Icon className={`w-4 h-4 ${sec.color}`} />
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {sec.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  <strong className="text-slate-700 dark:text-slate-300">Syllabus Scope:</strong> {sec.topics}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>ActDesk Implementation:</strong> {sec.implementation}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
