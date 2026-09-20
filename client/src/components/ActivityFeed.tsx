import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

export function ActivityFeed({ projectId, hideCardStyle = false, layout = 'vertical' }: { projectId?: string, hideCardStyle?: boolean, layout?: 'vertical' | 'horizontal' } = {}) {
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        const url = projectId ? `/activity?projectId=${projectId}` : '/activity';
        api.get(url).then(res => setActivities(res.data.data)).catch(console.error);

        const handleNewActivity = (e: any) => {
            if (projectId && e.detail.projectId !== projectId) return;
            setActivities(prev => [e.detail, ...prev].slice(0, 50));
        };

        window.addEventListener('new-activity', handleNewActivity);
        return () => window.removeEventListener('new-activity', handleNewActivity);
    }, []);

    if (activities.length === 0) {
        return (
            <div className={`p-8 text-center text-gray-500 ${hideCardStyle ? '' : 'bg-white rounded-[12px] shadow-sm border border-gray-200'}`}>
                <p className="text-[14px] font-medium">No recent activity in your projects.</p>
            </div>
        );
    }

    const content = (
        <ul className={`${layout === 'horizontal' ? 'flex flex-row overflow-x-auto gap-4 pb-4 px-1 snap-x' : 'divide-y divide-gray-100'} ${hideCardStyle ? '' : 'max-h-[560px] overflow-y-auto'}`}>
            {activities.length === 0 && (
                <div className="p-8 flex flex-col items-center justify-center text-gray-400 w-full min-w-[250px]">
                    <Activity className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-[14px] font-medium">No activity yet</p>
                </div>
            )}
            {activities.map((act) => (
                <li key={act.id} className={`${layout === 'horizontal' ? 'flex-shrink-0 w-[400px] bg-white border border-gray-100 rounded-[12px] p-5 shadow-sm snap-start' : 'p-4 hover:bg-gray-50/50 transition-colors'}`}>
                    <div className="flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                                <div className="w-[6px] h-[6px] rounded-full bg-indigo-500 mr-2 shrink-0"></div>
                                <h3 className="text-[14px] font-bold text-gray-900 truncate pr-2" title={act.user?.email ?? 'Unknown User'}>
                                    {act.user?.email ?? 'Unknown User'}
                                </h3>
                            </div>
                            <p className="text-[12px] font-medium text-gray-400 whitespace-nowrap">
                                {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                        <div className="text-[13px] text-gray-600 mb-3 ml-[14px]">
                            <p className="mb-1 leading-snug">
                                Moved task <span className="font-semibold text-gray-900">"{act.task?.title ?? 'a task'}"</span>
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-gray-400">from</span>
                                <span className="font-bold text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase bg-indigo-50 shadow-sm">
                                    {act.oldStatus?.replace('_', ' ') ?? 'UNKNOWN'}
                                </span>
                                <span className="text-gray-400 font-bold mx-1">➔</span>
                                <span className="font-bold text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase bg-emerald-50 shadow-sm">
                                    {act.newStatus?.replace('_', ' ') ?? 'UNKNOWN'}
                                </span>
                            </div>
                        </div>
                        <p className="text-[12px] font-medium text-gray-400 truncate ml-[14px]" title={act.project?.name ?? 'Unknown Project'}>
                            Project: {act.project?.name ?? 'Unknown Project'}
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    );

    if (hideCardStyle) {
        return content;
    }

    return (
        <div className="bg-white rounded-[12px] shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-gray-200 bg-white">
                <h3 className="text-[18px] md:text-[20px] font-bold text-gray-900">Live Activity Feed</h3>
            </div>
            {content}
        </div>
    );
}
