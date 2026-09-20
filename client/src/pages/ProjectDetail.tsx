import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { ActivityFeed } from '../components/ActivityFeed';
import { ArrowLeft, Clock, Calendar, Shield, LayoutDashboard, PlusCircle, CheckSquare, AlertCircle, Plus, Users, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TaskModal } from '../components/TaskModal';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [showMsgModal, setShowMsgModal] = useState<{ id: string, name: string } | null>(null);
    const [msgText, setMsgText] = useState('');
    const [sending, setSending] = useState(false);
    const { socket } = useSocket();

    const fetchProject = () => {
        api.get(`/projects/${id}`).then(res => {
            setProject(res.data.data);
            setLoading(false);
        }).catch(err => {
            if (loading) {
                toast.error(err.response?.data?.error?.message || 'Failed to load project details');
                navigate(-1);
            }
        });
    };

    useEffect(() => {
        fetchProject();
        if (socket) {
            socket.on('activity:new', fetchProject);
            return () => { socket.off('activity:new', fetchProject); }
        }
    }, [id, navigate, socket]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!project) return null;

    const tasks = project.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'DONE').length;
    const overdue = tasks.filter((t: any) => t.status === 'OVERDUE').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const teamStats = (() => {
        const devs = new Map<string, any>();
        for (const t of tasks) {
            if (!t.assignedDeveloper) continue;
            const devId = t.assignedDeveloper.id;
            if (!devs.has(devId)) {
                devs.set(devId, { id: devId, email: t.assignedDeveloper.email, total: 0, completed: 0, inProgress: 0, inReview: 0, overdue: 0 });
            }
            const stat = devs.get(devId);
            stat.total++;
            if (t.status === 'DONE') stat.completed++;
            if (t.status === 'IN_PROGRESS') stat.inProgress++;
            if (t.status === 'IN_REVIEW') stat.inReview++;
            if (t.status === 'OVERDUE' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE')) stat.overdue++;
        }
        return Array.from(devs.values());
    })();

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showMsgModal || !msgText.trim()) return;
        setSending(true);
        try {
            await api.post('/notifications', { recipientId: showMsgModal.id, message: msgText });
            toast.success('Message sent successfully!');
            setMsgText('');
            setShowMsgModal(null);
        } catch (err: any) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                <button onClick={() => navigate(-1)} className="hover:text-indigo-600 flex items-center transition">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                </button>
                <span>/</span>
                <span className="text-gray-900">{project.name}</span>
            </div>

            <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                        <p className="text-gray-600 max-w-2xl">{project.description || 'No description provided.'}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600 pt-2">
                            <span className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <Shield className="w-4 h-4 mr-2 text-indigo-500" />
                                Client: <span className="text-gray-900 ml-1">{project.client?.name}</span>
                            </span>
                            <span className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <Calendar className="w-4 h-4 mr-2 text-teal-500" />
                                Created: <span className="text-gray-900 ml-1">{new Date(project.createdAt).toLocaleDateString()}</span>
                            </span>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-[14px] border border-gray-100 min-w-[250px]">
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">Project Progress</h3>
                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-3xl font-bold text-gray-900">{progress}%</span>
                            <span className="text-sm text-gray-500 mb-1">completed</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs font-medium text-gray-600">
                            <span>{completed} Done</span>
                            <span>{total} Total</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                <CheckSquare className="w-5 h-5 mr-2 text-indigo-600" />
                                Task Board
                            </h2>
                            {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
                                <button onClick={() => setIsTaskModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center shadow-sm">
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    New Task
                                </button>
                            )}
                        </div>
                        <div className="p-0 overflow-x-auto">
                            {tasks.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">No tasks created yet.</div>
                            ) : (
                                <div className="min-w-[700px]">
                                    <div className="grid grid-cols-[minmax(250px,1fr)_120px_110px_140px_125px] gap-4 px-6 py-4 bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                        <div className="font-medium">Task</div>
                                        <div className="font-medium">Assignee</div>
                                        <div className="font-medium">Priority</div>
                                        <div className="font-medium">Status</div>
                                        <div className="font-medium text-right">Due Date</div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {tasks.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((t: any) => {
                                            const isOverdue = t.status === 'OVERDUE' || (t.dueDate && new Date(t.dueDate) < new Date());
                                            return (
                                                <div key={t.id} className="grid grid-cols-[minmax(250px,1fr)_120px_110px_140px_125px] gap-4 px-6 py-[18px] hover:bg-gray-50/50 transition bg-white">
                                                    <div className="min-w-0 flex flex-col justify-center">
                                                        <Link to={`/task/${t.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 block truncate">{t.title}</Link>
                                                        {t.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{t.description}</p>}
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
                                                        <div className={`text-sm font-medium flex items-center justify-end gap-1.5 whitespace-nowrap ${isOverdue && t.status !== 'DONE' ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                                            {isOverdue && t.status !== 'DONE' && <AlertCircle className="w-4 h-4 shrink-0" />}
                                                            <span>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</span>
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

                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                                Team Workload
                            </h2>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            {teamStats.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No developers assigned to this project yet.</div>
                            ) : (
                                <div className="min-w-[800px]">
                                    <div className="grid grid-cols-[minmax(200px,1fr)_90px_90px_90px_90px_90px_120px] gap-4 px-6 py-4 bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                        <div className="font-medium">Developer</div>
                                        <div className="font-medium">Assigned</div>
                                        <div className="font-medium">Completed</div>
                                        <div className="font-medium">In Progress</div>
                                        <div className="font-medium">In Review</div>
                                        <div className="font-medium">Overdue</div>
                                        <div className="font-medium text-right">Actions</div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {teamStats.map(stat => (
                                            <div key={stat.id} className="grid grid-cols-[minmax(200px,1fr)_90px_90px_90px_90px_90px_120px] gap-4 px-6 py-[18px] hover:bg-gray-50 transition bg-white">
                                                <div className="font-semibold text-gray-900 flex items-center truncate">{stat.email}</div>
                                                <div className="flex items-center"><span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold text-center w-8">{stat.total}</span></div>
                                                <div className="flex items-center"><span className="px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-md text-xs font-bold text-center w-8">{stat.completed}</span></div>
                                                <div className="flex items-center"><span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-bold text-center w-8">{stat.inProgress}</span></div>
                                                <div className="flex items-center"><span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-md text-xs font-bold text-center w-8">{stat.inReview}</span></div>
                                                <div className="flex items-center"><span className={`px-2 py-1 rounded-md text-xs font-bold text-center w-8 border ${stat.overdue > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-500 border-transparent'}`}>{stat.overdue}</span></div>
                                                <div className="flex items-center justify-end text-right">
                                                    <button onClick={() => setShowMsgModal({ id: stat.id, name: stat.email })} className="text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition shadow-sm">
                                                        <MessageSquare className="w-4 h-4 mr-1.5" /> Message
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Project Activity</h2>
                    <ActivityFeed projectId={project.id} />
                </div>
            </div>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                projectId={project.id}
                onSuccess={(task) => {
                    const enhanced = { ...task, activityLogs: [] };
                    setProject({ ...project, tasks: [enhanced, ...project.tasks] });
                }}
            />

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
                                    placeholder="Type your message here..."
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
