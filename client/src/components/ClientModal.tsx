import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/axios';
import { toast } from 'react-hot-toast';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ClientModal({ isOpen, onClose }: ClientModalProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/clients', { name });
            toast.success('Client created successfully');
            setName('');
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create client');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[14px] shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Register New Client</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name *</label>
                        <input
                            type="text" required value={name} onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Acme Corporation"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50">
                            {loading ? 'Registering...' : 'Register Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
