import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { ArrowLeft, Clock, Calendar, CheckSquare, AlertCircle, LayoutDashboard, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function TaskDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        api.get(`/tasks/${id}`).then(res => {
            setTask(res.data.data);
            setLoading(false);
        }).catch(err => {
            toast.error(err.response?.data?.error?.message || 'Failed to load task details');
            navigate(-1);
        });

        const handleNewActivity = (e: any) => {
            if (e.detail.taskId === id) {
                // Refresh task to get new status natively from WebSocket broadcast
                api.get(`/tasks/${id}`).then(res => setTask(res.data.data));
            }
        };
        window.addEventListener('new-activity', handleNewActivity);
        return () => window.removeEventListener('new-activity', handleNewActivity);
    }, [id, navigate]);

    const handleStatusChange = async (newStatus: string) => {
        setUpdating(true);
        try {
            await api.patch(`/tasks/${task.id}/status`, { status: newStatus });
            toast.success('Task status updated natively');
            // The socket will trigger handleNewActivity -> auto-refresh
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!task) return null;

    const isOverdue = task.status === 'OVERDUE' || (task.dueDate && new Date(task.dueDate) < new Date());

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                <button onClick={() => navigate(-1)} className="hover:text-indigo-600 flex items-center transition">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                </button>
                <span>/</span>
                <Link to={`/project/${task.project?.id}`} className="hover:text-indigo-600 truncate max-w-[200px]">{task.project?.name}</Link>
                <span>/</span>
                <span className="text-gray-900 truncate">Task {task.title}</span>
            </div>

            <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 pb-10 border-b border-gray-100 relative">
                    <div className="absolute top-8 right-8">
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider shadow-sm
                            ${task.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                                task.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    task.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        'bg-gray-50 text-gray-700 border-gray-200'}`}
                        >
                            {task.priority} Priority
                        </span>
                    </div>

                    <div className="max-w-3xl">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{task.title}</h1>
                        <p className="text-gray-600 text-lg leading-relaxed">{task.description || 'No description provided.'}</p>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-6 items-center">
                        <div className="flex items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                            <Clock className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status</p>
                                <p className="font-semibold text-gray-900">{task.status.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <div className={`flex items-center px-4 py-2 rounded-xl border ${isOverdue && task.status !== 'DONE' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                            <Calendar className={`w-5 h-5 mr-3 ${isOverdue && task.status !== 'DONE' ? 'text-red-500' : 'text-gray-400'}`} />
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Due Date</p>
                                <p className={`font-semibold ${isOverdue && task.status !== 'DONE' ? 'text-red-700' : 'text-gray-900'}`}>
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/50">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-4">Actions</h3>

                    <div className="flex flex-wrap gap-3">
                        {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(status => (
                            <button
                                key={status}
                                disabled={updating || task.status === status}
                                onClick={() => handleStatusChange(status)}
                                className={`px-4 py-2 font-medium text-sm rounded-lg border transition shadow-sm
                                    ${task.status === status
                                        ? 'bg-indigo-600 text-white border-indigo-600 opacity-100 shadow-indigo-200'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 opacity-80 hover:opacity-100'} 
                                    ${updating ? 'cursor-not-allowed' : ''}`}
                            >
                                Mark as {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Task Activity Logs */}
            <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Task History</h3>

                {task.activityLogs?.length === 0 ? (
                    <p className="text-gray-500">No activity yet.</p>
                ) : (
                    <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        {task.activityLogs?.map((log: any, index: number) => (
                            <li key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    <Flag className="w-4 h-4" />
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-gray-900 text-sm">{log.user?.email}</h4>
                                        <time className="text-xs text-gray-500">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</time>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Transitioned from <span className="font-medium bg-gray-100 px-1.5 py-0.5 rounded border">{log.oldStatus.replace('_', ' ')}</span> to <span className="font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">{log.newStatus.replace('_', ' ')}</span>
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
