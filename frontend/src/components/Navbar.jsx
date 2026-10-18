import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import LoginModal from './LoginModal';
import { 
  Bot, Sun, Moon, LogIn, LogOut, ShieldCheck, UserCheck, MessageSquareText, Store, LayoutDashboard 
} from 'lucide-react';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { openChat } = useChat();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  const location = useLocation();
  const isStaticPage = ['/about', '/contact', '/privacy', '/terms'].includes(location.pathname);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors duration-300">
        {/* CHANGED max-w-7xl to max-w-5xl to match the main content width */}
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
          
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
              </div>
            </div>
            <div className="min-w-0 block">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent whitespace-nowrap">
                  ActDesk
                </span>
                <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  Autonomy Active
                </span>
              </div>
            </div>
          </Link>

          <div className="flex flex-1 justify-center items-center min-w-0 px-1 sm:px-0">
            {isStaticPage ? (
              <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-400">
                <Link to="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">About</Link>
                <Link to="/contact" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Contact</Link>
                <Link to="/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms</Link>
              </nav>
            ) : (
              <nav className="flex items-center bg-slate-100/80 dark:bg-slate-900/80 p-0.5 sm:p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm overflow-x-auto no-scrollbar max-w-full">
                <button
                  onClick={() => setCurrentView && setCurrentView('storefront')}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    currentView === 'storefront'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span className="hidden sm:inline">D2C Storefront</span>
                </button>
                <button
                  onClick={() => setCurrentView && setCurrentView('dashboard')}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    currentView === 'dashboard'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Operations Dial</span>
                </button>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {!isStaticPage && (
              <button
                onClick={() => openChat()}
                className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/70 transition-all shadow-sm relative"
              >
                <MessageSquareText className="w-4 h-4" strokeWidth={2.5} />
                <span>Test Chat</span>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                </span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" strokeWidth={2.5} /> : <Moon className="w-4 h-4" strokeWidth={2.5} />}
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 ml-1 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden md:flex flex-col items-end">
                  <p className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">
                    {user.full_name}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
                    isAdmin
                      ? 'bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {isAdmin ? <ShieldCheck className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
                    {user.role === 'store_admin' ? 'Admin' : 'Agent'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="group flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-600/30 transition-all hover:-translate-y-0.5"
              >
                <LogIn className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}