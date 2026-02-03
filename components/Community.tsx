
import React, { useState } from 'react';
import { MessageSquare, Heart, Share2, Users, UserPlus, MoreVertical } from 'lucide-react';

const mockPosts = [
  {
    id: 1,
    user: 'Sarah M.',
    uni: 'UoN',
    avatar: 'https://i.pravatar.cc/150?img=5',
    time: '2 hours ago',
    content: 'Just finished my data collection phase! 📊 For those using ODK, make sure to double-check your skip logic before deployment. Saved me a headache.',
    tags: ['Data Collection', 'Tips'],
    likes: 24,
    comments: 5
  },
  {
    id: 2,
    user: 'David K.',
    uni: 'KU',
    avatar: 'https://i.pravatar.cc/150?img=3',
    time: '4 hours ago',
    content: 'Looking for a peer reviewer for my Chapter 2 (Literature Review). Topic is Renewable Energy adoption in rural Kenya. Happy to swap!',
    tags: ['Peer Review', 'Environment'],
    likes: 12,
    comments: 8
  },
  {
    id: 3,
    user: 'Prof. Omondi',
    uni: 'Mentor',
    avatar: 'https://i.pravatar.cc/150?img=11',
    time: '1 day ago',
    content: 'Reminder: The submission deadline for the Annual Research Conference is next Friday. Ensure your abstracts follow the new APA 7 guidelines.',
    tags: ['Announcements', 'Deadline'],
    likes: 85,
    comments: 14
  }
];

const studyGroups = [
  { id: 1, name: 'MBA Cohort 2024', members: 142 },
  { id: 2, name: 'Data Analysis Geeks', members: 89 },
  { id: 3, name: 'Late Night Writers', members: 356 },
];

export const Community: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [posts, setPosts] = useState(mockPosts);

  const handleLike = (id: number) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar - Navigation */}
        <div className="hidden lg:block space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 mb-4 px-2">Topics</h3>
              <nav className="space-y-1">
                 {['All', 'Discussion', 'Peer Review', 'Data Analysis', 'Motivation'].map(topic => (
                    <button 
                      key={topic}
                      onClick={() => setFilter(topic)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === topic ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                       # {topic}
                    </button>
                 ))}
              </nav>
           </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
           {/* Post Creator */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex gap-4">
                 <img src="https://i.pravatar.cc/150?img=11" className="w-10 h-10 rounded-full bg-slate-200" />
                 <input 
                    className="flex-1 bg-slate-50 rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    placeholder="Share your progress or ask a question..."
                 />
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
                 <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">Post</button>
              </div>
           </div>

           {/* Posts */}
           {posts.map(post => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                       <img src={post.avatar} className="w-10 h-10 rounded-full border border-slate-100" />
                       <div>
                          <h4 className="font-bold text-slate-900 text-sm">{post.user}</h4>
                          <p className="text-xs text-slate-500">{post.uni} • {post.time}</p>
                       </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
                 </div>
                 
                 <p className="text-slate-700 text-sm leading-relaxed mb-4">{post.content}</p>
                 
                 <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                       <span key={tag} className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">#{tag}</span>
                    ))}
                 </div>

                 <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-slate-500">
                    <button onClick={() => handleLike(post.id)} className="flex items-center gap-1.5 text-sm hover:text-rose-500 transition-colors">
                       <Heart size={18} /> {post.likes}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm hover:text-blue-600 transition-colors">
                       <MessageSquare size={18} /> {post.comments}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm hover:text-slate-800 transition-colors">
                       <Share2 size={18} /> Share
                    </button>
                 </div>
              </div>
           ))}
        </div>

        {/* Right Sidebar - Groups */}
        <div className="hidden lg:block space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <Users size={18} className="text-blue-600" /> Active Groups
              </h3>
              <div className="space-y-4">
                 {studyGroups.map(group => (
                    <div key={group.id} className="flex items-center justify-between">
                       <div>
                          <h4 className="text-sm font-bold text-slate-700">{group.name}</h4>
                          <p className="text-xs text-slate-500">{group.members} Members</p>
                       </div>
                       <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                          <UserPlus size={16} />
                       </button>
                    </div>
                 ))}
              </div>
              <button className="w-full mt-6 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg py-2 hover:bg-slate-50 transition-colors">
                 View All Groups
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
