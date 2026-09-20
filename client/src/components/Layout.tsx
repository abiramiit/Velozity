import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Link, useLocation } from 'react-router-dom';
import { Bell, LogOut, LayoutDashboard, CheckSquare, Folder, Users, Activity, Settings, BarChart, Server } from 'lucide-react';
import { api } from '../lib/axios';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        api.get('/notifications').then(res => {
            setUnreadCount(res.data.data.filter((n: any) => !n.read).length);
        }).catch(console.error);

        const handleNewNotif = () => setUnreadCount(p => p + 1);
        window.addEventListener('new-notification', handleNewNotif);
        return () => window.removeEventListener('new-notification', handleNewNotif);
    }, []);

    const getLinks = () => {
        switch (user?.role) {
            case 'ADMIN': return [
                { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
                { name: 'Projects', path: '/admin/projects', icon: Folder },
                { name: 'Tasks', path: '/admin/tasks', icon: CheckSquare },
                { name: 'Clients', path: '/admin/clients', icon: Server },
                { name: 'Users', path: '/admin/users', icon: Users },
                { name: 'Activity', path: '/admin/activity', icon: Activity },
                { name: 'Notifications', path: '/admin/notifications', icon: Bell }
            ];
            case 'PROJECT_MANAGER': return [
                { name: 'Dashboard', path: '/pm', icon: LayoutDashboard },
                { name: 'My Projects', path: '/pm/projects', icon: Folder },
                { name: 'My Team', path: '/pm/team', icon: Users },
                { name: 'Tasks', path: '/pm/tasks', icon: CheckSquare },
                { name: 'Activity', path: '/pm/activity', icon: Activity },
                { name: 'Notifications', path: '/pm/notifications', icon: Bell }
            ];
            case 'DEVELOPER': return [
                { name: 'My Tasks', path: '/dev', icon: CheckSquare },
                { name: 'Activity', path: '/dev/activity', icon: Activity },
                { name: 'Notifications', path: '/dev/notifications', icon: Bell }
            ];
            default: return [];
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="w-8 h-8 rounded bg-indigo-600 mr-3 flex items-center justify-center text-white font-bold">V</div>
                    <span className="font-bold text-lg tracking-tight text-gray-900">Velozity</span>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {getLinks().map(link => {
                        const active = location.pathname === link.path;
                        const Icon = link.icon;
                        return (
                            <Link key={link.path} to={link.path} className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 font-medium hover:bg-gray-100 hover:text-gray-900'}`}>
                                <Icon className={`mr-3 h-[18px] w-[18px] ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                                {link.name}
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center px-3 py-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{user?.email}</p>
                            <p className="text-xs text-gray-500 font-medium tracking-wide mt-0.5">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F8FAFC]">
                <header className="h-16 bg-white border-b border-gray-100 flex flex-shrink-0 items-center justify-end px-8 z-10 sticky top-0">
                    <div className="flex items-center space-x-6">
                        <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                            )}
                        </button>
                        <button onClick={logout} className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center transition-colors">
                            <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
                    <div className="w-full max-w-[1600px] mx-auto min-h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
