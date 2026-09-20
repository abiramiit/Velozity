import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/axios';
import { Calendar, Search, Plus, MessageSquare, Mail, Inbox } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProjectModal } from '../components/ProjectModal';

export default function AdminProjects() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projSearch, setProjSearch] = useState('');
    const [projFilter, setProjFilter] = useState<'All' | 'Active' | 'Completed' | 'Has Overdue'>('All');
    const [showMsgModal, setShowMsgModal] = useState<{ id: string, name: string } | null>(null);
    const [msgText, setMsgText] = useState('');
    const [sending, setSending] = useState(false);

    const fetchData = () => {
        api.get('/projects').then(res => {
            setProjects(res.data.data);
            setLoading(false);
        }).catch(err => {
            toast.error('Failed to load projects');
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-bold text-gray-900">Projects Workspace</h2>
                            <button onClick={() => setIsModalOpen(true)} className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center shadow-sm">
                                <Plus className="w-4 h-4 mr-1.5" />
                                New Project
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search projects, client..."
                                    value={projSearch}
                                    onChange={(e) => setProjSearch(e.target.value)}
                                    className="pl-9 pr-4 h-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                                />
                            </div>
                            <div className="flex bg-gray-100 rounded-lg p-1 text-sm h-10 items-center">
                                {['All', 'Active', 'Completed', 'Has Overdue'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setProjFilter(f as any)}
                                        className={`px-3 py-1.5 rounded-md whitespace-nowrap transition h-full flex items-center ${projFilter === f ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-0 overflow-x-auto">
                    {filteredProjects.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center text-gray-500">
                            <Inbox className="w-10 h-10 mb-4 text-gray-300" />
                            <p className="text-sm font-medium">No projects found</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm">Try adjusting your filters or create a new project above.</p>
                        </div>
                    ) : (
                        <div className="min-w-[900px]">
                            <div className="grid grid-cols-[minmax(250px,1fr)_120px_200px_120px_140px] gap-4 px-6 py-4 bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                <div className="font-medium">Project Details</div>
                                <div className="font-medium">Progress</div>
                                <div className="font-medium">Tasks (T/P/R/D/O)</div>
                                <div className="font-medium">Next Due</div>
                                <div className="font-medium text-right">Actions</div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {filteredProjects.map(p => (
                                    <div key={p.id} className="grid grid-cols-[minmax(250px,1fr)_120px_200px_120px_140px] gap-4 px-6 py-[18px] hover:bg-gray-50/50 transition">
                                        <div className="flex flex-col justify-center min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                                <span>{p.client?.name}</span> • <span>{p.createdBy?.email.split('@')[0]}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${p.stats.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${p.stats.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-700 w-8">{p.stats.progress}%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="flex items-center gap-1.5 text-xs font-medium">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded shadow-sm">{p.stats.total}</span>
                                                <span className="text-gray-300">/</span>
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100" title="In Progress">{p.stats.inProgress}</span>
                                                <span className="text-gray-300">/</span>
                                                <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-100" title="In Review">{p.stats.inReview}</span>
                                                <span className="text-gray-300">/</span>
                                                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100" title="Done">{p.stats.completed}</span>
                                                <span className="text-gray-300">/</span>
                                                <span className={`px-2 py-0.5 rounded border ${p.stats.overdue > 0 ? 'bg-red-50 text-red-700 border-red-200 font-bold' : 'bg-gray-50 text-gray-500 border-gray-100'}`} title="Overdue">{p.stats.overdue}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="flex items-center text-sm text-gray-600 gap-1.5 truncate">
                                                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span className="truncate">{p.stats.nextDue}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setShowMsgModal({ id: p.createdById, name: p.createdBy?.email })} className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition border border-transparent shadow-sm hover:border-indigo-100" title="Message PM">
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                                <Link to={`/project/${p.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition duration-200 border border-indigo-100">
                                                    View
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
