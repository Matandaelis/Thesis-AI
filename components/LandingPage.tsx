
import React from 'react';
import { 
  ArrowRight, BookOpen, GraduationCap, Sparkles, CheckCircle2, 
  BarChart2, Users, Shield, Globe
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ThesisAI",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "description": "The first AI-powered academic writing platform tailored for Kenyan universities.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KES"
    },
    "featureList": [
      "University Templates",
      "AI Co-Pilot",
      "Data Visualization",
      "Plagiarism Check"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "2000"
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-teal-600 p-1.5 rounded-lg text-white">
            <GraduationCap size={24} />
          </div>
          <span className="text-xl font-bold font-serif tracking-tight">ThesisAI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
          <a href="#universities" className="hover:text-teal-600 transition-colors">Universities</a>
          <a href="#pricing" className="hover:text-teal-600 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onGetStarted} className="text-sm font-bold text-slate-600 hover:text-teal-600 hidden sm:block">Log In</button>
          <button 
            onClick={onGetStarted}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-16 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-100">
              <Sparkles size={14} /> New: Gemini 2.5 Integration
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight text-slate-900">
              Master Your Thesis <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">With AI Precision</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
              The first AI-powered academic writing platform tailored for Kenyan universities. Automate formatting, deep-dive research, and get PhD-level critiques in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onGetStarted}
                className="bg-teal-600 text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/30 flex items-center justify-center gap-2"
              >
                Start Writing Free <ArrowRight size={20} />
              </button>
              <button className="px-8 py-4 rounded-xl text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Globe size={20} /> View Demo
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 pt-4">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p>Trusted by 2,000+ students</p>
            </div>
          </div>
          
          <div className="relative hidden md:block animate-fade-in">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[2rem] blur-2xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 rotate-2 hover:rotate-0 transition-transform duration-500">
               <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-red-400"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                     <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs font-mono text-slate-400">Analysis_Mode.tsx</div>
               </div>
               <div className="space-y-4 font-mono text-sm">
                  <div className="flex gap-4">
                     <div className="w-8 text-slate-300 text-right">1</div>
                     <div className="text-slate-800">Chapter 4: Results & Discussion</div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-8 text-slate-300 text-right">2</div>
                     <div className="text-slate-600 pl-4">The data indicates a <span className="bg-red-100 text-red-600 px-1 rounded">significant correlation</span> between...</div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-8 text-slate-300 text-right">3</div>
                     <div className="text-teal-600 pl-4 bg-teal-50 p-2 rounded border-l-2 border-teal-500">
                        AI Suggestion: "Consider using 'strong positive correlation' (r=0.85) to be more precise."
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-8 text-slate-300 text-right">4</div>
                     <div className="text-slate-600 pl-4">mobile adoption and economic growth in rural areas.</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">Everything You Need to Graduate</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We combine advanced LLMs with strict academic standards to help you write faster and better.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: 'University Templates', desc: 'Pre-configured formats for UoN, KU, Strathmore, and more. Never worry about margins again.' },
              { icon: Sparkles, title: 'AI Co-Pilot', desc: 'Generate outlines, paraphrase text, and fix grammar with an AI trained on academic papers.' },
              { icon: BarChart2, title: 'Data Visualization', desc: 'Describe your data, and we generate publication-ready APA charts and graphs instantly.' },
              { icon: Users, title: 'Marketplace', desc: 'Stuck? Hire vetted statisticians and proofreaders directly within the platform.' },
              { icon: Shield, title: 'Plagiarism Check', desc: 'Integrated scanning to ensure your work is 100% original before submission.' },
              { icon: Globe, title: 'Research Library', desc: 'Find and manage citations from Google Scholar and reputable journals in one place.' },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-slate-50 hover:bg-teal-50/50 hover:shadow-lg transition-all group border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} className="text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {[
              { label: 'Theses Completed', value: '1,200+' },
              { label: 'Universities Supported', value: '45+' },
              { label: 'Hours Saved', value: '50k+' },
              { label: 'AI Words Generated', value: '10M+' },
            ].map((stat, i) => (
              <div key={i} className="pt-8 md:pt-0 px-4">
                <div className="text-4xl font-bold text-teal-400 mb-2">{stat.value}</div>
                <div className="text-slate-400 text-sm uppercase tracking-wider font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-slate-900 mb-6">Ready to Write Your Best Work?</h2>
          <p className="text-xl text-slate-600 mb-10">Join thousands of Kenyan students accelerating their research today.</p>
          <button 
            onClick={onGetStarted}
            className="bg-teal-600 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-teal-700 hover:shadow-2xl hover:scale-105 transition-all"
          >
            Create Free Account
          </button>
          <p className="mt-6 text-sm text-slate-500">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-teal-600" />
            <span className="font-bold font-serif text-slate-900">ThesisAI</span>
          </div>
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} ThesisAI. Built for Academia.
          </div>
          <div className="flex gap-6 text-sm text-slate-600 font-medium">
            <a href="#" className="hover:text-teal-600">Privacy</a>
            <a href="#" className="hover:text-teal-600">Terms</a>
            <a href="#" className="hover:text-teal-600">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
