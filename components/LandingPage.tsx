
import React from 'react';
import { 
  ArrowRight, BookOpen, GraduationCap, Sparkles, Cpu, Globe, BarChart2, Users, Shield
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-blue-100 selection:text-blue-900 relative">
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 bg-white" style={{
        backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
      }}></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/30">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold font-serif tracking-tight text-slate-900">ScholarSync</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onGetStarted} className="text-sm font-bold text-slate-600 hover:text-blue-600 hidden sm:block">Log In</button>
            <button 
              onClick={onGetStarted}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pb-32 px-6 overflow-hidden bg-transparent">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* Left Column: Text */}
          <div className="space-y-8 animate-fade-in-up text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100 shadow-sm mx-auto lg:mx-0">
              <Sparkles size={14} className="animate-pulse-subtle" /> Powered by Gemini 3.0
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-[1.1] text-slate-900 tracking-tight">
              Academic <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">Sync.</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0 font-light">
              The advanced AI companion for scholarly excellence. Automate formatting, synthesize literature, and validate your thesis with verified precision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
              <button 
                onClick={onGetStarted}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 hover:scale-105"
              >
                Start Writing Free <ArrowRight size={20} />
              </button>
              <button className="px-8 py-4 rounded-xl text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm">
                <Globe size={20} /> View Demo
              </button>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 pt-4 border-t border-slate-200">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="font-medium">Trusted by thousands of researchers</p>
            </div>
          </div>
          
          {/* Right Column: Visual */}
          <div className="relative animate-fade-in mt-10 lg:mt-0 flex justify-center" style={{ animationDelay: '0.2s' }}>
            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-sky-400 rounded-2xl blur opacity-20 transform rotate-2"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 md:p-8 w-full max-w-lg transform hover:-translate-y-1 transition-transform duration-500">
               <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-red-400"></div>
                     <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                     <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs font-mono text-slate-400 font-bold uppercase">Research_Project_v2.docx</div>
               </div>
               <div className="space-y-6 font-serif text-slate-800">
                  <h3 className="text-2xl font-bold">4.2 Results & Discussion</h3>
                  <div className="space-y-4 text-base leading-relaxed text-slate-600">
                      <p>The analysis reveals a <span className="bg-blue-50 text-blue-700 px-1 border-b-2 border-blue-200 font-medium">statistically significant correlation</span> between the variables studied.</p>
                      
                      {/* AI Card */}
                      <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-blue-500 text-sm font-sans shadow-inner my-4">
                          <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-xs uppercase">
                              <Cpu size={14} /> AI Analysis
                          </div>
                          <p className="text-slate-700 italic">"Consider strengthening this claim by referencing recent peer-reviewed sources from the last 24 months."</p>
                          <div className="flex gap-2 mt-3">
                              <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 shadow-sm transition-colors">Find Sources</button>
                          </div>
                      </div>
                      
                      <p>Furthermore, qualitative interviews suggest that early adopters prioritize...</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white border-y border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">Everything You Need to Graduate</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">We combine advanced AI with strict academic standards to help you write faster and better.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: 'Institutional Templates', desc: 'Pre-configured formats for major universities worldwide. Margins, fonts, and spacing auto-set.' },
              { icon: Sparkles, title: 'AI Co-Pilot', desc: 'Generate outlines, paraphrase text, and fix grammar with an AI trained specifically on academic papers.' },
              { icon: BarChart2, title: 'Data Visualization', desc: 'Describe your data, and we generate publication-ready APA charts and graphs instantly.' },
              { icon: Users, title: 'Marketplace', desc: 'Hire vetted statisticians and proofreaders directly within the ScholarSync platform.' },
              { icon: Shield, title: 'Integrity Audit', desc: 'Integrated scanning to ensure your work maintains the highest academic standards.' },
              { icon: Globe, title: 'Research Library', desc: 'Find and manage citations from global journals and open access repositories in one place.' },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all group border border-slate-100 duration-300">
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                  <feature.icon size={28} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-24 bg-slate-900 text-white relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-4 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {[
              { label: 'Projects Completed', value: '5,000+' },
              { label: 'Institutions Supported', value: '120+' },
              { label: 'Research Hours Saved', value: '250k+' },
              { label: 'AI Words Generated', value: '50M+' },
            ].map((stat, i) => (
              <div key={i} className="pt-8 md:pt-0 px-4">
                <div className="text-5xl font-bold text-blue-400 mb-4 tracking-tight">{stat.value}</div>
                <div className="text-slate-400 text-sm uppercase tracking-widest font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 text-center bg-white border-t border-slate-200 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6 tracking-tight">Ready to Write Your Best Work?</h2>
          <p className="text-xl text-slate-600 mb-12 font-light">Join thousands of researchers accelerating their work today.</p>
          <button 
            onClick={onGetStarted}
            className="bg-blue-600 text-white px-12 py-5 rounded-full text-lg font-bold hover:bg-blue-700 hover:shadow-2xl hover:scale-105 transition-all shadow-blue-500/30"
          >
            Create Free Account
          </button>
          <p className="mt-8 text-sm text-slate-400 font-medium uppercase tracking-wide">Secure · Private · Collaborative</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded text-white shadow-sm">
                <GraduationCap size={18} />
            </div>
            <span className="font-bold font-serif text-lg text-slate-900">ScholarSync</span>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            © {new Date().getFullYear()} ScholarSync. Built for the modern researcher.
          </div>
          <div className="flex gap-8 text-sm text-slate-600 font-medium">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
