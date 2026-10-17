import React from 'react';
import Navbar from './Navbar';
import { Heart } from 'lucide-react';

export default function PageLayout({ children, title }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      <Navbar currentView="" setCurrentView={null} />

      {/* Stretched to max-w-[90rem] so the About page cards fill the screen */}
      <main className="flex-1 w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
        </div>

        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-slate-950/80 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className="flex items-center justify-center gap-1.5">
          © {new Date().getFullYear()} ActDesk Inc. Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Indian D2C Brands.
        </p>
      </footer>

    </div>
  );
}