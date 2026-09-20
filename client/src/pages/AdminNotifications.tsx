import React, { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { Bell } from 'lucide-react';

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/notifications').then(res => {
            setNotifications(res.data.data);
            setLoading(false);
        }).catch(() => {
            toast.error('Failed to load notifications');
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900">System Notifications</h2>
            <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-0 overflow-x-auto">
                    {notifications.length === 0 ? (
                        <div className="p-16 text-center text-gray-500">No new notifications.</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {notifications.map(n => (
                                <li key={n.id} className={`p-4 flex gap-4 ${n.read ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-50/50 transition`}>
                                    <div className="p-2 bg-white rounded-full shadow-sm text-blue-600 h-10 w-10 flex items-center justify-center shrink-0">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{n.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
