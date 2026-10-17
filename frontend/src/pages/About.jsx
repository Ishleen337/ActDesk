import React from 'react';
import { Mail, Globe, Code2, Sparkles } from 'lucide-react';

export default function About() {
  const team = [
    { 
      name: "Ishleen Kaur", 
      role: "Full Stack Lead & System Architect", 
      desc: "Architected the complete React frontend and designed the premium user interface. Connected the UI to the FastAPI backend, integrated the interactive chat widget, and ensured seamless routing for the D2C storefront and operations dashboard.",
      image: "/team.png",
      imagePosition: "0% 0%",
      github: "https://github.com/Ishleen337/Ishleen337",
      linkedin: "https://www.linkedin.com/in/ishleen-kaur-92b452316",
      email: "ishleenk722@gmail.com"
    },
    { 
      name: "Arshiya", 
      role: "Backend & Policy Engine", 
      desc: "Built the FastAPI server and implemented the critical server-side Autonomy Policy Engine. Designed the rule evaluation logic to prevent prompt injection, enforced ₹500 refund limits, and built the Idempotency checks to ensure safe, duplicate-free financial transactions.",
      image: "/team.png",
      imagePosition: "100% 0%",
      github: "https://github.com/arshiyaa28",
      linkedin: "https://www.linkedin.com/in/arshiya-434980330",
      email: "arshiyagoel28@gmail.com"
    },
    { 
      name: "Abhishek Goyal", 
      role: "AI & NLP Engineer", 
      desc: "Engineered the intent parsing pipeline that enables the chatbot to natively understand English, Hindi, and Hinglish. Integrated the language model for tool calling, optimized the system for low latency, and ensured complex user queries are correctly routed to the backend.",
      image: "/team.png",
      imagePosition: "100% 100%",
      github: "https://github.com/Goyal-Abhi",
      linkedin: "https://www.linkedin.com/in/abhishek-goyal25",
      email: "abhishek3167.beai24@chitkara.edu.in"
    },
    { 
      name: "Jayant Garg", 
      role: "Database & Infrastructure Engineer", 
      desc: "Designed the dual-database architecture using PostgreSQL for transactional order data and MongoDB Atlas for storing unstructured conversation transcripts. Configured Redis caching, implemented rate limiting, and ensured high availability and security across the system.",
      image: "/team.png",
      imagePosition: "0% 100%",
      github: "https://github.com/JayantGrg",
      linkedin: "https://www.linkedin.com/in/jayant-garg-032539320",
      email: "jayant3206.beai24@chitkara.edu.in"
    }
  ];

  return (
    <div className="w-full animate-fade-in">
      
      {/* Hero Section with Premium Glow */}
      <div className="relative text-center max-w-4xl mx-auto mb-12 py-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none -z-10"></div>

        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
          Building the Trust Layer for AI in <span className="text-emerald-500">D2C Commerce</span>.
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
          We believe AI shouldn't just deflect tickets—it should resolve them. Giving an AI access to money and order states is dangerous without guardrails. That's why we built ActDesk, combining natural language understanding with strict server-side policy enforcement.
        </p>
      </div>

      {/* The Team */}
      <div>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Meet the Team</h2>
          <p className="text-slate-500 dark:text-slate-400">The four engineers from Chitkara University who built ActDesk.</p>
        </div>
        
        {/* 4 cards in a single row on desktop, filling the full width */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {team.map((member) => (
            <div key={member.name} className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group">
              
              <div className="flex flex-col items-center text-center mb-4">
                <div 
                  className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 ring-4 ring-emerald-50 dark:ring-emerald-950/40 shrink-0 shadow-sm mb-3"
                  style={{
                    backgroundImage: `url('${member.image}')`,
                    backgroundSize: '200% 200%',
                    backgroundPosition: member.imagePosition
                  }}
                />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{member.name}</h3>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">{member.role}</p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5 flex-1 text-center">
                {member.desc}
              </p>
              
              {/* Social Links Centered */}
              <div className="flex items-center justify-center gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <a href={member.github} target="_blank" rel="noreferrer" title="GitHub" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 transition border border-slate-200 dark:border-slate-700">
                  <Code2 className="w-3.5 h-3.5" />
                </a>
                <a href={member.linkedin} target="_blank" rel="noreferrer" title="LinkedIn" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white hover:bg-[#0A66C2] transition border border-slate-200 dark:border-slate-700">
                  <Globe className="w-3.5 h-3.5" />
                </a>
                <a href={`mailto:${member.email}`} title="Email" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white hover:bg-emerald-600 transition border border-slate-200 dark:border-slate-700">
                  <Mail className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}