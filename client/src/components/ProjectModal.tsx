import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (project: any) => void;
}

export function ProjectModal({ isOpen, onClose, onSuccess }: ProjectModalProps) {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [clientId, setClientId] = useState('');
    const [managerId, setManagerId] = useState('');
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setDescription('');
            setClientId('');
            setManagerId('');
            setLoading(false);
            return;
        }

        api.get('/clients').then(res => setClients(res.data.data)).catch(() => { });

        if (user?.role === 'ADMIN') {
            api.get('/users?role=PROJECT_MANAGER').then(res => setManagers(res.data.data)).catch(() => { });
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: any = { name, description, clientId };
        if (user?.role === 'ADMIN') {
            if (!managerId) {
                toast.error('Please assign a Project Manager');
                setLoading(false);
                return;
            }
            payload.createdById = managerId;
        }

        try {
            const { data } = await api.post('/projects', payload);
            toast.success('Project created successfully');
            onSuccess(data.data);
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[14px] shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Create New Project</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Platform Migration"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            placeholder="Optional project description..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Client *</label>
                        <select
                            required
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="" disabled>Select a client...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {user?.role === 'ADMIN' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Project Manager *</label>
                            <select
                                required
                                value={managerId}
                                onChange={(e) => setManagerId(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="" disabled>Select a manager...</option>
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>{m.email}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
