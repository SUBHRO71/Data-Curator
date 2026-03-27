import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Database, ShieldCheck, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Sidebar = () => {
    const location = useLocation();
    
    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Upload', path: '/upload', icon: UploadCloud },
        { name: 'My Datasets', path: '/dashboard', icon: Database }, // Mock same route for UI
    ];

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-full shadow-sm z-10 transition-all">
            <div>
                <div className="h-16 flex items-center px-6 border-b border-slate-100 mb-6">
                    <ShieldCheck className="w-8 h-8 text-indigo-600 mr-3" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Curator AI</span>
                </div>
                
                <nav className="px-4 space-y-2">
                    {links.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (location.pathname.includes('/dataset/') && item.name === 'My Datasets');
                        
                        return (
                            <Link 
                                key={item.name} 
                                to={item.path}
                                className={cn(
                                    "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                                    isActive 
                                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon className={cn(
                                    "w-5 h-5 mr-3 transition-colors",
                                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                                )} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            
            <div className="p-4 border-t border-slate-100">
                <Link to="/" className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <LogOut className="w-5 h-5 mr-3 text-slate-400" />
                    Sign Out
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;
