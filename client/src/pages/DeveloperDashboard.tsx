import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/axios';
import { CheckSquare, AlertCircle, Calendar, Inbox } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ActivityFeed } from '../components/ActivityFeed';
import { useSocket } from '../context/SocketContext';

export default function DeveloperDashboard() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [projectFilter, setProjectFilter] = useState('ALL');
    const { socket } = useSocket();

    const fetchTasks = () => {
        api.get('/tasks').then(res => {
            setTasks(res.data.data);
            setLoading(false);
        }).catch(() => {
            toast.error('Failed to load tasks');
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchTasks();

        if (socket) {
            socket.on('activity:new', fetchTasks);
            return () => { socket.off('activity:new', fetchTasks); };
        }
    }, [socket]);

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            console.log("[DEBUG] Updating task", { taskId, status: newStatus });
            await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
            toast.success('Task status updated');
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (error: any) {
            console.error("[STATUS UPDATE ERROR]", {
                status: error.response?.status,
                data: error.response?.data,
                taskId,
            });
            toast.error(error.response?.data?.message || 'Failed to update task status');
        }
    };

    const uniqueProjects = useMemo(() => {
        const projMap = new Map();
        tasks.forEach(t => {
            if (t.project) projMap.set(t.project.id, t.project.name);
        });
        return Array.from(projMap.entries()).map(([id, name]) => ({ id, name }));
    }, [tasks]);

    const filteredAndSortedTasks = useMemo(() => {
        const filtered = tasks.filter(t => {
            if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
            if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
            if (projectFilter !== 'ALL' && t.projectId !== projectFilter) return false;
            return true;
        });

        const priorityWeights: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };

        return filtered.sort((a, b) => {
            if (priorityWeights[a.priority] !== priorityWeights[b.priority]) {
                return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0); // Descending priority
            }
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); // Ascending date
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return 0;
        });
    }, [tasks, statusFilter, priorityFilter, projectFilter]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const uncompletedTasks = tasks.filter(t => t.status !== 'DONE');
    const overdueTasks = tasks.filter(t => t.status === 'OVERDUE');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900">My Assigned Workspace</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[14px] shadow-sm border border-gray-200 flex flex-col justify-center hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mr-3">
                            <CheckSquare className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Active Tasks</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{uncompletedTasks.length}</p>
                </div>
                <div className="bg-white p-6 rounded-[14px] shadow-sm border border-gray-200 flex flex-col justify-center hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                        <div className="p-2 rounded-lg bg-red-50 text-red-600 mr-3">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Overdue Tasks</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{overdueTasks.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">My Assigned Tasks</h2>
                            <div className="flex flex-wrap gap-2">
                                <select
                                    className="border rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-white shadow-sm"
                                    value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
                                >
                                    <option value="ALL">All Projects</option>
                                    {uniqueProjects.map(p => <option key={`proj-${p.id}`} value={p.id}>{p.name}</option>)}
                                </select>
                                <select
                                    className="border rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-white shadow-sm"
                                    value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="TODO">TODO</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="IN_REVIEW">In Review</option>
                                    <option value="DONE">Done</option>
                                    <option value="OVERDUE">Overdue</option>
                                </select>
                                <select
                                    className="border rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-white shadow-sm"
                                    value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
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
                            {filteredAndSortedTasks.length === 0 ? (
                                <div className="p-16 flex flex-col items-center justify-center text-center text-gray-500">
                                    <Inbox className="w-10 h-10 mb-4 text-gray-300" />
                                    <p className="text-sm font-medium">No tasks found</p>
                                    <p className="text-xs text-gray-400 mt-1 max-w-sm">No tasks match your chosen filters.</p>
                                </div>
                            ) : (
                                <div className="min-w-[700px]">
                                    <div className="grid grid-cols-[minmax(320px,1fr)_110px_150px_125px] gap-4 px-6 py-4 bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                        <div className="font-medium">Task / Project</div>
                                        <div className="font-medium">Priority</div>
                                        <div className="font-medium">Status</div>
                                        <div className="font-medium text-right">Due Date</div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {filteredAndSortedTasks.map(t => {
                                            const isOverdue = t.status === 'OVERDUE' || (t.dueDate && new Date(t.dueDate) < new Date());
                                            return (
                                                <div key={t.id} className="grid grid-cols-[minmax(320px,1fr)_110px_150px_125px] gap-4 px-6 py-[18px] hover:bg-gray-50/50 transition">
                                                    <div className="min-w-0 flex flex-col justify-center">
                                                        <Link to={`/task/${t.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 block truncate">{t.title}</Link>
                                                        <Link to={`/project/${t.projectId}`} className="text-xs font-medium text-gray-500 mt-1 hover:text-indigo-500 hover:underline truncate">{t.project?.name}</Link>
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
                                                        <select
                                                            className={`text-xs font-semibold px-2 py-1 rounded-md border outline-none
                                                                ${t.status === 'DONE' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    t.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                                                                        t.status === 'IN_REVIEW' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                                                                            t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                                'bg-gray-50 text-gray-700 border-gray-200'}`}
                                                            value={t.status}
                                                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                                        >
                                                            <option value="TODO">To Do</option>
                                                            <option value="IN_PROGRESS">In Progress</option>
                                                            <option value="IN_REVIEW">In Review</option>
                                                            <option value="DONE">Done</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center justify-end">
                                                        <div className={`text-sm font-medium flex items-center justify-end gap-1.5 whitespace-nowrap ${isOverdue && t.status !== 'DONE' ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                                            {isOverdue && t.status !== 'DONE' && <AlertCircle className="w-4 h-4 shrink-0" />}
                                                            <span>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No Due Date'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}
