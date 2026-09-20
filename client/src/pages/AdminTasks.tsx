import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { Inbox } from 'lucide-react';

export default function AdminTasks() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [taskStatus, setTaskStatus] = useState('ALL');
    const [taskPriority, setTaskPriority] = useState('ALL');

    useEffect(() => {
        api.get('/tasks').then(res => {
            setTasks(res.data.data);
            setLoading(false);
        }).catch(err => {
            toast.error('Failed to load tasks');
            setLoading(false);
        });
    }, []);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (taskStatus !== 'ALL' && t.status !== taskStatus) return false;
            if (taskPriority !== 'ALL' && t.priority !== taskPriority) return false;
            return true;
        });
    }, [tasks, taskStatus, taskPriority]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold text-gray-900">Task Workspace</h2>
                    <div className="flex gap-2">
                        <select
                            className="border rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-gray-50"
                            value={taskStatus} onChange={e => setTaskStatus(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="DONE">Done</option>
                            <option value="OVERDUE">Overdue</option>
                        </select>
                        <select
                            className="border rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-gray-50"
                            value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
                        >
                            <option value="ALL">All Priority</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>
                </div>
                <div className="p-0 overflow-x-auto">
                    {filteredTasks.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center text-gray-500">
                            <Inbox className="w-10 h-10 mb-4 text-gray-300" />
                            <p className="text-sm font-medium">No tasks found</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm">No tasks match your chosen filters.</p>
                        </div>
                    ) : (
                        <div className="min-w-[850px]">
                            <div className="grid grid-cols-[minmax(320px,1fr)_120px_110px_140px_125px] gap-4 px-6 py-4 bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                <div className="font-medium">Task</div>
                                <div className="font-medium">Assignee</div>
                                <div className="font-medium">Priority</div>
                                <div className="font-medium">Status</div>
                                <div className="font-medium text-right">Due Date</div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {filteredTasks.map(t => (
                                    <div key={t.id} className="grid grid-cols-[minmax(320px,1fr)_120px_110px_140px_125px] gap-4 px-6 py-[18px] hover:bg-gray-50/50 transition">
                                        <div className="min-w-0 flex flex-col justify-center">
                                            <Link to={`/task/${t.id}`} className="font-semibold text-gray-900 hover:text-blue-600 block truncate">{t.title}</Link>
                                            <div className="text-xs text-gray-500 mt-1 truncate">{t.project?.name}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="flex items-center gap-2 block max-w-full">
                                                <div className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold uppercase">
                                                    {t.assignedDeveloper?.email ? t.assignedDeveloper.email[0] : '?'}
                                                </div>
                                                <span className="text-xs text-gray-600 truncate">{t.assignedDeveloper?.email?.split('@')[0] || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap
                                                ${t.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    t.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        t.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-gray-50 text-gray-700 border-gray-200'}`}
                                            >
                                                {t.priority}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded inline-block whitespace-nowrap
                                                ${t.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                                    t.status === 'OVERDUE' ? 'bg-red-100 text-red-700 animate-pulse' :
                                                        t.status === 'IN_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                                                            t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'}`}
                                            >
                                                {t.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <div className={`text-sm font-medium flex items-center justify-end gap-1.5 whitespace-nowrap text-gray-600`}>
                                                <span>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
