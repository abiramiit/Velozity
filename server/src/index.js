"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = require("./routes/auth.routes");
const client_routes_1 = require("./routes/client.routes");
const project_routes_1 = require("./routes/project.routes");
const task_routes_1 = require("./routes/task.routes");
const activity_routes_1 = require("./routes/activity.routes");
const notification_routes_1 = require("./routes/notification.routes");
const user_routes_1 = require("./routes/user.routes");
const error_middleware_1 = require("./middleware/error.middleware");
const socket_service_1 = require("./services/socket.service");
const cron_1 = require("./jobs/cron");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}
// Socket.IO configuration
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
(0, socket_service_1.initSocket)(exports.io);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Routes
app.get('/health', (req, res) => { res.json({ status: 'ok' }); });
app.use('/api/auth', auth_routes_1.authRouter);
app.use('/api/clients', client_routes_1.clientRouter);
app.use('/api/projects', project_routes_1.projectRouter);
app.use('/api/tasks', task_routes_1.taskRouter);
app.use('/api/activity', activity_routes_1.activityRouter);
app.use('/api/notifications', notification_routes_1.notificationRouter);
app.use('/api/users', user_routes_1.userRouter);
// Error Handling
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    (0, cron_1.startCronJobs)();
});
