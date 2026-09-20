"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRouter = void 0;
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const validation_1 = require("../utils/validation");
const client_1 = require("@prisma/client");
exports.taskRouter = (0, express_1.Router)();
exports.taskRouter.use(auth_middleware_1.requireAuth);
// Everyone can view their tasks (filtered in controller)
exports.taskRouter.get('/', task_controller_1.getTasks);
exports.taskRouter.get('/:id', task_controller_1.getTaskById);
// Devs can update status of their tasks
exports.taskRouter.patch('/:id/status', (0, validate_middleware_1.validateRequest)(validation_1.taskStatusSchema), task_controller_1.updateTaskStatus);
// Only ADMIN and PM can create/fully update tasks
exports.taskRouter.post('/', (0, auth_middleware_1.requireRole)([client_1.Role.ADMIN, client_1.Role.PROJECT_MANAGER]), (0, validate_middleware_1.validateRequest)(validation_1.taskSchema), task_controller_1.createTask);
exports.taskRouter.patch('/:id', (0, auth_middleware_1.requireRole)([client_1.Role.ADMIN, client_1.Role.PROJECT_MANAGER]), (0, validate_middleware_1.validateRequest)(validation_1.taskSchema), task_controller_1.updateTask);
