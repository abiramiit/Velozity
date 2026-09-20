import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { Users, Mail, AlertCircle, CheckSquare, MessageSquare } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function ProjectManagerTeam() {
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { socket } = useSocket();
    const [showMsgModal, setShowMsgModal] = useState<{ id: string, name: string } | null>(null);
    const [msgText, setMsgText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchTeam();

        // Setup simple presence tracking if implemented via WebSocket ping/pongs
        // For now relying on standard load
    }, []);

    const fetchTeam = async () => {
        try {
            const { data } = await api.get('/users/team');
            setTeam(data.data);
            setError(null);
            setLoading(false);
        } catch (err: any) {
            console.error('[DEBUG] Failed loading PM team:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to load team data';
            toast.error(msg);
            setError(`Error: ${msg} (${err.response?.status || 'Network'})`);
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showMsgModal || !msgText.trim()) return;
        setSending(true);
        try {
            // Note: Sending message explicitly maps to standard POST /notifications pattern natively
            await api.post('/notifications', { recipientId: showMsgModal.id, message: msgText });
            toast.success('Message sent to developer');
            setMsgText('');
            setShowMsgModal(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Users className="w-6 h-6 mr-3 text-indigo-600" />
                    My Team Overview
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {error ? (
                    <div className="col-span-full p-12 text-center text-red-500 bg-red-50 rounded-[14px] shadow-sm border border-red-100">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-lg font-bold">Failed to load team</h2>
                        <p className="mt-2">{error}</p>
                    </div>
                ) : team.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-[14px] shadow-sm border border-gray-100">
                        No developers are currently assigned to your projects.
                    </div>
                ) : team.map(dev => {
                    const tasks = dev.tasksAssigned || [];
                    const todo = tasks.filter((t: any) => t.status === 'TODO').length;
                    const inProgress = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
                    const inReview = tasks.filter((t: any) => t.status === 'IN_REVIEW').length;
                    const done = tasks.filter((t: any) => t.status === 'DONE').length;
                    const overdue = tasks.filter((t: any) => t.status === 'OVERDUE' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE')).length;

                    return (
                        <div key={dev.id} className="bg-white p-6 rounded-[14px] shadow-sm border border-gray-100 flex flex-col transition hover:-translate-y-1 hover:shadow-md">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg uppercase shadow-inner">
                                        {dev.email[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{dev.email}</h3>
                                        <div className="flex items-center mt-1">
                                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-1.5 ring-2 ring-white"></span>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Online</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowMsgModal({ id: dev.id, name: dev.email })}
                                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition tooltip-trigger"
                                    title="Message Developer"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                                        <span className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Total Assigned</span>
                                        <span className="text-xl font-black text-gray-800">{tasks.length}</span>
                                    </div>
                                    <div className={`p-3 rounded-xl border text-center ${overdue > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <span className={`block text-xs uppercase tracking-wider font-bold mb-1 ${overdue > 0 ? 'text-red-500' : 'text-gray-400'}`}>Overdue</span>
                                        <span className={`text-xl font-black ${overdue > 0 ? 'text-red-600' : 'text-gray-800'}`}>{overdue}</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>To Do
                                        </span>
                                        <span className="font-bold text-gray-700">{todo}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>In Progress
                                        </span>
                                        <span className="font-bold text-gray-700">{inProgress}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>In Review
                                        </span>
                                        <span className="font-bold text-gray-700">{inReview}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>Done
                                        </span>
                                        <span className="font-bold text-gray-700">{done}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Messaging Modal */}
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
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none outline-none shadow-sm"
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
