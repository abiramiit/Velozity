"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = exports.broadcastActivity = exports.initSocket = void 0;
const jwt_util_1 = require("../utils/jwt.util");
const client_1 = require("@prisma/client");
let io;
const activeUsers = new Map();
const initSocket = (serverIo) => {
    io = serverIo;
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error('Authentication error'));
        try {
            const decoded = (0, jwt_util_1.verifyAccessToken)(token);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
        const currentCount = activeUsers.get(user.id) || 0;
        activeUsers.set(user.id, currentCount + 1);
        if (user.role === client_1.Role.ADMIN) {
            socket.join('admin_global');
            socket.emit('presence:update', activeUsers.size);
        }
        io.to('admin_global').emit('presence:update', activeUsers.size);
        socket.join(`user_${user.id}`);
        socket.on('disconnect', () => {
            const count = activeUsers.get(user.id) || 0;
            if (count > 1) {
                activeUsers.set(user.id, count - 1);
            }
            else {
                activeUsers.delete(user.id);
            }
            io.to('admin_global').emit('presence:update', activeUsers.size);
        });
    });
};
exports.initSocket = initSocket;
const broadcastActivity = (projectId, assignedUserId, pmId, eventData) => {
    if (!io)
        return;
    io.to('admin_global').emit('activity:new', eventData);
    io.to(`user_${pmId}`).emit('activity:new', eventData);
    if (assignedUserId) {
        io.to(`user_${assignedUserId}`).emit('activity:new', eventData);
    }
};
exports.broadcastActivity = broadcastActivity;
const sendNotification = (userId, data) => {
    if (!io)
        return;
    io.to(`user_${userId}`).emit('notification:new', data);
};
exports.sendNotification = sendNotification;
