import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.util';
import { Role } from '@prisma/client';

let io: Server;
const activeUsers = new Map<string, number>();

export const initSocket = (serverIo: Server) => {
    io = serverIo;

    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        try {
            const decoded = verifyAccessToken(token);
            socket.data.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.data.user;
        const currentCount = activeUsers.get(user.id) || 0;
        activeUsers.set(user.id, currentCount + 1);

        if (user.role === Role.ADMIN) {
            socket.join('admin_global');
            socket.emit('presence:update', activeUsers.size);
        }

        io.to('admin_global').emit('presence:update', activeUsers.size);
        socket.join(`user_${user.id}`);

        socket.on('disconnect', () => {
            const count = activeUsers.get(user.id) || 0;
            if (count > 1) {
                activeUsers.set(user.id, count - 1);
            } else {
                activeUsers.delete(user.id);
            }
            io.to('admin_global').emit('presence:update', activeUsers.size);
        });
    });
};

export const broadcastActivity = (projectId: string, assignedUserId: string | null, pmId: string, eventData: any) => {
    if (!io) return;
    io.to('admin_global').emit('activity:new', eventData);
    io.to(`user_${pmId}`).emit('activity:new', eventData);
    if (assignedUserId) {
        io.to(`user_${assignedUserId}`).emit('activity:new', eventData);
    }
};

export const sendNotification = (userId: string, data: any) => {
    if (!io) return;
    io.to(`user_${userId}`).emit('notification:new', data);
};
