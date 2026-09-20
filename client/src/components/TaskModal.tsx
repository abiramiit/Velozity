import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: (task: any) => void;
}

export function TaskModal({ isOpen, onClose, projectId, onSuccess }: TaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [dueDate, setDueDate] = useState('');
    const [assignedDeveloperId, setAssignedDeveloperId] = useState('');
    const [devs, setDevs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setDescription('');
            setPriority('MEDIUM');
            setDueDate('');
            setAssignedDeveloperId('');
            setLoading(false);
            return;
        }

        const endpoint = user?.role === 'PROJECT_MANAGER' ? '/users/team' : '/users?role=DEVELOPER';
        api.get(endpoint).then(res => setDevs(res.data.data)).catch(() => { });
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { toast.error('Title is required'); return; }

        setLoading(true);
        const payload: any = { title, projectId, priority };
        if (description.trim()) payload.description = description;
        if (assignedDeveloperId) payload.assignedDeveloperId = assignedDeveloperId;
        if (dueDate) payload.dueDate = new Date(dueDate).toISOString();

        try {
            const { data } = await api.post('/tasks', payload);
            toast.success('Task created successfully');
            onSuccess(data.data);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[14px] shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Create New Task</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                        <input
                            type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Implement OAuth Flow"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Optional details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white outline-none">
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Developer</label>
                        <select
                            value={assignedDeveloperId} onChange={(e) => setAssignedDeveloperId(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="">-- Unassigned --</option>
                            {devs.map(d => (
                                <option key={d.id} value={d.id}>{d.email}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50">
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
