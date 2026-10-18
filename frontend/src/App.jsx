import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';
import CustomerStorefront from './components/CustomerStorefront';
import ChatWidget from './components/ChatWidget'; 
import Footer from './components/Footer';
import PageLayout from './components/PageLayout';
import OverviewTab from './components/Dashboard/OverviewTab';
import AutonomyDialTab from './components/Dashboard/AutonomyDialTab';
import ApprovalQueueTab from './components/Dashboard/ApprovalQueueTab';
import AuditLogTab from './components/Dashboard/AuditLogTab';
import OrdersExplorerTab from './components/Dashboard/OrdersExplorerTab';
import RedTeamPlaygroundTab from './components/Dashboard/RedTeamPlaygroundTab';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import { useAuth } from './context/AuthContext'; // Added to protect routes

import { LayoutDashboard, Sliders, Clock, FileText, Package, ShieldAlert } from 'lucide-react';

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview & KPIs', icon: LayoutDashboard },
  { id: 'dial', label: 'Autonomy Dial', icon: Sliders },
  { id: 'approvals', label: 'Approval Queue', icon: Clock },
  { id: 'audit', label: 'Audit Log & Undo', icon: FileText },
  { id: 'orders', label: 'Orders Explorer (500+)', icon: Package },
  { id: 'redteam', label: 'Red-Team Tests', icon: ShieldAlert },
];

function MainApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user state
  const searchParams = new URLSearchParams(location.search);
  
  const viewParam = searchParams.get('view');
  const tabParam = searchParams.get('tab');

  const [currentView, setCurrentView] = useState(viewParam === 'dashboard' ? 'dashboard' : 'storefront');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');

  useEffect(() => {
    if (viewParam === 'dashboard') {
      setCurrentView('dashboard');
      setActiveTab(tabParam || 'overview');
    } else {
      setCurrentView('storefront');
      setActiveTab('overview');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.key, viewParam, tabParam]);

  const handleViewChange = (view) => {
    setCurrentView(view);
    navigate(`/?view=${view}`);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/?view=dashboard&tab=${tabId}`);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar currentView={currentView} setCurrentView={handleViewChange} />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
        {currentView === 'storefront' ? (
          <CustomerStorefront onNavigateToDashboard={() => handleViewChange('dashboard')} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
              {DASHBOARD_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="w-full">
              {activeTab === 'overview' && <OverviewTab onSwitchTab={handleTabChange} />}
              {activeTab === 'dial' && <AutonomyDialTab />}
              
              {/* Protect Approvals & Audit so they don't spam 401 errors */}
              {(activeTab === 'approvals' || activeTab === 'audit') && !user && (
                <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
                  <ShieldAlert className="w-12 h-12 text-amber-500 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Required</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">Please log in as a Staff member to view this secure area.</p>
                </div>
              )}

              {activeTab === 'approvals' && user && <ApprovalQueueTab />}
              {activeTab === 'audit' && user && <AuditLogTab />}
              {activeTab === 'orders' && <OrdersExplorerTab />}
              {activeTab === 'redteam' && <RedTeamPlaygroundTab />}
            </div>
          </div>
        )}
      </main>

      <ChatWidget />
      <ToastContainer />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/about" element={<PageLayout title="About Us"><About /></PageLayout>} />
        <Route path="/contact" element={<PageLayout title="Contact Us"><Contact /></PageLayout>} />
        <Route path="/privacy" element={<PageLayout title="Privacy Policy"><Privacy /></PageLayout>} />
        <Route path="/terms" element={<PageLayout title="Terms of Service"><Terms /></PageLayout>} />
      </Routes>
    </BrowserRouter>
  );
}