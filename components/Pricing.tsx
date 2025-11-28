
import React, { useState } from 'react';
import { Check, X, Zap, GraduationCap, Crown, Shield, HelpCircle, Clock, Sparkles, CreditCard, AlertCircle } from 'lucide-react';

export const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semester'>('semester');

  const plans = [
    {
      name: 'Basic',
      price: 0,
      description: 'Essential tools for drafting and basic checks.',
      limit: '2,000 AI Tokens/mo',
      features: [
        '1 Active Document',
        'Basic Grammar & Spell Check',
        'Standard Citation Generator',
        'Export to Watermarked PDF'
      ],
      notIncluded: [
        'Advanced AI Co-Pilot',
        'Plagiarism Detection',
        'Deep Logic Critique',
        'Reference Library Sync'
      ],
      icon: GraduationCap,
      color: 'slate',
      cta: 'Start Free'
    },
    {
      name: 'Student Pro',
      price: billingCycle === 'monthly' ? 850 : 2900, // KES
      period: billingCycle === 'monthly' ? '/mo' : '/sem',
      savings: billingCycle === 'semester' ? 'Save 15%' : null,
      description: 'Perfect for Undergrad & Masters theses.',
      limit: '50,000 AI Tokens/mo',
      isPopular: true,
      features: [
        'Unlimited Documents',
        'Advanced Style & Tone AI',
        'Reference Manager (Zotero Sync)',
        'Export to Word, PDF & LaTeX',
        '1 Basic Plagiarism Scan/mo'
      ],
      notIncluded: [
        'Deep Logic (Thinking Mode)',
        'Grant Proposal Generator'
      ],
      icon: Zap,
      color: 'teal',
      cta: 'Go Pro'
    },
    {
      name: 'Power User',
      price: billingCycle === 'monthly' ? 2500 : 8500, // KES
      period: billingCycle === 'monthly' ? '/mo' : '/sem',
      savings: billingCycle === 'semester' ? 'Save 15%' : null,
      description: 'For PhDs, Researchers & Grant Writers.',
      limit: '200,000 AI Tokens/mo',
      features: [
        'Everything in Student Pro',
        'Deep Logic Critique (Gemini 2.0 Thinking)',
        'Grant & Slide Deck Generator',
        'Advanced Data Visualization Tools',
        'Priority Support & API Access'
      ],
      notIncluded: [],
      icon: Crown,
      color: 'indigo',
      cta: 'Get Power'
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in pb-20">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">Flexible Plans for Every Stage</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          From first draft to final defense. Upgrade or downgrade anytime.
        </p>
        
        {/* Billing Toggle */}
        <div className="flex justify-center items-center mt-8 bg-white p-1.5 rounded-full border border-slate-200 shadow-sm inline-flex">
          <button 
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingCycle('semester')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'semester' ? 'bg-teal-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Semester (4 Mo)
            <span className="bg-white text-teal-700 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Best Value</span>
          </button>
        </div>
      </div>

      {/* Main Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div 
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-sm border transition-all duration-300 flex flex-col ${plan.isPopular ? 'border-teal-500 ring-2 ring-teal-500 ring-opacity-20 shadow-xl scale-105 z-10' : 'border-slate-200 hover:border-teal-200 hover:shadow-md'}`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-teal-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-md whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div className="p-6 md:p-8 border-b border-slate-100">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.color === 'teal' ? 'bg-teal-100 text-teal-600' : plan.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-2 h-10">{plan.description}</p>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-bold text-slate-900">KES {plan.price.toLocaleString()}</span>
                  {plan.price > 0 && <span className="text-slate-500 ml-1 text-sm font-medium">{plan.period}</span>}
                </div>
                {plan.savings && <p className="text-xs text-green-600 font-bold mt-1">{plan.savings}</p>}
              </div>

              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="mb-6 p-3 bg-slate-50 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2 border border-slate-100">
                   <Sparkles size={14} className="text-teal-500" />
                   <span>Limit: {plan.limit}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <Check size={16} className="text-teal-500 mr-2 mt-0.5 shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm opacity-50">
                      <X size={16} className="text-slate-400 mr-2 mt-0.5 shrink-0" />
                      <span className="text-slate-500 line-through">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                    plan.isPopular 
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200' 
                      : plan.price === 0 
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special Offers / Add-ons Grid */}
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Sparkles className="text-amber-500" size={24} /> Add-ons & Passes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          
          {/* Weekly Sprint Pass */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Clock size={100} />
              </div>
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg">Crunch Time Pass</h3>
                      <span className="bg-amber-400 text-slate-900 text-xs font-bold px-2 py-1 rounded uppercase">Weekly</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-6">7 Days of 'Power User' access. Perfect for deadline week or one-off complex assignments.</p>
                  <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">KES 350</span>
                      <button className="px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg hover:bg-amber-50 transition-colors">
                          Get Pass
                      </button>
                  </div>
              </div>
          </div>

          {/* Token Top Up */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                      <Sparkles size={18} className="text-teal-500" /> AI Token Top-up
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">Running low on thoughts? Add 25,000 tokens to any plan anytime. Tokens never expire.</p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xl font-bold text-slate-800">KES 250</span>
                  <button className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors">
                      Top Up
                  </button>
              </div>
          </div>

          {/* Plagiarism Check */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                      <Shield size={18} className="text-rose-500" /> Deep Plagiarism Scan
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">One-off detailed report checking against 10B+ web pages and journals. Detailed sources.</p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xl font-bold text-slate-800">KES 500</span>
                  <button className="px-4 py-2 bg-rose-50 text-rose-700 text-sm font-bold rounded-lg hover:bg-rose-100 transition-colors">
                      Scan Now
                  </button>
              </div>
          </div>
      </div>

      {/* Trust & FAQ */}
      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
        <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2">How are tokens counted?</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                    Generally, 1,000 tokens is about 750 words. A standard "Review" or "Rewrite" might use 500-1,000 tokens. "Deep Logic Critique" uses more as it involves complex reasoning models.
                </p>
            </div>
            <div className="w-px h-16 bg-slate-200 hidden md:block"></div>
            <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2">Can I cancel my subscription?</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                    Yes, anytime. Your access continues until the end of the billing period. We offer refunds within 3 days if you are not satisfied with the Pro plans.
                </p>
            </div>
        </div>
      </div>

    </div>
  );
};
