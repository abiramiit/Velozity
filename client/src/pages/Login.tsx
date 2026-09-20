import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, CheckCircle2, Activity, AlertCircle } from 'lucide-react';
import { api } from '../lib/axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, user, loading } = useAuth();

    // Listen for 401 errors locally without modifying AuthContext handling
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (err) => {
                if (err.response?.config.url === '/auth/login' && err.response?.status === 401) {
                    setError('Invalid email or password');
                }
                return Promise.reject(err);
            }
        );
        return () => api.interceptors.response.eject(interceptor);
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-[#F8FAFC]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (user) {
        if (user.role === 'ADMIN') return <Navigate to="/admin" />;
        if (user.role === 'PROJECT_MANAGER') return <Navigate to="/pm" />;
        return <Navigate to="/dev" />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        await login({ email, password });
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Left Branding Panel */}
            <div className="hidden lg:flex flex-col w-[45%] bg-[#0B1121] relative overflow-hidden p-12 justify-between">
                {/* Subtle background effects */}
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10 flex items-center">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-600/20">
                        <span className="text-white font-bold text-xl">V</span>
                    </div>
                    <span className="text-white text-xl font-bold tracking-tight">VELOZITY</span>
                </div>

                {/* Marketing Copy */}
                <div className="relative z-10 max-w-sm mt-12 mb-auto pt-20">
                    <h2 className="text-white text-[32px] font-bold leading-[1.3] mb-6">
                        Manage your projects.<br />Empower your team.
                    </h2>
                    <p className="text-indigo-100/70 text-[15px] leading-relaxed">
                        A real-time project dashboard optimized specifically for modern software development teams.
                    </p>
                </div>

                {/* Decorative Visual */}
                <div className="relative z-10 w-full max-w-md pb-12">
                    <div className="bg-white/5 backdrop-blur-xl rounded-[14px] p-6 border border-white/10 shadow-2xl">
                        <h3 className="text-indigo-200/50 text-[11px] font-bold tracking-widest uppercase mb-4">Project Progress</h3>
                        <div className="flex justify-between text-white text-[13px] mb-2 font-medium">
                            <span>Platform Migration</span>
                            <span>80%</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full w-[80%]" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center text-[13px] text-indigo-50/90 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-indigo-400 mr-3 shrink-0" />
                                Task matrix design standardized
                            </div>
                            <div className="flex items-center text-[13px] text-indigo-50/90 font-medium">
                                <Activity className="w-5 h-5 text-teal-400 mr-3 shrink-0" />
                                8 developers active globally
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Login Panel */}
            <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 sm:px-12 lg:px-24">
                {/* Mobile Logo */}
                <div className="flex lg:hidden items-center mb-12">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                        <span className="text-white font-bold text-xl">V</span>
                    </div>
                    <span className="text-slate-900 text-xl font-bold tracking-tight">Velozity</span>
                </div>

                <div className="w-full max-w-[420px] mx-auto">
                    <h1 className="text-[32px] font-bold text-slate-900 mb-2">Welcome back</h1>
                    <p className="text-slate-500 text-[15px] mb-8">Sign in to continue to your Velozity dashboard.</p>

                    {error && (
                        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-[10px] flex items-center text-red-600 text-[13px] font-medium shadow-sm">
                            <AlertCircle className="w-4 h-4 mr-3 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-[14px] font-semibold text-slate-700">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email" required autoComplete="email"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-[10px] text-[15px] shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[14px] font-semibold text-slate-700">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-[10px] text-[15px] shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 pb-1">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer" />
                                <label htmlFor="remember-me" className="ml-2 block text-[14px] text-slate-600 cursor-pointer">Remember me</label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-[10px] shadow-sm text-[15px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-[0.98]"
                        >
                            Sign In
                        </button>
                    </form>

                    <div className="mt-12">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-[#F8FAFC] text-slate-500 font-medium">Demo Accounts</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-3">
                            {[
                                { role: 'Admin', email: 'admin@test.com' },
                                { role: 'PM', email: 'pm1@test.com' },
                                { role: 'Dev', email: 'dev1@test.com' }
                            ].map((acc) => (
                                <button
                                    key={acc.email}
                                    type="button"
                                    onClick={() => { setEmail(acc.email); setPassword('password123'); }}
                                    className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-[10px] bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-colors group cursor-pointer"
                                >
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-indigo-500 transition-colors hidden sm:block">{acc.role}</span>
                                    <span className="text-[11px] sm:text-[12px] font-medium text-slate-700 group-hover:text-indigo-700 transition-colors max-w-full truncate px-1">{acc.email.split('@')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
