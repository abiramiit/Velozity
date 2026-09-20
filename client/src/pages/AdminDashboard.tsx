import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ActivityFeed } from '../components/ActivityFeed';
import { api } from '../lib/axios';
import { useSocket } from '../context/SocketContext';
import { Users, Folder, CheckSquare, AlertCircle, Search, Filter, Calendar, Plus, MessageSquare, Mail, Inbox, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProjectModal } from '../components/ProjectModal';
import { UserModal } from '../components/UserModal';
import { ClientModal } from '../components/ClientModal';

export default function AdminDashboard() {
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [usersOnline, setUsersOnline] = useState<number>(1);
    const { socket } = useSocket();
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    const [projSearch, setProjSearch] = useState('');
    const [projFilter, setProjFilter] = useState<'All' | 'Active' | 'Completed' | 'Has Overdue'>('All');

    const [taskStatus, setTaskStatus] = useState('ALL');
    const [taskPriority, setTaskPriority] = useState('ALL');

    const [showMsgModal, setShowMsgModal] = useState<{ id: string, name: string } | null>(null);
    const [msgText, setMsgText] = useState('');
    const [sending, setSending] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showMsgModal || !msgText.trim()) return;
        setSending(true);
        try {
            await api.post('/notifications', { recipientId: showMsgModal.id, message: msgText });
            toast.success('Message sent to PM successfully!');
            setMsgText('');
            setShowMsgModal(null);
        } catch (err: any) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const fetchData = () => {
        Promise.all([
            api.get('/projects'),
            api.get('/tasks')
        ]).then(([pRes, tRes]) => {
            setProjects(pRes.data.data);
            setTasks(tRes.data.data);
            setLoading(false);
        }).catch(err => {
            toast.error('Failed to load dashboard data');
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();

        if (socket) {
            socket.on('activity:new', fetchData);
            socket.on('users:online', (count: number) => setUsersOnline(count));
            return () => {
                socket.off('activity:new', fetchData);
                socket.off('users:online');
            };
        }
    }, [socket]);

    const enhancedProjects = useMemo(() => {
        return projects.map(p => {
            const total = p.tasks?.length || 0;
            const completed = p.tasks?.filter((t: any) => t.status === 'DONE').length || 0;
            const inProgress = p.tasks?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0;
            const inReview = p.tasks?.filter((t: any) => t.status === 'IN_REVIEW').length || 0;
            const overdue = p.tasks?.filter((t: any) => t.status === 'OVERDUE').length || 0;
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

            const futureDueDates = (p.tasks || [])
                .filter((t: any) => t.dueDate && new Date(t.dueDate) >= new Date())
                .map((t: any) => new Date(t.dueDate).getTime());
            const nextDue = futureDueDates.length ? new Date(Math.min(...futureDueDates)).toLocaleDateString() : 'N/A';

            return { ...p, stats: { total, completed, inProgress, inReview, overdue, progress, nextDue } };
        });
    }, [projects]);

    const filteredProjects = useMemo(() => {
        return enhancedProjects.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(projSearch.toLowerCase()) ||
                p.client?.name.toLowerCase().includes(projSearch.toLowerCase()) ||
                p.createdBy?.email.toLowerCase().includes(projSearch.toLowerCase());
            if (!matchesSearch) return false;

            if (projFilter === 'Active') return p.stats.progress < 100 && p.stats.progress > 0;
            if (projFilter === 'Completed') return p.stats.progress === 100 && p.stats.total > 0;
            if (projFilter === 'Has Overdue') return p.stats.overdue > 0;
            return true;
        });
    }, [enhancedProjects, projSearch, projFilter]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (taskStatus !== 'ALL' && t.status !== taskStatus) return false;
            if (taskPriority !== 'ALL' && t.priority !== taskPriority) return false;
            return true;
        });
    }, [tasks, taskStatus, taskPriority]);

    const overdueCount = tasks.filter(t => t.status === 'OVERDUE').length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-[28px] md:text-[32px] font-bold text-gray-900 flex-1">Admin Dashboard</h1>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsClientModalOpen(true)} className="h-[40px] md:h-[44px] px-5 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-[14px] md:text-[15px] font-semibold transition shadow-sm">
                        + New Client
                    </button>
                    <button onClick={() => setIsUserModalOpen(true)} className="h-[40px] md:h-[44px] px-5 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[14px] md:text-[15px] font-semibold transition shadow-sm">
                        + New User
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 md:p-6 rounded-[12px] shadow-sm border border-gray-200 flex flex-col justify-center min-h-[120px] hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mr-3">
                            <Folder className="w-5 h-5" />
                        </div>
                        <p className="text-[14px] font-semibold text-gray-600">Total Projects</p>
                    </div>
                    <p className="text-[28px] md:text-[32px] font-bold text-gray-900">{projects.length}</p>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-[12px] shadow-sm border border-gray-200 flex flex-col justify-center min-h-[120px] hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mr-3">
                            <CheckSquare className="w-5 h-5" />
                        </div>
                        <p className="text-[14px] font-semibold text-gray-600">Total Tasks</p>
                    </div>
                    <p className="text-[28px] md:text-[32px] font-bold text-gray-900">{tasks.length}</p>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-[12px] shadow-sm border border-gray-200 flex flex-col justify-center min-h-[120px] hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                        <div className="p-2 rounded-lg bg-red-50 text-red-600 mr-3">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <p className="text-[14px] font-semibold text-gray-600">Overdue Tasks</p>
                    </div>
                    <p className="text-[28px] md:text-[32px] font-bold text-gray-900">{overdueCount}</p>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-[12px] shadow-sm border border-gray-200 flex flex-col justify-center min-h-[120px] hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                        <div className="p-2 rounded-lg bg-indigo-50/70 text-indigo-700 mr-3">
                            <Users className="w-5 h-5" />
                        </div>
                        <p className="text-[14px] font-semibold text-gray-600">Users Online</p>
                    </div>
                    <p className="text-[28px] md:text-[32px] font-bold text-gray-900">{usersOnline}</p>
                </div>
            </div>

            {/* Projects Overview */}
            <div className="bg-white rounded-[12px] shadow-sm border border-gray-200 w-full min-w-0 flex flex-col">
                <div className="p-5 md:p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-[20px] md:text-[22px] font-bold text-gray-900">Projects Overview</h2>
                            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white h-[40px] px-4 rounded-lg text-sm font-semibold transition flex items-center shadow-sm">
                                <Plus className="w-4 h-4 mr-1.5 shrink-0" />
                                New Project
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={projSearch}
                                    onChange={(e) => setProjSearch(e.target.value)}
                                    className="h-[40px] pl-9 pr-4 text-[14px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-[240px] shadow-sm"
                                />
                            </div>
                            <div className="flex bg-gray-50 rounded-lg p-1 text-[13px] h-[40px] items-center border border-gray-200">
                                {['All', 'Active', 'Completed', 'Has Overdue'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setProjFilter(f as any)}
                                        className={`px-3 py-1.5 rounded-md whitespace-nowrap transition h-full font-medium ${projFilter === f ? 'bg-white shadow-sm border border-gray-200 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto w-full">
                    {filteredProjects.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center text-gray-500">
                            <Inbox className="w-10 h-10 mb-4 text-gray-300" />
                            <p className="text-[15px] font-semibold">No projects found</p>
                            <p className="text-[14px] text-gray-400 mt-1 max-w-sm">Try adjusting your filters or create a new project above.</p>
                        </div>
                    ) : (
                        <div className="min-w-[900px] w-full">
                            <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1.8fr)_minmax(0,2.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)] gap-4 px-6 py-4 bg-gray-50 text-gray-500 text-[12px] uppercase tracking-wider border-b border-gray-100 font-semibold items-center">
                                <div>Project Details</div>
                                <div>Progress</div>
                                <div className="text-center">Tasks (T/P/R/D/O)</div>
                                <div>Next Due</div>
                                <div className="text-right">Action</div>
                            </div>
                            <div className="divide-y divide-gray-100 w-full flex flex-col">
                                {filteredProjects.map(p => (
                                    <div key={p.id} className="grid grid-cols-[minmax(0,3fr)_minmax(0,1.8fr)_minmax(0,2.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)] gap-4 px-6 min-h-[72px] items-center hover:bg-gray-50/50 transition">
                                        <div className="flex flex-col py-3 min-w-0 pr-4">
                                            <div className="text-[16px] font-semibold text-gray-900 truncate" title={p.name}>{p.name}</div>
                                            <div className="text-[13px] text-gray-500 flex items-center gap-1 mt-1 truncate">
                                                <span className="truncate">{p.client?.name}</span> • <span className="truncate">{p.createdBy?.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pr-4">
                                            <div className="w-full max-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${p.stats.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${p.stats.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[14px] font-semibold text-gray-700 w-9">{p.stats.progress}%</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5 text-[13px] font-bold">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200 min-w-[28px] text-center">{p.stats.total}</span> <span className="text-gray-300">/</span>
                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 min-w-[28px] text-center" title="In Progress">{p.stats.inProgress}</span> <span className="text-gray-300">/</span>
                                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 min-w-[28px] text-center" title="In Review">{p.stats.inReview}</span> <span className="text-gray-300">/</span>
                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 min-w-[28px] text-center" title="Done">{p.stats.completed}</span> <span className="text-gray-300">/</span>
                                            <span className={`px-2 py-0.5 rounded border min-w-[28px] text-center ${p.stats.overdue > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-100'}`} title="Overdue">{p.stats.overdue}</span>
                                        </div>
                                        <div className="flex items-center text-[14px] font-medium text-gray-700 gap-2 pr-4">
                                            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                            {p.stats.nextDue}
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setShowMsgModal({ id: p.createdById, name: p.createdBy?.email })} className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition" title="Message PM">
                                                <MessageSquare className="w-[18px] h-[18px]" />
                                            </button>
                                            <Link to={`/project/${p.id}`} className="text-indigo-600 hover:text-indigo-800 text-[14px] font-semibold bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition border border-indigo-100 whitespace-nowrap">
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="flex flex-col gap-6 lg:gap-8 w-full min-w-0">
                {/* Task Overview */}
                <div className="space-y-6 w-full min-w-0 flex flex-col">
                    <div className="bg-white rounded-[12px] shadow-sm border border-gray-200 overflow-hidden w-full">
                        <div className="p-5 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
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
                                    <div className="grid grid-cols-[minmax(0,3.5fr)_minmax(0,1.8fr)_minmax(0,1.5fr)_minmax(0,1.7fr)_minmax(0,1.5fr)] gap-4 px-6 py-4 bg-gray-50 text-gray-500 text-[12px] uppercase tracking-wider border-b border-gray-100 font-semibold items-center">
                                        <div>Task</div>
                                        <div>Developer</div>
                                        <div>Priority</div>
                                        <div>Status</div>
                                        <div className="text-right">Due Date</div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {filteredTasks.slice(0, 15).map(t => (
                                            <div key={t.id} className="grid grid-cols-[minmax(0,3.5fr)_minmax(0,1.8fr)_minmax(0,1.5fr)_minmax(0,1.7fr)_minmax(0,1.5fr)] gap-4 px-6 min-h-[64px] md:min-h-[72px] items-center hover:bg-gray-50/50 transition">
                                                <div className="min-w-0 flex flex-col justify-center">
                                                    <Link to={`/task/${t.id}`} className="font-medium text-gray-900 hover:text-blue-600 block truncate" title={t.title}>{t.title}</Link>
                                                    <div className="text-xs text-gray-500 mt-1 truncate" title={t.project?.name}>{t.project?.name}</div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="flex items-center gap-2 block max-w-full">
                                                        <div className="w-6 h-6 shrink-0 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase">
                                                            {t.assignedDeveloper?.email ? t.assignedDeveloper.email[0] : '?'}
                                                        </div>
                                                        <span className="text-[13px] font-medium text-gray-700 truncate">{t.assignedDeveloper?.email?.split('@')[0] || 'Unassigned'}</span>
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
                                                            t.status === 'OVERDUE' ? 'bg-red-100 text-red-700 font-extrabold shadow-sm' :
                                                                t.status === 'IN_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                                                                    t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-gray-100 text-gray-700'}`}
                                                    >
                                                        {t.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    <div className={`text-[13px] font-bold flex items-center gap-1.5 whitespace-nowrap ${t.status === 'OVERDUE' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE') ? 'text-red-600' : 'text-gray-700'}`}>
                                                        {t.status === 'OVERDUE' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE') ? <Clock className="w-4 h-4 shrink-0" /> : null}
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

                {/* Activity Feed Sidebar */}
                <div className="bg-white rounded-[12px] shadow-sm border border-gray-200 flex flex-col w-full min-w-0 overflow-hidden">
                    <div className="p-5 md:p-6 border-b border-gray-200 shrink-0 bg-white flex justify-between items-center">
                        <h2 className="text-[20px] md:text-[22px] font-bold text-gray-900">Live Activity Feed</h2>
                        <Link to="/admin/activity" className="text-[13px] font-bold text-indigo-600 hover:text-indigo-800 transition mr-2 tracking-wide">View All</Link>
                    </div>
                    <div className="p-5 w-full bg-gray-50/50">
                        <ActivityFeed hideCardStyle={true} layout="horizontal" />
                    </div>
                </div>
            </div>

            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={(p) => {
                    const enhanced = { ...p, stats: { total: 0, completed: 0, inProgress: 0, inReview: 0, overdue: 0, progress: 0, nextDue: 'N/A' } };
                    setProjects(prev => [enhanced, ...prev]);
                }}
            />
            <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />
            <ClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} />

            {showMsgModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-[14px] shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <Mail className="w-5 h-5 mr-2 text-indigo-600" />
                                Send Message
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">To: {showMsgModal.name}</p>
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                <textarea
                                    value={msgText}
                                    onChange={(e) => setMsgText(e.target.value)}
                                    rows={4}
                                    required
                                    placeholder="Type your message to the PM..."
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowMsgModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={sending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition disabled:opacity-50 flex items-center">
                                    {sending ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
