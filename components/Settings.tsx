
import React, { useState } from 'react';
import { User, Bell, CreditCard, LogOut, Link, Fingerprint, Library, Cloud, CheckCircle2, Loader2, ExternalLink, BookOpen, FileText, Activity, X } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface SettingsProps {
    onSignOut?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onSignOut }) => {
    const [activeTab, setActiveTab] = useState('integrations'); 
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    const [userIntegrations, setUserIntegrations] = useState([
        {
            category: 'Identity & Verification',
            items: [
                { name: 'ORCID iD', id: 'orcid', desc: 'Sync publication history & verify academic identity.', connected: true, icon: Fingerprint, url: 'https://orcid.org/signin' },
                { name: 'LinkedIn', id: 'linkedin', desc: 'Verify professional credentials for marketplace experts.', connected: false, icon: User, url: 'https://www.linkedin.com/login' },
            ]
        },
        {
            category: 'Research Libraries',
            items: [
                { name: 'Zotero', id: 'zotero', desc: 'Sync your personal Zotero library collections.', connected: false, icon: Library, url: 'https://www.zotero.org/user/login' },
                { name: 'Mendeley', id: 'mendeley', desc: 'Import references from your Mendeley account.', connected: false, icon: BookOpen, url: 'https://www.mendeley.com/login' },
                { name: 'Semantic Scholar', id: 'semanticscholar', desc: 'Enable AI-powered paper recommendations.', connected: true, icon: FileText, url: 'https://www.semanticscholar.org/' },
            ]
        },
        {
            category: 'Storage & Backup',
            items: [
                { name: 'Google Drive', id: 'gdrive', desc: 'Auto-backup thesis drafts to your personal cloud.', connected: true, icon: Cloud, url: 'https://accounts.google.com/signin' },
            ]
        }
    ]);

    const handleConnect = (serviceId: string, url: string) => {
        setConnectingId(serviceId);
        
        // Simulate OAuth Popup
        const width = 500;
        const height = 600;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        
        const popup = window.open(
            url, 
            'Connect Service', 
            `width=${width},height=${height},top=${top},left=${left},status=yes,scrollbars=yes`
        );

        // Simulate asynchronous API handshake
        setTimeout(() => {
            if (popup && !popup.closed) popup.close();
            
            setUserIntegrations(prev => prev.map(group => ({
                ...group,
                items: group.items.map(item => 
                    item.id === serviceId ? { ...item, connected: true } : item
                )
            })));
            
            setConnectingId(null);
            
            // In a real app, we would store tokens securely here
            if (serviceId === 'zotero' || serviceId === 'mendeley') {
                localStorage.setItem(`${serviceId}_connected`, 'true');
            }
        }, 2500);
    };

    const handleDisconnect = (serviceId: string) => {
        if (window.confirm("Are you sure you want to disconnect? Features relying on this integration will stop working.")) {
            setUserIntegrations(prev => prev.map(group => ({
                ...group,
                items: group.items.map(item => 
                    item.id === serviceId ? { ...item, connected: false } : item
                )
            })));
            localStorage.removeItem(`${serviceId}_connected`);
        }
    };

    const handleTestConnection = async () => {
        setTestStatus('loading');
        const result = await GeminiService.testConnection();
        setTestStatus(result.success ? 'success' : 'error');
        setTestMessage(result.message);
    };

    const connectedCount = userIntegrations.reduce((acc, group) => 
        acc + group.items.filter(i => i.connected).length, 0
    );

    // Safe environment variable check for display
    const metaEnv = (import.meta as any).env || {};
    const processEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};
    const keyStatus = metaEnv.VITE_API_KEY ? 'Present (VITE_API_KEY detected)' : 
                      metaEnv.VITE_GEMINI_API_KEY ? 'Present (VITE_GEMINI_API_KEY detected)' : 
                      processEnv.API_KEY ? 'Present (process.env.API_KEY detected)' : 
                      'Not Detected';

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-bold font-serif text-zinc-900 mb-8">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Settings Sidebar */}
                <div className="w-full md:w-64 space-y-2 shrink-0">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'profile' ? 'bg-white shadow-sm border border-zinc-200 text-indigo-700 font-medium' : 'text-zinc-600 hover:bg-white hover:text-zinc-900'}`}
                    >
                        <User size={18} /> <span>Profile</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('billing')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'billing' ? 'bg-white shadow-sm border border-zinc-200 text-indigo-700 font-medium' : 'text-zinc-600 hover:bg-white hover:text-zinc-900'}`}
                    >
                        <CreditCard size={18} /> <span>Billing & Plan</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'notifications' ? 'bg-white shadow-sm border border-zinc-200 text-indigo-700 font-medium' : 'text-zinc-600 hover:bg-white hover:text-zinc-900'}`}
                    >
                        <Bell size={18} /> <span>Notifications</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('integrations')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'integrations' ? 'bg-white shadow-sm border border-zinc-200 text-indigo-700 font-medium' : 'text-zinc-600 hover:bg-white hover:text-zinc-900'}`}
                    >
                        <Link size={18} /> <span>Integrations</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('diagnostics')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'diagnostics' ? 'bg-white shadow-sm border border-zinc-200 text-indigo-700 font-medium' : 'text-zinc-600 hover:bg-white hover:text-zinc-900'}`}
                    >
                        <Activity size={18} /> <span>Diagnostics</span>
                    </button>
                    
                    <div className="pt-8 mt-8 border-t border-zinc-200">
                         <button 
                            onClick={onSignOut}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                         >
                            <LogOut size={18} /> <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 p-6 md:p-8">
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-zinc-800 mb-4">Profile Information</h2>
                            
                            <div className="flex items-center space-x-6">
                                <div className="w-24 h-24 rounded-full bg-zinc-200 overflow-hidden shrink-0">
                                    <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <button className="px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50">Change Photo</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                                    <input type="text" className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" defaultValue="Edwin O." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                                    <input type="email" className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" defaultValue="edwin@uon.ac.ke" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">University</label>
                                    <select className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                        <option>University of Nairobi</option>
                                        <option>Kenyatta University</option>
                                        <option>Strathmore University</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Degree Level</label>
                                    <select className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                        <option>Masters</option>
                                        <option>PhD</option>
                                        <option>Undergraduate</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button className="px-6 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800">Save Changes</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-zinc-800">Subscription Plan</h2>
                            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="font-bold text-zinc-900">Student Premium</p>
                                    <p className="text-sm text-zinc-500">Billed monthly • Next billing date: Nov 12, 2023</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Active</span>
                            </div>
                            
                            <div className="pt-4">
                                <h3 className="font-bold text-zinc-700 mb-3">Payment Method</h3>
                                <div className="flex items-center space-x-3 border border-zinc-200 rounded-lg p-3">
                                    <CreditCard size={20} className="text-zinc-400" />
                                    <span className="flex-1 font-mono text-zinc-600">•••• •••• •••• 4242</span>
                                    <button className="text-sm text-indigo-600 hover:underline">Edit</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-xl font-bold text-zinc-800 mb-4">Notification Preferences</h2>
                            {['Email me about deadline reminders', 'Email me about marketplace offers', 'Notify me when AI analysis is complete'].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                                    <span className="text-zinc-700 text-sm md:text-base">{item}</span>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in shrink-0">
                                        <input type="checkbox" name={`toggle-${idx}`} id={`toggle-${idx}`} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 checked:border-indigo-400" defaultChecked />
                                        <label htmlFor={`toggle-${idx}`} className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer checked:bg-indigo-400"></label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                         <div className="space-y-8 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-800">Account Connections</h2>
                                    <p className="text-zinc-500 text-sm">Link your personal accounts to import data.</p>
                                </div>
                                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">{connectedCount} Connected</span>
                            </div>

                            <div className="space-y-6">
                                {userIntegrations.map((group, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">{group.category}</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {group.items.map((api) => (
                                                <div key={api.id} className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg hover:border-indigo-200 transition-colors bg-zinc-50/50">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`p-2 rounded-lg ${api.connected ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-200 text-zinc-400'}`}>
                                                            <api.icon size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-zinc-800">{api.name}</h4>
                                                                {api.connected && <CheckCircle2 size={14} className="text-indigo-500" />}
                                                            </div>
                                                            <p className="text-xs text-zinc-500 max-w-sm hidden sm:block">{api.desc}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {api.connected ? (
                                                        <button 
                                                            onClick={() => handleDisconnect(api.id)}
                                                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white border border-zinc-200 text-zinc-600 hover:text-red-600 hover:border-red-200 flex items-center gap-2"
                                                        >
                                                            Disconnect
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleConnect(api.id, api.url)}
                                                            disabled={!!connectingId}
                                                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-zinc-900 text-white hover:bg-zinc-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {connectingId === api.id ? (
                                                                <>
                                                                    <Loader2 size={12} className="animate-spin" /> Connecting...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Connect <ExternalLink size={10} />
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'diagnostics' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-zinc-800">System Diagnostics</h2>
                            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6">
                                <h3 className="font-bold text-zinc-700 mb-2">Gemini API Connection</h3>
                                <p className="text-sm text-zinc-500 mb-4">Verify that your API key is correctly configured and the application can reach Google's servers.</p>
                                
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={handleTestConnection} 
                                        disabled={testStatus === 'loading'}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {testStatus === 'loading' && <Loader2 size={16} className="animate-spin" />}
                                        {testStatus === 'loading' ? 'Testing...' : 'Test Connection'}
                                    </button>
                                    
                                    {testStatus === 'success' && (
                                        <span className="text-green-600 text-sm font-medium flex items-center gap-2">
                                            <CheckCircle2 size={16} /> {testMessage}
                                        </span>
                                    )}
                                    
                                    {testStatus === 'error' && (
                                        <span className="text-red-600 text-sm font-medium flex items-center gap-2">
                                            <X size={16} /> {testMessage}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="mt-4 p-3 bg-white border border-zinc-200 rounded text-xs font-mono text-zinc-600 break-all">
                                    <strong>Key Status: </strong>
                                    {keyStatus}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
