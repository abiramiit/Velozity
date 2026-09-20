import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { clientRouter } from './routes/client.routes';
import { projectRouter } from './routes/project.routes';
import { taskRouter } from './routes/task.routes';
import { activityRouter } from './routes/activity.routes';
import { notificationRouter } from './routes/notification.routes';
import { userRouter } from './routes/user.routes';
import { notFound, errorHandler } from './middleware/error.middleware';
import { initSocket } from './services/socket.service';
import { startCronJobs } from './jobs/cron';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO configuration
export const io = new Server(httpServer, {
    cors: {
        origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
initSocket(io);

app.use(helmet());
app.use(cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/health', (req, res) => { res.json({ status: 'ok' }); });
app.use('/api/auth', authRouter);
app.use('/api/clients', clientRouter);
app.use('/api/projects', projectRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/activity', activityRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/users', userRouter);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startCronJobs();
});
