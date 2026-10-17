import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ShieldCheck, Heart, Globe, Users, Code2 } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();

  const goTo = (path) => {
    navigate(path);
    // Force scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto bg-white dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">ActDesk</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              The autonomous support agent for Indian D2C brands. Fast, secure, and policy-driven.
            </p>
            
            <div className="flex items-center gap-2">
              <Link to="/about" title="Meet the Team" className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <Users className="w-4 h-4" />
              </Link>
              <a href="mailto:ishleenk722@gmail.com?subject=ActDesk%20Inquiry" title="Email Us" className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <Globe className="w-4 h-4" />
              </a>
              <a href="https://github.com/Ishleen337/Ishleen337" target="_blank" rel="noreferrer" title="View Source Code" className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <Code2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links - Using Buttons to force navigation */}
          <div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <button onClick={() => goTo('/?view=storefront')} className="group flex items-center gap-1 hover:text-emerald-600 transition text-left">
                  <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300">→</span>
                  D2C Storefront
                </button>
              </li>
              <li>
                <button onClick={() => goTo('/?view=dashboard&tab=overview')} className="group flex items-center gap-1 hover:text-emerald-600 transition text-left">
                  <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300">→</span>
                  Operations Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => goTo('/?view=dashboard&tab=dial')} className="group flex items-center gap-1 hover:text-emerald-600 transition text-left">
                  <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300">→</span>
                  Autonomy Dial
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/about" className="group flex items-center gap-1 hover:text-emerald-600 transition">
                  <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300">→</span>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="group flex items-center gap-1 hover:text-emerald-600 transition">
                  <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300">→</span>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/privacy" className="group flex items-center gap-1 hover:text-emerald-600 transition">
                  <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300">→</span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="group flex items-center gap-1 hover:text-emerald-600 transition">
                  <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300">→</span>
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Enterprise-Grade Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
            Systems Operational
          </div>
          <div className="text-center md:text-right">
            © {new Date().getFullYear()} ActDesk Inc. Built with <Heart className="w-3 h-3 inline text-rose-500 fill-rose-500" /> by the ActDesk Team.
          </div>
        </div>
      </div>
    </footer>
  );
}