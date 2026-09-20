import React, { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { ClientModal } from '../components/ClientModal';
import { Plus, Inbox } from 'lucide-react';

export default function AdminClients() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    useEffect(() => {
        api.get('/clients').then(res => {
            setClients(res.data.data);
            setLoading(false);
        }).catch(() => {
            toast.error('Failed to load clients');
            setLoading(false);
        });
    }, []);

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
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold text-gray-900">Clients Workspace</h2>
                    <button onClick={() => setIsClientModalOpen(true)} className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center shadow-sm">
                        <Plus className="w-4 h-4 mr-1.5" />
                        New Client
                    </button>
                </div>
                <div className="p-0 overflow-x-auto">
                    {clients.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center text-gray-500">
                            <Inbox className="w-10 h-10 mb-4 text-gray-300" />
                            <p className="text-sm font-medium">No clients found</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm">No clients match your criteria.</p>
                        </div>
                    ) : (
                        <div className="min-w-[500px]">
                            <div className="grid grid-cols-[minmax(300px,1fr)_150px] gap-4 px-6 py-4 bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                <div className="font-medium">Name</div>
                                <div className="font-medium text-right">Joined</div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {clients.map(c => (
                                    <div key={c.id} className="grid grid-cols-[minmax(300px,1fr)_150px] gap-4 px-6 py-[18px] hover:bg-gray-50/50 transition">
                                        <div className="font-semibold text-gray-900 flex items-center">{c.name}</div>
                                        <div className="flex items-center text-gray-500 justify-end">{new Date(c.createdAt).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} />
        </div>
    );
}
