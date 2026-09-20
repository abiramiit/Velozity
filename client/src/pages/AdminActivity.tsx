import React from 'react';
import { ActivityFeed } from '../components/ActivityFeed';

export default function AdminActivity() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900">Live Activity Feed</h2>
            <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 overflow-hidden">
                <ActivityFeed />
            </div>
        </div>
    );
}
