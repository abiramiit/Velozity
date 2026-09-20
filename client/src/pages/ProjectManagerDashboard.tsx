import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ActivityFeed } from '../components/ActivityFeed';
import { api } from '../lib/axios';
import { Folder, CheckSquare, Plus, Calendar, Clock, AlertCircle, Inbox } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProjectModal } from '../components/ProjectModal';
import { useSocket } from '../context/SocketContext';

export default function ProjectManagerDashboard() {
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { socket } = useSocket();

    const fetchData = () => {
        Promise.all([
            api.get('/projects'),
            api.get('/tasks')
        ]).then(([pRes, tRes]) => {
            setProjects(pRes.data.data);
            setTasks(tRes.data.data);
            setLoading(false);
        }).catch(() => {
            toast.error('Failed to load PM dashboard');
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();

        if (socket) {
            socket.on('activity:new', fetchData);
            return () => { socket.off('activity:new', fetchData); };
        }
    }, [socket]);

    const enhancedProjects = useMemo(() => {
        return projects.map(p => {
            const total = p.tasks?.length || 0;
            const completed = p.tasks?.filter((t: any) => t.status === 'DONE').length || 0;
            const overdue = p.tasks?.filter((t: any) => t.status === 'OVERDUE').length || 0;
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

            const futureDueDates = (p.tasks || [])
                .filter((t: any) => t.dueDate && new Date(t.dueDate) >= new Date())
                .map((t: any) => new Date(t.dueDate).getTime());

            const nextDue = futureDueDates.length ? new Date(Math.min(...futureDueDates)).toLocaleDateString() : 'N/A';

            const critical = p.tasks?.filter((t: any) => t.priority === 'CRITICAL').length || 0;
            const high = p.tasks?.filter((t: any) => t.priority === 'HIGH').length || 0;

            return { ...p, stats: { total, completed, overdue, progress, nextDue, critical, high } };
        });
    }, [projects]);

    const upcomingTasks = useMemo(() => {
        const notDone = tasks.filter(t => t.status !== 'DONE' && t.dueDate);
        return notDone.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 10);
    }, [tasks]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Project Manager Workspace</h1>
                <button onClick={() => setIsModalOpen(true)} className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center shadow-sm">
                    <Plus className="w-4 h-4 mr-1.5" />
                    New Project
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[14px] shadow-sm border border-gray-200 flex flex-col justify-center hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mr-3">
                            <Folder className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">My Projects</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <div className="bg-white p-6 rounded-[14px] shadow-sm border border-gray-200 flex flex-col justify-center hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                        <div className="p-2 rounded-lg bg-teal-50 text-teal-600 mr-3">
                            <CheckSquare className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Total Tasks Managed</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
                </div>
            </div>

            {/* Projects Section */}
            <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Your Projects</h2>
                </div>
                <div className="overflow-x-auto">
                    {enhancedProjects.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center text-gray-500">
                            <Inbox className="w-10 h-10 mb-4 text-gray-300" />
                            <p className="text-sm font-medium">No projects found</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm">Create a new project to get started.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium">Project</th>
                                    <th className="p-4 font-medium">Progress</th>
                                    <th className="p-4 font-medium">Tasks / Overdue</th>
                                    <th className="p-4 font-medium">High+ Prio</th>
                                    <th className="p-4 font-medium">Next Due</th>
                                    <th className="p-4 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {enhancedProjects.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-900">{p.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">{p.client?.name}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${p.stats.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${p.stats.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-700">{p.stats.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium">
                                                {p.stats.total} total <span className="mx-2 text-gray-300">|</span>
                                                <span className={p.stats.overdue > 0 ? "text-red-600 font-bold" : "text-gray-500"}>
                                                    {p.stats.overdue} overdue
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-bold bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md border border-orange-100">
                                                {p.stats.critical + p.stats.high} tasks
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center text-sm text-gray-600 gap-1.5">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {p.stats.nextDue}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link to={`/project/${p.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition duration-200">
                                                View Project
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Due Dates */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                                Upcoming Due Dates
                            </h2>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            {upcomingTasks.length === 0 ? (
                                <div className="p-16 flex flex-col items-center justify-center text-center text-gray-500">
                                    <Inbox className="w-10 h-10 mb-4 text-gray-300" />
                                    <p className="text-sm font-medium">No tasks found</p>
                                    <p className="text-xs text-gray-400 mt-1 max-w-sm">You are all caught up!</p>
                                </div>
                            ) : (
                                <div className="min-w-[850px]">
                                    <div className="grid grid-cols-[minmax(320px,1fr)_120px_110px_140px_125px] gap-4 px-6 py-4 bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                        <div className="font-medium">Task</div>
                                        <div className="font-medium">Priority</div>
                                        <div className="font-medium">Developer</div>
                                        <div className="font-medium">Status</div>
                                        <div className="font-medium text-right">Due Date</div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {upcomingTasks.map(t => {
                                            const isOverdue = new Date(t.dueDate) < new Date();
                                            return (
                                                <div key={t.id} className="grid grid-cols-[minmax(320px,1fr)_120px_110px_140px_125px] gap-4 px-6 py-[18px] hover:bg-gray-50/50 transition">
                                                    <div className="min-w-0 flex flex-col justify-center">
                                                        <Link to={`/task/${t.id}`} className="font-medium text-gray-900 hover:text-indigo-600 block truncate">{t.title}</Link>
                                                        <div className="text-xs text-gray-500 mt-1 truncate">{t.project?.name}</div>
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
                                                        <div className="flex items-center gap-2 block max-w-full">
                                                            <div className="w-6 h-6 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold uppercase">
                                                                {t.assignedDeveloper?.email ? t.assignedDeveloper.email[0] : '?'}
                                                            </div>
                                                            <span className="text-xs text-gray-600 truncate">{t.assignedDeveloper?.email?.split('@')[0] || 'Unassigned'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded inline-block whitespace-nowrap bg-gray-100 text-gray-700`}>
                                                            {t.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-end">
                                                        <div className={`text-sm font-medium flex items-center justify-end gap-1.5 whitespace-nowrap ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                                                            {isOverdue && <AlertCircle className="w-4 h-4 shrink-0" />}
                                                            <span>{new Date(t.dueDate).toLocaleDateString()}</span>
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

            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={(p) => {
                    const enhanced = { ...p, stats: { total: 0, completed: 0, overdue: 0, progress: 0, nextDue: 'N/A', critical: 0, high: 0 } };
                    setProjects(prev => [enhanced, ...prev]);
                }}
            />
        </div>
    );
}
