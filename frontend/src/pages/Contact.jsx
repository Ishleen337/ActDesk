import React, { useState } from 'react';
import { MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const firstName = e.target[0].value;
    const lastName = e.target[1].value;
    const email = e.target[2].value;
    const message = e.target[3].value;

    // Open the user's default email app
    const mailtoLink = `mailto:ishleen3197.beai24@chitkara.edu.in?subject=ActDesk Inquiry from ${firstName} ${lastName}&body=Name: ${firstName} ${lastName}%0D%0AEmail: ${email}%0D%0A%0D%0AMessage:%0D%0A${message}`;
    window.location.href = mailtoLink;

    setSubmitted(true);
  };

  return (
    // Reduced top padding from py-12 to py-4
    <div className="max-w-2xl mx-auto py-4 px-4 animate-fade-in">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
          Get in Touch
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
          Have a question about our Autonomy Dial or need a demo for your D2C brand? Drop us a message below.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-emerald-500/5">
        
        {submitted ? (
          // Success State
          <div className="text-center py-8 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Message Prepared!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto text-sm">
              Your default email app should have opened with the message. If not, you can email us directly at ishleen3197.beai24@chitkara.edu.in
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Send another message
            </button>
          </div>
        ) : (
          // Form State
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">First Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter your first name" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-slate-900 dark:text-white placeholder:text-slate-400" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Last Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter your last name" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-slate-900 dark:text-white placeholder:text-slate-400" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Work Email</label>
              <input 
                type="email" 
                required
                placeholder="Enter your work email" 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-slate-900 dark:text-white placeholder:text-slate-400" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">How can we help?</label>
              <textarea 
                rows={5} 
                required
                placeholder="Tell us about your store or ask a question..." 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow resize-none text-slate-900 dark:text-white placeholder:text-slate-400" 
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 group mt-2"
            >
              <span>Send Message</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        )}
      </div>

    </div>
  );
}