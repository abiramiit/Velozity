import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/axios';
import { toast } from 'react-hot-toast';

export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export interface User {
    id: string;
    email: string;
    role: Role;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const refreshingRef = useRef<Promise<void> | null>(null);

    const fetchMe = async () => {
        if (refreshingRef.current) return refreshingRef.current;
        refreshingRef.current = (async () => {
            try {
                const { data } = await api.post('/auth/refresh');
                if (data.success) {
                    setToken(data.data.accessToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
                    const meRes = await api.get('/auth/me');
                    setUser(meRes.data.data);
                }
            } catch (err) {
                setUser(null);
                setToken(null);
            } finally {
                setLoading(false);
                refreshingRef.current = null;
            }
        })();
        return refreshingRef.current;
    };

    useEffect(() => {
        fetchMe();

        // Logic to refresh token periodically before it expires (15m expiry -> refresh every 10m)
        const interval = setInterval(() => {
            fetchMe();
        }, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const login = async (credentials: any) => {
        try {
            const { data } = await api.post('/auth/login', credentials);
            if (data.success) {
                setToken(data.data.accessToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
                setUser(data.data.user);
                toast.success('Signed in successfully');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid credentials');
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) { }
        setUser(null);
        setToken(null);
        delete api.defaults.headers.common['Authorization'];
        toast.success('Signed out');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
