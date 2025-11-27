
import React, { useState } from 'react';
import { User, Bell, Lock, CreditCard, LogOut } from 'lucide-react';

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-serif text-slate-900 mb-8">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Settings Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'profile' ? 'bg-white shadow-sm border border-slate-200 text-teal-700 font-medium' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                    >
                        <User size={18} /> <span>Profile</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('billing')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'billing' ? 'bg-white shadow-sm border border-slate-200 text-teal-700 font-medium' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                    >
                        <CreditCard size={18} /> <span>Billing & Plan</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'notifications' ? 'bg-white shadow-sm border border-slate-200 text-teal-700 font-medium' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                    >
                        <Bell size={18} /> <span>Notifications</span>
                    </button>
                    
                    <div className="pt-8 mt-8 border-t border-slate-200">
                         <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50">
                            <LogOut size={18} /> <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Profile Information</h2>
                            
                            <div className="flex items-center space-x-6">
                                <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                    <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Change Photo</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none" defaultValue="Edwin O." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none" defaultValue="edwin@uon.ac.ke" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">University</label>
                                    <select className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none">
                                        <option>University of Nairobi</option>
                                        <option>Kenyatta University</option>
                                        <option>Strathmore University</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Degree Level</label>
                                    <select className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none">
                                        <option>Masters</option>
                                        <option>PhD</option>
                                        <option>Undergraduate</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">Save Changes</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Subscription Plan</h2>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="font-bold text-slate-900">Student Premium</p>
                                    <p className="text-sm text-slate-500">Billed monthly • Next billing date: Nov 12, 2023</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Active</span>
                            </div>
                            
                            <div className="pt-4">
                                <h3 className="font-bold text-slate-700 mb-3">Payment Method</h3>
                                <div className="flex items-center space-x-3 border border-slate-200 rounded-lg p-3">
                                    <CreditCard size={20} className="text-slate-400" />
                                    <span className="flex-1 font-mono text-slate-600">•••• •••• •••• 4242</span>
                                    <button className="text-sm text-teal-600 hover:underline">Edit</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Notification Preferences</h2>
                            {['Email me about deadline reminders', 'Email me about marketplace offers', 'Notify me when AI analysis is complete'].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                    <span className="text-slate-700 text-sm md:text-base">{item}</span>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in shrink-0">
                                        <input type="checkbox" name={`toggle-${idx}`} id={`toggle-${idx}`} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 checked:border-teal-400" defaultChecked />
                                        <label htmlFor={`toggle-${idx}`} className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer checked:bg-teal-400"></label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
